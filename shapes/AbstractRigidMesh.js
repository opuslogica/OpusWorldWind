define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/shapes/AbstractMesh',
    'WebWorldWind/geom/Matrix',
    'WebWorldWind/geom/Vec3',
    'WebWorldWind/geom/Position',
    'WebWorldWind/geom/Angle',
    'WebWorldWind/util/Logger',
    'WebWorldWind/error/UnsupportedOperationError'
], function (OpusWorldWind, WorldWind, AbstractMesh, Matrix, Vec3, Position, Angle, Logger, UnsupportedOperationError) {
    var AbstractRigidMesh = function (center, attributes) {
        AbstractMesh.call(this, attributes);

        this._center = center;
        this._pitch = 0;
        this._roll = 0;
        this._heading = 0;
        this._halfWidth = 1.0;
        this._halfLength = 1.0;
        this._halfHeight = 1.0;
        this._skewX = 90;
        this._skewY = 90;

        this._needsRecompute = false;
        this.referencePosition = this._center;
    };

    AbstractRigidMesh.prototype = Object.create(AbstractMesh.prototype);

    Object.defineProperties(AbstractRigidMesh.prototype, {
        center: {
            get: function () {
                return this._center;
            },
            set: function (center) {
                this._center = center;
                this.referencePosition = center;
                this._needsRecompute = true;
                this.reset();
            }
        },
        pitch: {
            get: function () {
                return this._pitch;
            },
            set: function (pitch) {
                this._pitch = pitch;
                this._needsRecompute = true;
                this.reset();
            }
        },
        roll: {
            get: function () {
                return this._roll;
            },
            set: function (roll) {
                this._roll = roll;
                this._needsRecompute = true;
                this.reset();
            }
        },
        heading: {
            get: function () {
                return this._heading;
            },
            set: function (heading) {
                this._heading = heading;
                this._needsRecompute = true;
                this.reset();
            }
        },
        halfWidth: {
            get: function () {
                return this._halfWidth;
            },
            set: function (halfWidth) {
                this._halfWidth = halfWidth;
                this._needsRecompute = true;
                this.reset();
            }
        },
        halfLength: {
            get: function () {
                return this._halfLength;
            },
            set: function (halfLength) {
                this._halfLength = halfLength;
                this._needsRecompute = true;
                this.reset();
            }
        },
        halfHeight: {
            get: function () {
                return this._halfHeight;
            },
            set: function (halfHeight) {
                this._halfHeight = halfHeight;
                this._needsRecompute = true;
                this.reset();
            }
        },
        skewX: {
            get: function () {
                return this._skewX;
            },
            set: function (skewX) {
                this._skewX = skewX;
                this._needsRecompute = true;
                this.reset();
            }
        },
        skewY: {
            get: function () {
                return this._skewY;
            },
            set: function (skewY) {
                this._skewY = skewY;
                this._needsRecompute = true;
                this.reset();
            }
        }
    });

    var EPSILON = 1.0e-6;

    AbstractRigidMesh.multiplyMatrixBySkew = function (matrix, theta, phi) {
        // from World-Wind-Java
        var cotTheta = 1.0e6;
        var cotPhi = 1.0e6;
        var thetaRad = theta * Angle.DEGREES_TO_RADIANS;
        var phiRad = phi * Angle.DEGREES_TO_RADIANS;
        if (thetaRad < EPSILON && phiRad < EPSILON)
        {
            cotTheta = 0;
            cotPhi = 0;
        } else
        {
            if (Math.abs(Math.tan(thetaRad)) > EPSILON)
            {
                cotTheta = 1 / Math.tan(thetaRad);
            }
            if (Math.abs(Math.tan(phiRad)) > EPSILON)
            {
                cotPhi = 1 / Math.tan(phiRad);
            }
        }
        matrix.multiply(1.0, 0.0, -cotTheta, 0,
            0.0, 1.0, -cotPhi, 0,
            0.0, 0.0, 1.0, 0,
            0.0, 0.0, 0.0, 1.0);
        return matrix;
    };

    var skewSymmetricCrossProductMatrix = function (v, result) {
        result[0] = 0;
        result[1] = -v[2];
        result[2] = v[1];
        result[3] = 0;
        result[4] = v[2];
        result[5] = 0;
        result[6] = -v[0];
        result[7] = 0;
        result[8] = -v[1];
        result[9] = v[0];
        result[10] = 0;
        result[11] = 0;
        result[12] = 0;
        result[13] = 0;
        result[14] = 0;
        result[15] = 0;
        return result;
    };

    var addMatrixToMatrix = function (matrix1, matrix2) {
        for (var i = 0; i != 16; ++i)
        {
            matrix1[i] += matrix2[i];
        }
        return matrix1;
    };

    var multiplyMatrixByNumber = function (matrix, term) {
        for (var i = 0; i != 16; ++i)
        {
            matrix[i] *= term;
        }
        return matrix;
    };

    var multiplyMatrixByVectorToVectorRotation = function (matrix, a, b) {
        // https://math.stackexchange.com/questions/180418/calculate-rotation-matrix-to-align-vector-a-to-vector-b-in-3d 
        // with a special case for opposite-direction-pointing vectors
        var v = new Vec3(0, 0, 0).copy(a).cross(b);
        if (v.magnitudeSquared() < EPSILON)
        {
            var xScale = 1, yScale = 1, zScale = 1;
            if (Math.abs(a[0] + b[0]) < EPSILON)
            {
                xScale *= -1;
            }
            if (Math.abs(a[1] + b[1]) < EPSILON)
            {
                yScale *= -1;
            }
            if (Math.abs(a[2] + b[2]) < EPSILON)
            {
                zScale *= -1;
            }
            matrix.multiplyByScale(xScale, yScale, zScale);
        } else
        {
            var vx = skewSymmetricCrossProductMatrix(v, Matrix.fromIdentity());
            var mat = Matrix.fromIdentity();
            addMatrixToMatrix(mat, vx);
            var more = Matrix.fromIdentity();
            more.copy(vx);
            more.multiplyMatrix(vx);
            multiplyMatrixByNumber(more, (1 - a.dot(b)) / v.magnitudeSquared());
            addMatrixToMatrix(mat, more);
            matrix.multiplyMatrix(mat);
        }
        return matrix;
    };

    AbstractRigidMesh.multiplyMatrixBySurfaceRotation = function (matrix, globe, position) {
        var normal = globe.surfaceNormalAtLocation(position.latitude, position.longitude, new Vec3(0, 0, 0));
        var matNormal = multiplyMatrixByVectorToVectorRotation(Matrix.fromIdentity(), new Vec3(0, 0, 1), normal);
        var northTangent = globe.northTangentAtLocation(position.latitude, position.longitude, new Vec3(0, 0, 0));
        var forwardVec = new Vec3(0, 1, 0).multiplyByMatrix(matNormal);
        multiplyMatrixByVectorToVectorRotation(matrix, forwardVec, northTangent);
        matrix.multiplyMatrix(matNormal);
        return matrix;
    };

    AbstractRigidMesh.prototype.computeMeshPoints = function (dc, currentData) {
        var transform = Matrix.fromIdentity();
        AbstractRigidMesh.multiplyMatrixBySurfaceRotation(transform, dc.globe, this._center);
        transform.multiplyByRotation(0, 1, 0, 360 - this._roll);
        transform.multiplyByRotation(1, 0, 0, 360 - this._pitch);
        transform.multiplyByRotation(0, 0, 1, 360 - this._heading);
        AbstractRigidMesh.multiplyMatrixBySkew(transform, this._skewX, this._skewY);
        transform.multiplyByScale(this._halfWidth, this._halfLength, this._halfHeight);
        var unitPoints = currentData.computedUnitPoints;
        var meshPoints = new Float32Array(unitPoints.length * 3);
        var k = 0;
        var pt = new Vec3(0, 0, 0);
        for (var i = 0; i != unitPoints.length; ++i)
        {
            pt.copy(unitPoints[i]);
            pt.multiplyByMatrix(transform);
            meshPoints[k++] = pt[0];
            meshPoints[k++] = pt[1];
            meshPoints[k++] = pt[2];
        }
        return meshPoints;
    };

    AbstractRigidMesh.prototype.computeMeshIndices = function () {
        var indices = this.currentData.computedIndices;
        var meshIndices = new Uint16Array(indices.length);
        for (var i = 0; i != indices.length; ++i)
        {
            meshIndices[i] = indices[i];
        }
        return meshIndices;
    };

    AbstractRigidMesh.prototype.doMakeOrderedRenderable = function (dc) {
        var currentData = this.currentData;
        if (this.shouldRecompute(dc))
        {
            delete currentData.computedUnitPoints;
            delete currentData.computedIndices;
            delete currentData.meshPoints;
            delete currentData.texCoords;
            delete currentData.meshIndices;
            delete currentData.meshOutlineIndices;
            delete currentData.normals;
            delete currentData.extent;
            delete this.texCoords;
            delete this.meshIndices;
            delete this.meshOutlineIndices;
            if (currentData.pointsVboCacheKey)
            {
                dc.gpuResourceCache.removeResource(currentData.pointsVboCacheKey);
            }
            if (currentData.meshIndicesVboCacheKey)
            {
                dc.gpuResourceCache.removeResource(currentData.meshIndicesVboCacheKey);
            }
            if (currentData.texCoordsVboCacheKey)
            {
                dc.gpuResourceCache.removeResource(currentData.texCoordsVboCacheKey);
            }
            if (currentData.normalsVboCacheKey)
            {
                dc.gpuResourceCache.removeResource(currentData.normalsVboCacheKey);
            }
            if (currentData.outlineIndicesVboCacheKey)
            {
                dc.gpuResourceCache.removeResource(currentData.outlineIndicesVboCacheKey);
            }
        }
        dc.surfacePointForMode(this.referencePosition.latitude, this.referencePosition.longitude,
            this.referencePosition.altitude * this._altitudeScale, this.altitudeMode, currentData.referencePoint);
        if (!currentData.computedUnitPoints)
        {
            currentData.computedUnitPoints = this.computeUnitPoints(dc);
        }
        if (!currentData.computedIndices)
        {
            currentData.computedIndices = this.computeIndices(dc);
        }
        AbstractMesh.prototype.doMakeOrderedRenderable.call(this, dc);
        if (!currentData.eyeDistance)
        {
            var eyePoint = dc.eyePoint;
            var eyeDistanceSquared = Number.MAX_VALUE;
            var pt = new Vec3(0, 0, 0);
            for (var i = 0; i !== currentData.computedUnitPoints.length; ++i)
            {
                pt.copy(currentData.computedUnitPoints[i]);
                pt.multiplyByMatrix(currentData.transformationMatrix);
                eyeDistanceSquared = Math.min(eyeDistanceSquared, pt.distanceToSquared(eyePoint));
            }
            currentData.eyeDistance = Math.sqrt(eyeDistanceSquared);
        }
        return this;
    };

    AbstractRigidMesh.prototype.shouldRecompute = function () {
        var result = this._needsRecompute;
        this._needsRecompute = false;
        return result;
    };

    AbstractRigidMesh.prototype.computeUnitPoints = function (dc) {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractRigidMesh", "computeUnitPoints", "abstractInvocation"));
    };

    AbstractRigidMesh.prototype.computeIndices = function (dc) {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractRigidMesh", "computeIndices", "abstractInvocation"));
    };

    return AbstractRigidMesh;
});
