define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/geom/Vec3',
    'OpusWorldWind/shapes/AbstractRigidMesh'
], function (OpusWorldWind, WorldWind, Vec3, AbstractRigidMesh) {
    var Ellipsoid = function (center, halfWidth, halfLength, halfHeight) {
        AbstractRigidMesh.call(this, center);
        this._halfWidth = halfWidth;
        this._halfLength = halfLength;
        this._halfHeight = halfHeight;
    };

    Ellipsoid.prototype = Object.create(AbstractRigidMesh.prototype);

    Ellipsoid.prototype.computeNumSlicesAndStacks = function (dc) {
        return 30;
    };

    Ellipsoid.prototype.shouldRecompute = function (dc) {
        if (AbstractRigidMesh.prototype.shouldRecompute(dc))
        {
            return true;
        } else
        {
            var currentData = this.currentData;
            var step = this.computeNumSlicesAndStacks(dc);
            if (step !== currentData.lastNumSlicesAndStacks)
            {
                currentData.lastNumSlicesAndStacks = step;
                return true;
            } else
            {
                return false;
            }
        }
    };

    Ellipsoid.prototype.computeUnitPoints = function (dc) {
        var points = [];
        var step = this.computeNumSlicesAndStacks(dc);
        var stacks = step, slices = step;
        points.push(new Vec3(0, 0, -1));
        for (var si = 1; si != stacks - 1; ++si)
        {
            var thetaNumSlicesAndStacks = 2 * Math.PI / slices;
            var z = -Math.cos(Math.PI * si / (stacks - 1));
            var r = Math.sqrt(1 - z * z);
            for (var t = 0; t < 2 * Math.PI; t += thetaNumSlicesAndStacks)
            {
                points.push(new Vec3(r * Math.cos(t), r * Math.sin(t), z));
            }
        }
        points.push(new Vec3(0, 0, 1));
        return points;
    };

    Ellipsoid.prototype.computeIndices = function (dc) {
        var indices = [];
        var step = this.computeNumSlicesAndStacks(dc);
        var stacks = step, slices = step;
        // bottom
        for (var i = 1; i != slices; ++i)
        {
            indices.push(0);
            indices.push(i + 1);
            indices.push(i);
        }
        indices.push(0);
        indices.push(1);
        indices.push(slices);
        // sides
        for (var si = 1; si != stacks - 2; ++si)
        {
            var first = 1 + (si - 1) * slices;
            var last = 1 + si * slices;
            for (var i = first; i != last - 1; ++i)
            {
                indices.push(i + slices);
                indices.push(i);
                indices.push(i + 1);
                indices.push(i + slices);
                indices.push(i + 1);
                indices.push(i + slices + 1);
            }
            indices.push((si + 1) * slices);
            indices.push(last - 1);
            indices.push(last);
            indices.push(last);
            indices.push(last - 1);
            indices.push(first);
        }
        // top
        var first = 1 + (stacks - 3) * slices, last = 1 + (stacks - 2) * slices;
        for (var i = first; i != last; ++i)
        {
            indices.push(last);
            indices.push(i);
            indices.push(i + 1);
        }
        indices.push(last);
        indices.push(last - 1);
        indices.push(first);
        return indices;
    };

    return Ellipsoid;
});
