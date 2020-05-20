define([
    'OpusWorldWind/OpusWorldWind',
    'OpusWorldWind/placemarks/PointPlacemarkAttributes',
    'WebWorldWind/WorldWind',
    'WebWorldWind/shapes/AbstractShape',
    'WebWorldWind/shaders/GpuProgram',
    'WebWorldWind/geom/Matrix',
    'WebWorldWind/pick/PickedObject'
], function (OpusWorldWind, PointPlacemarkAttributes, WorldWind, AbstractShape, GpuProgram, Matrix, PickedObject) {
    var PointProgram = function (gl) {
        var vertexShaderSource =
            'uniform float pointSize;' +
            'uniform mat4 mvpMatrix;' +
            'attribute vec3 vertexPoint;' +
            'void main() {' +
            '   gl_PointSize = pointSize;' +
            '   gl_Position = mvpMatrix * vec4(vertexPoint, 1);' +
            '}';
        var fragmentShaderSource =
            'precision mediump float;' +
            'uniform vec4 color;' +
            'void main() {' +
            '   float s = gl_PointCoord.s;' +
            '   float t = gl_PointCoord.t;' +
            '   if(4.*((s-0.5)*(s-0.5) + (t-0.5)*(t-0.5)) > 1.) {' +
            '       gl_FragColor = vec4(0.,0.,0.,0.);' +
            '   } else {' +
            '       gl_FragColor = color;' +
            '   }' +
            '}';
        GpuProgram.call(this, gl, vertexShaderSource, fragmentShaderSource);
        this.vertexPointLocation = this.attributeLocation(gl, 'vertexPoint');
        this.pointSizeLocation = this.uniformLocation(gl, 'pointSize');
        this.mvpMatrixLocation = this.uniformLocation(gl, 'mvpMatrix');
        this.colorLocation = this.uniformLocation(gl, 'color');
    };

    PointProgram.key = 'WorldWindGpuPointProgram';

    PointProgram.prototype = Object.create(GpuProgram.prototype);

    PointProgram.prototype.loadPointSize = function (gl, pointSize) {
        gl.uniform1f(this.pointSizeLocation, pointSize);
    };

    PointProgram.prototype.loadModelviewProjection = function (gl, matrix) {
        this.loadUniformMatrix(gl, matrix, this.mvpMatrixLocation);
    };

    PointProgram.prototype.loadColor = function (gl, color) {
        this.loadUniformColor(gl, color, this.colorLocation);
    };

    PointProgram.prototype.loadColorComponents = function (gl, red, green, blue, alpha) {
        this.loadUniformColorComponents(gl, red, green, blue, alpha, this.colorLocation);
    };

    var PointPlacemark = function (position, attributes) {
        attributes = attributes || new PointPlacemarkAttributes(null);

        if (!position)
        {
            throw new WorldWind.ArgumentError(WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "PointPlacemark", "constructor", "missingPosition"));
        }

        AbstractShape.call(this, attributes);

        this._position = position;
        this.depthOffset = -0.003;
    };


    PointPlacemark.prototype = Object.create(AbstractShape.prototype);

    Object.defineProperties(PointPlacemark.prototype, {
        position: {
            get: function () {
                return this._position;
            },
            set: function (position) {
                this._position = position;
                this.reset();
            }
        }
    });

    PointPlacemark.prototype.doMakeOrderedRenderable = function (dc) {
        var currentData = this.currentData;
        var surfacePoint = new WorldWind.Vec3();
        var screenPoint = new WorldWind.Vec3();
        dc.surfacePointForMode(this.position.latitude, this.position.longitude, this.position.altitude, this.altitudeMode, surfacePoint);
        if (!dc.projectWithDepth(surfacePoint, this.depthOffset, screenPoint))
        {
            return null;
        }
        currentData.screenPoint = screenPoint;
        currentData.eyeDistance = surfacePoint.distanceTo(dc.eyePoint);
        return this;
    };

    PointPlacemark.prototype.beginDrawing = function (dc) {
        var gl = dc.currentGlContext;
        dc.findAndBindProgram(PointProgram);
        gl.enableVertexAttribArray(dc.currentProgram.vertexPointLocation);
    };

    PointPlacemark.prototype.doRenderOrdered = function (dc) {
        var currentData = this.currentData;
        var gl = dc.currentGlContext;
        var program = dc.currentProgram;

        if (!currentData.vboKey)
        {
            currentData.vboKey = dc.gpuResourceCache.generateCacheKey();
        }

        var vboId = dc.gpuResourceCache.resourceForKey(currentData.vboKey);
        if (!vboId)
        {
            vboId = gl.createBuffer();
            var data = Float32Array.from([0, 0, 0]);
            dc.gpuResourceCache.putResource(currentData.vboKey, vboId, data.length * 4);
            gl.bindBuffer(gl.ARRAY_BUFFER, vboId);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
            dc.frameStatistics.incrementVboLoadCount(1);
        }

        var pickColor;
        if (dc.pickingMode)
        {
            pickColor = dc.uniquePickColor();
        }

        var mvpMatrix = Matrix.fromIdentity();
        mvpMatrix.copy(dc.screenProjection);
        mvpMatrix.multiplyByTranslation(currentData.screenPoint[0], currentData.screenPoint[1], currentData.screenPoint[2]);

        program.loadPointSize(gl, this.activeAttributes.pointSize);
        program.loadModelviewProjection(gl, mvpMatrix);
        program.loadColor(gl, dc.pickingMode ? pickColor : this.activeAttributes.interiorColor);
        gl.bindBuffer(gl.ARRAY_BUFFER, vboId);
        gl.vertexAttribPointer(program.vertexPointLocation, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.POINTS, 0, 1);

        if (dc.pickingMode)
        {
            var po = new PickedObject(pickColor, this.pickDelegate ? this.pickDelegate : this, this.position, dc.currentLayer, false);
            dc.resolvePick(po);
        }
    };

    PointPlacemark.prototype.endDrawing = function (dc) {
        gl.disableVertexAttribArray(dc.currentProgram.vertexPointLocation);
    };

    // OpusWorldWind.PointProgram = PointProgram;

    return PointPlacemark;
});
