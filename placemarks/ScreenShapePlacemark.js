define([
    'WebWorldWind/WorldWind',
    'WebWorldWind/shaders/BasicProgram',
    'WebWorldWind/shapes/AbstractShape',
    'WebWorldWind/geom/Vec2',
    'WebWorldWind/geom/Vec3',
    'WebWorldWind/geom/Matrix',
    'WebWorldWind/pick/PickedObject',
    'OpusWorldWind/placemarks/ScreenShapePlacemarkAttributes'
], function (WorldWind, BasicProgram, AbstractShape, Vec2, Vec3, Matrix, PickedObject, ScreenShapePlacemarkAttributes) {
    if (!hull)
    {
        throw new Error('hull library is required for ScreenShapePlacemark: https://github.com/AndriiHeonia/hull');
    }

    var ScreenShapePlacemark = function (unitVertices, position, attributes) {
        if (attributes === undefined)
        {
            attributes = new ScreenShapePlacemarkAttributes();
        }
        AbstractShape.call(this, attributes);
        this._unitVertices = unitVertices;
        this._unitVerticesArr = Float32Array.from(this._unitVertices);
        this._position = position;
        this._width = 84;
        this._height = 84;
        this._offset = new Vec2(0, 0);
        this.depthOffset = -0.003;
        this.alwaysOnTop = false;
    };

    ScreenShapePlacemark.prototype = Object.create(AbstractShape.prototype);

    Object.defineProperties(ScreenShapePlacemark.prototype, {
        unitVertices: {
            get: function () {
                return this._unitVertices;
            },
            set: function (unitVertices) {
                this._unitVertices = unitVertices;
                this._unitVerticesArr = Float32Array.from(this._unitVertices);
                this.reset();
            }
        },
        position: {
            get: function () {
                return this._position;
            },
            set: function (position) {
                this._position = position;
                this.reset();
            }
        },
        width: {
            get: function () {
                return this._width;
            },
            set: function (width) {
                this._width = width;
                this.reset();
            }
        },
        height: {
            get: function () {
                return this._height;
            },
            set: function (height) {
                this._height = height;
                this.reset();
            }
        },
        offset: {
            get: function () {
                return this._offset;
            },
            set: function (offset) {
                this._offset = offset;
                this.reset();
            }
        }
    });

    ScreenShapePlacemark.prototype._computeOutlineVertices = function () {
        var currentData = this.currentData;
        var points = [];
        for (var i = 0; i !== this._unitVertices.length; i += 2)
        {
            points.push([
                this._unitVertices[i],
                this._unitVertices[i + 1]
            ]);
        }
        if (points.length > 3)
        {
            points = hull(points);
        } else
        {
            points.push(points[0]);
        }
        for (var i = 0; i !== points.length; ++i)
        {
            var pt = points[i];
            var v = new Vec3(pt[0], pt[1], 0).multiplyByMatrix(currentData.shapeTransform);
            points[i] = [v[0], v[1]];
        }
        if (points.length < 3)
        {
            return [];
        } else
        {
            var innerPoints = [];
            var outerPoints = [];
            for (var i = 0; i !== points.length - 1; ++i)
            {
                var a = points[i === 0 ? points.length - 2 : i - 1];
                var b = points[i];
                var c = points[i + 1];
                var ba = new Vec2(b[0] - a[0], b[1] - a[1]);
                var bc = new Vec2(b[0] - c[0], b[1] - c[1]);
                ba.normalize();
                bc.normalize();
                var v = new Vec2(ba[0] + bc[0], ba[1] + bc[1]);
                if (v.magnitudeSquared() < Number.EPSILON)
                {
                    var w = new Vec3(v[0], v[1], 0);
                    w.multiplyByMatrix(Matrix.fromIdentity().multiplyByRotation(0, 0, 1, -90));
                    v = new Vec2(w[0], w[1]);
                }
                v.normalize();
                var outlineWidth = this.activeAttributes.outlineWidth + 0.5;
                innerPoints.push(new Vec2(b[0] + v[0] * outlineWidth / 2, b[1] + v[1] * outlineWidth / 2));
                outerPoints.push(new Vec2(b[0] - v[0] * outlineWidth / 2, b[1] - v[1] * outlineWidth / 2));
            }
            innerPoints.push(innerPoints[0]);
            outerPoints.push(outerPoints[0]);
            var res = [];
            for (var i = 0; i !== points.length - 1; ++i)
            {
                var pi1 = innerPoints[i];
                var pi2 = innerPoints[i + 1];
                var po1 = outerPoints[i];
                var po2 = outerPoints[i + 1];
                res.push(pi1[0]);
                res.push(pi1[1]);
                res.push(pi2[0]);
                res.push(pi2[1]);
                res.push(po1[0]);
                res.push(po1[1]);
                res.push(po2[0]);
                res.push(po2[1]);
                res.push(po1[0]);
                res.push(po1[1]);
                res.push(pi2[0]);
                res.push(pi2[1]);
            }
            return res;
        }
    };

    ScreenShapePlacemark.prototype.doMakeOrderedRenderable = function (dc) {
        var currentData = this.currentData;
        var surfacePoint = new Vec3(0, 0, 0);
        var screenPoint = new Vec3(0, 0, 0);
        dc.surfacePointForMode(this._position.latitude, this._position.longitude, this._position.altitude, this._altitudeMode, surfacePoint);
        if (!dc.projectWithDepth(surfacePoint, this.depthOffset, screenPoint))
        {
            return null;
        }
        currentData.eyeDistance = this.alwaysOnTop ? 0 : surfacePoint.distanceTo(dc.eyePoint);
        currentData.shapeTransform = Matrix.fromIdentity();
        currentData.shapeTransform.setScale(dc.pixelScale * this._width / 2, dc.pixelScale * this._height / 2, 1);
        currentData.shapeTransform.setTranslation(screenPoint[0] + this._offset[0] * dc.pixelScale, screenPoint[1] + this._offset[1] * dc.pixelScale, screenPoint[2]);
        currentData.shapeTransform.setTranslation(screenPoint[0] + this._offset[0], screenPoint[1] + this._offset[1], screenPoint[2]);
        return this;
    };

    ScreenShapePlacemark.prototype.beginDrawing = function (dc) {
        var gl = dc.currentGlContext;
        dc.findAndBindProgram(BasicProgram);
        gl.enableVertexAttribArray(dc.currentProgram.vertexPointLocation);
    };

    ScreenShapePlacemark.prototype.doRenderOrdered = function (dc) {
        var gl = dc.currentGlContext;
        var currentData = this.currentData;
        var depthTestWasEnabled = gl.isEnabled(gl.DEPTH_TEST);

        if (dc.pickingMode && !this.activeAttributes.allowPicking)
        {
            return;
        }

        if (this.activeAttributes.depthTest)
        {
            gl.enable(gl.DEPTH_TEST);
        } else
        {
            gl.disable(gl.DEPTH_TEST);
        }

        if (!currentData.shapeVboKey)
        {
            currentData.shapeVboKey = dc.gpuResourceCache.generateCacheKey();
        }
        if (!currentData.outlineVboKey)
        {
            currentData.outlineVboKey = dc.gpuResourceCache.generateCacheKey();
        }

        var pickColor;
        if (dc.pickingMode)
        {
            pickColor = dc.uniquePickColor();
        }

        var program = dc.currentProgram;

        if (this.activeAttributes.drawInterior)
        {
            var shapeVboId = dc.gpuResourceCache.resourceForKey(currentData.shapeVboKey);

            if (!shapeVboId)
            {
                shapeVboId = gl.createBuffer();
                dc.gpuResourceCache.putResource(currentData.shapeVboKey, shapeVboId, this._unitVerticesArr.length * 4);
                gl.bindBuffer(gl.ARRAY_BUFFER, shapeVboId);
                gl.bufferData(gl.ARRAY_BUFFER, this._unitVerticesArr, gl.STATIC_DRAW);
                dc.frameStatistics.incrementVboLoadCount(1);
            }

            var mvpMatrix = new Matrix();
            mvpMatrix.copy(dc.screenProjection);
            mvpMatrix.multiplyMatrix(currentData.shapeTransform);
            program.loadModelviewProjection(gl, mvpMatrix);
            program.loadColor(gl, dc.pickingMode ? pickColor : this.activeAttributes.interiorColor);
            gl.bindBuffer(gl.ARRAY_BUFFER, shapeVboId);
            gl.vertexAttribPointer(program.vertexPointLocation, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, this._unitVerticesArr.length / 2);
        }

        if (this.activeAttributes.drawOutline && this.activeAttributes.outlineWidth >= 1)
        {
            var outlineVboId = dc.gpuResourceCache.resourceForKey(currentData.outlineVboKey);
            var outlineVerticesArr = Float32Array.from(this._computeOutlineVertices());

            if (!outlineVboId)
            {
                outlineVboId = gl.createBuffer();
                dc.gpuResourceCache.putResource(currentData.outlineVboKey, outlineVboId, outlineVerticesArr.length * 4);
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, outlineVboId);
            gl.bufferData(gl.ARRAY_BUFFER, outlineVerticesArr, gl.STATIC_DRAW);
            dc.frameStatistics.incrementVboLoadCount(1);

            var mvpMatrix = new Matrix();
            mvpMatrix.copy(dc.screenProjection);
            program.loadModelviewProjection(gl, mvpMatrix);
            program.loadColor(gl, dc.pickingColor ? pickColor : this.activeAttributes.outlineColor);
            gl.bindBuffer(gl.ARRAY_BUFFER, outlineVboId);
            gl.vertexAttribPointer(program.vertexPointLocation, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, outlineVerticesArr.length / 2);
        }

        if (dc.pickingMode)
        {
            var po = new PickedObject(pickColor, this.pickDelegate ? this.pickDelegate : this, this.position, dc.currentLayer, false);
            dc.resolvePick(po);
        }

        if (depthTestWasEnabled)
        {
            gl.enable(gl.DEPTH_TEST);
        } else
        {
            gl.disable(gl.DEPTH_TEST);
        }
    };

    ScreenShapePlacemark.prototype.endDrawing = function (dc) {
        var gl = dc.currentGlContext;
        gl.disableVertexAttribArray(dc.currentProgram.vertexPointLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };

    return ScreenShapePlacemark;
});
