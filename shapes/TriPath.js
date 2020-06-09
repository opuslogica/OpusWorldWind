define([
    'WebWorldWind/WorldWind',
    'WebWorldWind/shapes/Path',
    'WebWorldWind/geom/Vec3',
    'WebWorldWind/geom/Matrix',
    'WebWorldWind/pick/PickedObject',
    'OpusWorldWind/programs/TriPathProgram',
    'OpusWorldWind/misc/ExtUtils'
], function (WorldWind, Path, Vec3, Matrix, PickedObject, TriPathProgram, ExtUtils) {
    /**
     * A variant of Path that uses TRIANGLE_STRIP to render lines instead of LINE_STRIP and lineWidth (lineWidth is unsupported on modern browsers).
     */
    var TriPath = function (positions, attributes) {
        Path.call(this, positions, attributes);

        this._pickBoundaryWidth = 10;
    };

    TriPath.prototype = Object.create(Path.prototype);

    Object.defineProperties(TriPath.prototype, {
        /**
         * The extra width added to the outlineWidth when rendering in picking mode.
         */
        pickBoundaryWidth: {
            get: function () {
                return this._pickBoundaryWidth;
            },
            set: function (pickBoundaryWidth) {
                this._pickBoundaryWidth = pickBoundaryWidth;
                this.reset();
            }
        }
    });

    TriPath.prototype.computeRenderedPath = function (dc, tessellatedPositions) {
        var altitudeMode;
        if (this._followTerrain && this.altitudeMode !== WorldWind.CLAMP_TO_GROUND)
        {
            altitudeMode = WorldWind.RELATIVE_TO_GROUND;
        } else
        {
            altitudeMode = this.altitudeMode;
        }
        var eyeDistSquared = Number.MAX_VALUE;
        var tessellatedPoints = new Float32Array(tessellatedPositions.length * 3 * 2 * 2);
        var pt = new Vec3(0, 0, 0), lastPt = new Vec3(0, 0, 0), normal = new Vec3(0, 0, 0), offsDir = new Vec3(0, 0, 0);
        var mat = Matrix.fromIdentity();
        {
            var p1 = tessellatedPositions[0], p2 = tessellatedPositions[1];
            dc.surfacePointForMode(p1.latitude, p1.longitude, p1.altitude, altitudeMode, lastPt);
            dc.surfacePointForMode(p2.latitude, p2.longitude, p2.altitude, altitudeMode, offsDir);
            offsDir.subtract(lastPt).normalize();
        }
        for (var i = 0; i !== tessellatedPositions.length; ++i)
        {
            var pos = tessellatedPositions[i];
            dc.surfacePointForMode(pos.latitude, pos.longitude, pos.altitude, altitudeMode, pt);
            if (i > 0)
            {
                offsDir.copy(pt).subtract(lastPt).normalize();
            }
            lastPt.copy(pt);
            dc.globe.surfaceNormalAtLocation(pos.latitude, pos.longitude, normal);
            mat.setToIdentity();
            mat.multiplyByRotation(normal[0], normal[1], normal[2], 90);
            offsDir.multiplyByMatrix(mat);

            eyeDistSquared = Math.min(pt.distanceToSquared(dc.eyePoint), eyeDistSquared);
            pt.subtract(this.currentData.referencePoint);
            tessellatedPoints[i * 12 + 0] = pt[0];
            tessellatedPoints[i * 12 + 1] = pt[1];
            tessellatedPoints[i * 12 + 2] = pt[2];
            tessellatedPoints[i * 12 + 3] = offsDir[0];
            tessellatedPoints[i * 12 + 4] = offsDir[1];
            tessellatedPoints[i * 12 + 5] = offsDir[2];
            offsDir.multiply(-1);
            tessellatedPoints[i * 12 + 6] = pt[0];
            tessellatedPoints[i * 12 + 7] = pt[1];
            tessellatedPoints[i * 12 + 8] = pt[2];
            tessellatedPoints[i * 12 + 9] = offsDir[0];
            tessellatedPoints[i * 12 + 10] = offsDir[1];
            tessellatedPoints[i * 12 + 11] = offsDir[2];
        }
        this.currentData.eyeDistance = Math.sqrt(eyeDistSquared);
        return tessellatedPoints;
    };

    TriPath.prototype.doRenderOrdered = function (dc) {
        try
        {
            if (this.activeAttributes.drawOutline)
            {
                var gl = dc.currentGlContext, program = dc.currentProgram, currentData = this.currentData;

                this.applyMvpMatrixForOutline(dc);

                if (!currentData.ptVboCacheKey)
                {
                    currentData.ptVboCacheKey = dc.gpuResourceCache.generateCacheKey();
                }

                if (!currentData.offsDirVboCacheKey)
                {
                    currentData.offsDirVboCacheKey = dc.gpuResourceCache.generateCacheKey();
                }

                var vboId = dc.gpuResourceCache.resourceForKey(currentData.ptVboCacheKey);
                if (!vboId)
                {
                    vboId = gl.createBuffer();
                    dc.gpuResourceCache.putResource(currentData.ptVboCacheKey, vboId, currentData.tessellatedPoints.length * 4);
                    currentData.fillVbo = true;
                }

                gl.bindBuffer(gl.ARRAY_BUFFER, vboId);
                if (currentData.fillVbo)
                {
                    gl.bufferData(gl.ARRAY_BUFFER, currentData.tessellatedPoints, gl.STATIC_DRAW);
                    dc.frameStatistics.incrementVboLoadCount(1);
                }
                currentData.fillVbo = false;

                program.loadTextureEnabled(gl, false);

                var color, opacity;
                if (dc.pickingMode)
                {
                    color = dc.uniquePickColor();
                    opacity = 1;
                } else
                {
                    color = this.activeAttributes.outlineColor;
                    opacity = color.alpha * this.layer.opacity;
                }

                if (opacity < 1)
                {
                    gl.depthMask(false);
                }

                program.loadPixelSizeOffset(gl, dc.pixelSizeOffset);
                program.loadPixelSizeScale(gl, dc.pixelSizeFactor);
                program.loadLineWidth(gl, dc.pickingMode ? this.activeAttributes.outlineWidth + this._pickBoundaryWidth : this.activeAttributes.outlineWidth);
                program.loadEyePoint(gl, dc.eyePoint);
                program.loadReferencePoint(gl, currentData.referencePoint);
                program.loadColor(gl, color);
                program.loadOpacity(gl, opacity);

                gl.vertexAttribPointer(program.vertexPointLocation, 3, gl.FLOAT, false, 24, 0);
                gl.vertexAttribPointer(program.offsDirLocation, 3, gl.FLOAT, false, 24, 12);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, currentData.tessellatedPoints.length / 6);

                if (dc.pickingMode)
                {
                    var po = new PickedObject(color, this.pickDelegate ? this.pickDelegate : this, null, dc.currentLayer, false);
                    dc.resolvePick(po);
                }
            }
        } catch (e)
        {
            console.error(e);
        }
    };

    TriPath.prototype.beginDrawing = function (dc) {
        var gl = dc.currentGlContext;
        dc.findAndBindProgram(TriPathProgram);
        gl.enableVertexAttribArray(dc.currentProgram.vertexPointLocation);
        gl.enableVertexAttribArray(dc.currentProgram.offsDirLocation);
    };

    TriPath.prototype.endDrawing = function (dc) {
        var gl = dc.currentGlContext;
        gl.disableVertexAttribArray(dc.currentProgram.vertexPointLocation);
        gl.disableVertexAttribArray(dc.currentProgram.offsDirLocation);
        gl.depthMask(true);
        gl.lineWidth(1);
        gl.enable(gl.CULL_FACE);
    };

    return TriPath;
});
