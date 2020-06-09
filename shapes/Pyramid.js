define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/geom/Vec3',
    'OpusWorldWind/shapes/AbstractRigidMesh'
], function (OpusWorldWind, WorldWind, Vec3, AbstractRigidMesh) {
    var Pyramid = function (center, halfWidth, halfLength, halfHeight, attributes) {
        AbstractRigidMesh.call(this, center, attributes);
        this._halfWidth = halfWidth;
        this._halfLength = halfLength;
        this._halfHeight = halfHeight;
    };

    Pyramid.UNIT_POINTS = [
        new Vec3(-1, -1, -1),
        new Vec3(1, -1, -1),
        new Vec3(-1, 1, -1),
        new Vec3(1, 1, -1),
        new Vec3(0, 0, 1)
    ];

    Pyramid.INDICES = [
        0, 3, 1,
        0, 2, 3,
        1, 3, 4,
        3, 2, 4,
        2, 0, 4,
        0, 1, 4
    ];

    Pyramid.prototype = Object.create(AbstractRigidMesh.prototype);

    Pyramid.prototype.computeUnitPoints = function (dc) {
        return Pyramid.UNIT_POINTS;
    };

    Pyramid.prototype.computeIndices = function (dc) {
        return Pyramid.INDICES;
    };

    return Pyramid;
});
