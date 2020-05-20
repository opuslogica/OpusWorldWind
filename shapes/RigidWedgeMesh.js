define([
    'WebWorldWind/WorldWind',
    'WebWorldWind/geom/Angle',
    'WebWorldWind/geom/Vec3',
    'OpusWorldWind/shapes/AbstractRigidMesh'
], function (WorldWind, Angle, Vec3, AbstractRigidMesh) {
    var RigidWedgeMesh = function (center, angle, majorRadius, minorRadius, verticalRadius, radiusRatio) {
        AbstractRigidMesh.call(this, center);
        if (angle < 0 || angle > 360)
        {
            throw new Error('Illegal angle');
        }
        this._angle = angle;
        this._radiusRatio = radiusRatio;
        this._majorRadius = majorRadius;
        this._minorRadius = minorRadius;
        this._verticalRadius = verticalRadius;
    };

    RigidWedgeMesh.prototype = Object.create(AbstractRigidMesh.prototype);

    Object.defineProperties(RigidWedgeMesh.prototype, {
        angle: {
            get: function () {
                return this._angle;
            },
            set: function (angle) {
                this._angle = angle;
                this.reset();
            }
        },
        radiusRatio: {
            get: function () {
                return this._radiusRatio;
            },
            set: function (radiusRatio) {
                this._radiusRatio = radiusRatio;
                this.reset();
            }
        }
    });

    RigidWedgeMesh.prototype.computeThetaStep = function (dc) {
        return 5;
    };

    RigidWedgeMesh.prototype.shouldRecompute = function (dc) {
        if (AbstractRigidMesh.prototype.shouldRecompute(dc))
        {
            return true;
        } else
        {
            var currentData = this.currentData;
            var step = this.computeThetaStep(dc);
            if (step !== currentData.lastThetaStep)
            {
                currentData.lastThetaStep = step;
                return true;
            } else
            {
                return false;
            }
        }
    };

    RigidWedgeMesh.prototype.is360 = function () {
        return Math.abs(360 - this._angle) < Number.EPSILON;
    };

    RigidWedgeMesh.prototype.computeThetas = function (dc) {
        var step = this.computeThetaStep(dc);
        var thetas = [];
        for (var theta = 0; theta < this._angle; theta += step)
        {
            thetas.push(theta);
        }
        if (!this.is360() && Math.abs(thetas[thetas.length - 1] - this._angle) > Number.EPSILON)
        {
            thetas.push(this._angle);
        }
        return thetas;
    };

    RigidWedgeMesh.prototype.computeUnitPoints = function (dc) {
        var thetas = this.computeThetas(dc);
        var result = [];
        result.push(new Vec3(0, 0, 1));
        var that = this;
        thetas.forEach(function (theta) {
            var x = Math.sin(theta * Angle.DEGREES_TO_RADIANS), y = Math.cos(theta * Angle.DEGREES_TO_RADIANS);
            if (that._radiusRatio > 0)
            {
                result.push(new Vec3(x * that._radiusRatio, y * that._radiusRatio, 1));
            }
            result.push(new Vec3(x, y, -1));
        });
        result.push(new Vec3(0, 0, -1));
        return result;
    };

    RigidWedgeMesh.prototype.computeIndices = function (dc) {
        var thetas = this.computeThetas(dc);
        var result = [];
        var bottomCenterIndex = this._radiusRatio > 0 ? 1 + 2 * thetas.length : 1 + thetas.length;
        var is360 = this.is360();
        var hasTop = this._radiusRatio > Number.EPSILON;
        // top
        if (hasTop)
        {
            for (var i = 0; i != thetas.length - 1; ++i)
            {
                result.push(0);
                result.push(3 + 2 * i);
                result.push(1 + 2 * i);
            }
            if (is360)
            {
                result.push(0);
                result.push(1);
                result.push(bottomCenterIndex - 2);
            }
        }
        // bottom
        for (var i = 0; i != thetas.length - 1; ++i)
        {
            result.push(bottomCenterIndex);
            if (hasTop)
            {
                result.push(2 + 2 * (i + 1));
                result.push(2 + 2 * i);
            } else
            {
                result.push(2 + i);
                result.push(1 + i);
            }
        }
        if (is360)
        {
            result.push(bottomCenterIndex);
            result.push(hasTop ? 2 : 1);
            result.push(bottomCenterIndex - 1);
        }
        // outer sides
        if (hasTop)
        {
            for (var i = 0; i != thetas.length - 1; ++i)
            {
                result.push(1 + 2 * i);
                result.push(3 + 2 * i);
                result.push(2 + 2 * i);
                result.push(2 + 2 * i);
                result.push(3 + 2 * i);
                result.push(4 + 2 * i);
            }
            if (is360)
            {
                result.push(bottomCenterIndex - 1);
                result.push(bottomCenterIndex - 2);
                result.push(1);
                result.push(bottomCenterIndex - 1);
                result.push(1);
                result.push(2);
            }
        } else
        {
            for (var i = 0; i != thetas.length - 1; ++i)
            {
                result.push(1 + i);
                result.push(0);
                result.push(2 + i);
            }
            if (is360)
            {
                result.push(bottomCenterIndex - 1);
                result.push(0);
                result.push(1);
            }
        }
        // wedge sides
        if (!is360)
        {
            if (hasTop)
            {
                result.push(1);
                result.push(2);
                result.push(bottomCenterIndex);
                result.push(0);
                result.push(1);
                result.push(bottomCenterIndex);
                result.push(bottomCenterIndex - 2);
                result.push(0);
                result.push(bottomCenterIndex);
                result.push(bottomCenterIndex - 2);
                result.push(bottomCenterIndex);
                result.push(bottomCenterIndex - 1);
            } else
            {
                result.push(0);
                result.push(bottomCenterIndex);
                result.push(bottomCenterIndex - 1);
                result.push(0);
                result.push(1);
                result.push(bottomCenterIndex);
            }
        }
        return result;
    };

    return RigidWedgeMesh;
});
