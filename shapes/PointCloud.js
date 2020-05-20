define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/error/ArgumentError',
    'WebWorldWind/shaders/GpuProgram',
    'WebWorldWind/geom/Vec3',
    'WebWorldWind/geom/BoundingBox',
    'WebWorldWind/shapes/AbstractShape',
    'WebWorldWind/pick/PickedObject',
], function(OpusWorldWind, WorldWind, ArgumentError, GpuProgram, Vec3, BoundingBox, AbstractShape, PickedObject) {
    var vertexShaderSource =
        'uniform float pointSize;\n' +
        'uniform vec3 eyePoint;\n' +
        'uniform float depthFactor;\n' + 
        'uniform mat4 mvpMatrix;\n' +
        'attribute vec3 point;\n' +
        'void main() {\n' +
        '   gl_PointSize = pointSize;\n' +
        '   gl_Position = mvpMatrix*vec4(point, 1.);\n' +
        '}\n';

    var circleFragmentShaderSource = 
        'precision mediump float;\n' +
        'uniform vec4 color;\n' +
        'void main() {\n' +
        '   float s = gl_PointCoord.s;\n' +
        '   float t = gl_PointCoord.t;\n' +
        '   float sm = s - 0.5;\n' +
        '   float tm = t - 0.5;\n' +
        '   if(4.*(sm*sm + tm*tm) > 1.) {\n' +
        '       discard;\n' +
        '   } else {\n' +
        '       gl_FragColor = color;\n' +
        '   }\n' +
        '}';

    var glyphFragmentShaderSource = `
        precision mediump float;
        uniform sampler2D tex;

        void main() {
            gl_FragColor = texture2D(tex, gl_PointCoord);
        }
    `;

    var programType = function(fragmentShaderSource, constructorFooter) {
        var Program = function(gl) {
            GpuProgram.call(this, gl, vertexShaderSource, fragmentShaderSource);

            this.pointLocation = this.attributeLocation(gl, 'point');
            this.pointSizeLocation = this.uniformLocation(gl, 'pointSize');
            this.mvpMatrixLocation = this.uniformLocation(gl, 'mvpMatrix');

            constructorFooter.call(this, gl);
        };

        Program.prototype = Object.create(GpuProgram.prototype);

        Program.prototype.loadPointSize = function(gl, pointSize) {
            gl.uniform1f(this.pointSizeLocation, pointSize);
        };

        Program.prototype.loadModelviewProjection = function(gl, matrix) {
            this.loadUniformMatrix(gl, matrix, this.mvpMatrixLocation);
        };
        
        return Program;
    };

    var PointCloudCircleProgram = programType(circleFragmentShaderSource, function(gl) {
        this.colorLocation = this.uniformLocation(gl, 'color');
    });

    PointCloudCircleProgram.prototype.loadColor = function(gl, color) {
        this.loadUniformColor(gl, color, this.colorLocation);
    };

    PointCloudCircleProgram.key = 'WorldWindGpuPointCloudCircleProgram';

    var PointCloudGlyphProgram = programType(glyphFragmentShaderSource, function(gl) {
        this.textureUnitLocation = this.uniformLocation(gl, 'tex');
    });

    PointCloudGlyphProgram.prototype.loadTextureUnit = function(gl, unit) {
        gl.uniform1i(this.textureUnitLocation, unit - gl.TEXTURE0);
    };

    PointCloudGlyphProgram.key = 'WorldWindGpuPointCloudGlyphProgram';

    // data: [latitude1, longitude1, altitude1, latitude2, longitude2, altitude2, ...]
    var PointCloud = function(data, attributes) {
        attributes = attributes || new OpusWorldWind.PointCloudAttributes(null);

        if(!data) {
            data = [];
        }

        if(data.length % 3 !== 0) {
            throw new ArgumentError(WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, 'PointCloud', 'constructor', 'invalidData'));
        }

        AbstractShape.call(this, attributes);
        this._data = data;

        this.expirationInterval = 5000;
    };

    PointCloud.prototype = Object.create(AbstractShape.prototype);
    
    Object.defineProperties(PointCloud.prototype, {
        data: {
            get: function() {
                return this._data;
            },
            set: function(data) {
                this._data = data;
                this.reset();
                if (this.currentData) {
                    delete this.currentData.points; // prevent points from being used by addPositions
                }
            }
        }
    });

    // Adds positions more efficiently than updating the data property directly.
    // data: [latitude1, longitude1, altitude1, latitude2, longitude2, altitude2, ...]
    PointCloud.prototype.addPositions = function(dc, data) {
        if(data.length % 3 !== 0) {
            throw new ArgumentError(WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, 'PointCloud', 'addPositions', 'invalidData'));
        }
        var insertIndex = this._data.length;
        for(var i = 0; i !== data.length; ++i) {
            this._data.push(data[i]);
        }
        var currentData = this.currentData;
        if(!currentData || !currentData.points) {
            // no data to update, just reset
            this.reset();
            return;
        }
        // update currentData
        var points = new Float32Array(this._data.length);
        var pt = new Vec3(0, 0, 0);
        points.set(currentData.points);
        for(var i = insertIndex; i !== this._data.length; i += 3) {
            dc.surfacePointForMode(this._data[i], this._data[i + 1], this._data[i + 2], this._altitudeMode, pt);
            points[i] = pt[0];
            points[i + 1] = pt[1];
            points[i + 2] = pt[2];
        }
        currentData.points = points;
        // TODO update the bounding box using only the added points (instead of recomputing it using all points)
        this.computeExtent();
        currentData.refreshVertexBuffer = true;
    };

    PointCloud.prototype.doMakeOrderedRenderable = function(dc) {
        var currentData = this.currentData;
        if(!currentData.isExpired && currentData.points) {
            // points already generated, re-use existing data
            return this;
        }
        currentData.points = new Float32Array(this._data.length);
        var pt = new Vec3(0, 0, 0);
        if(this._data.length % 3 !== 0) {
            throw new ArgumentError(WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, 'PointCloud', 'doMakeOrderedRenderable', 'invalidData'));
        }
        for(var i = 0; i !== this._data.length; i += 3) {
            dc.surfacePointForMode(this._data[i], this._data[i + 1], this._data[i + 2], this._altitudeMode, pt);
            currentData.points[i] = pt[0];
            currentData.points[i + 1] = pt[1];
            currentData.points[i + 2] = pt[2];
        }
        currentData.eyeDistance = 0; // no way to calculate this efficiently, rely on depth buffer when possible
        this.computeExtent();
        currentData.refreshVertexBuffer = true;
        this.resetExpiration(currentData);
        return this;
    };

    PointCloud.prototype.computeExtent = function() {
        var currentData = this.currentData;
        if(currentData.points.length === 0) {
            delete currentData.extent;
        } else {
            currentData.extent = new BoundingBox();
            currentData.extent.setToPoints(currentData.points);
            if(currentData.extent.radius < 1) {
                // bounding box too small, don't use one
                delete currentData.extent;
            }
        }
    };

    PointCloud.prototype.beginDrawing = function(dc) {
        var gl = dc.currentGlContext;
        if(this.activeAttributes.imageSource) {
            dc.findAndBindProgram(PointCloudGlyphProgram);
        } else {
            dc.findAndBindProgram(PointCloudCircleProgram);
        }
        gl.enableVertexAttribArray(dc.currentProgram.pointLocation);
    };

    PointCloud.prototype.doRenderOrdered = function(dc) {
        var gl = dc.currentGlContext;
        var currentData = this.currentData;

        if(currentData.points.length === 0) {
            return;
        }

        var pickColor;
        if(dc.pickingMode) {
            pickColor = dc.uniquePickColor();
        }

        if(!currentData.vboCacheKey) {
            currentData.vboCacheKey = dc.gpuResourceCache.generateCacheKey();
        }

        var vboId = dc.gpuResourceCache.resourceForKey(currentData.vboCacheKey);
        if(!vboId) {
            vboId = gl.createBuffer();
            currentData.refreshVertexBuffer = true;
        }

        var glyphTexture = null;
        if(this.activeAttributes.imageSource) {
            glyphTexture = dc.gpuResourceCache.resourceForKey(this.activeAttributes.imageSource);
            if(!glyphTexture) {
                glyphTexture = dc.gpuResourceCache.retrieveTexture(gl, this.activeAttributes.imageSource);
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, vboId);
        if(currentData.refreshVertexBuffer) {
            dc.gpuResourceCache.putResource(currentData.vboCacheKey, vboId, currentData.points.length*4);
            gl.bufferData(gl.ARRAY_BUFFER, currentData.points, gl.STATIC_DRAW);
            dc.frameStatistics.incrementVboLoadCount(1);
            currentData.refreshVertexBuffer = false;
        }

        if(this.activeAttributes.drawInterior) {
            var prevRange = gl.getParameter(gl.DEPTH_RANGE);
            if(this.activeAttributes.offsetDepth) {
                gl.depthRange(0.0, 0.997);
            } 
            dc.currentProgram.loadPointSize(gl, this.activeAttributes.pointSize);
            this.applyMvpMatrix(dc);
            if(glyphTexture) {
                if(!glyphTexture.bind(dc)) {
                    throw new ArgumentError(WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, 'PointCloud', 'doMakeOrderedRenderable', 'invalidData'));
                }
                dc.currentProgram.loadTextureUnit(gl, gl.TEXTURE0);
            } else {
                dc.currentProgram.loadColor(gl, this.activeAttributes.interiorColor);
            }
            gl.vertexAttribPointer(dc.currentProgram.pointLocation, 3, gl.FLOAT, false, 12, 0);
            gl.drawArrays(gl.POINTS, 0, this._data.length/3);
            gl.depthRange(prevRange[0], prevRange[1]);
        }

        if(dc.pickingMode) {
            var po = new PickedObject(pickColor, this.pickDelegate ? this.pickDelegate : this, null, dc.currentLayer, false);
            dc.resolvePick(po);
        }
    };

    PointCloud.prototype.endDrawing = function(dc) {
        var gl = dc.currentGlContext;
        gl.disableVertexAttribArray(dc.currentProgram.pointLocation);
    };

    OpusWorldWind.PointCloud = PointCloud;
    return PointCloud;
});
