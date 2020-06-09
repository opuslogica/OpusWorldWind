define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/geom/Vec3',
    'OpusWorldWind/shapes/AbstractRigidMesh'
], function (OpusWorldWind, WorldWind, Vec3, AbstractRigidMesh) {
    var Box = function (center, halfWidth, halfLength, halfHeight, attributes) {
        AbstractRigidMesh.call(this, center, attributes);
        this._halfWidth = halfWidth;
        this._halfLength = halfLength;
        this._halfHeight = halfHeight
    };

    Box.UNIT_POINTS = [
        new Vec3(-1, -1, -1),
        new Vec3(1, -1, -1),
        new Vec3(-1, 1, -1),
        new Vec3(1, 1, -1),
        new Vec3(-1, -1, 1),
        new Vec3(1, -1, 1),
        new Vec3(-1, 1, 1),
        new Vec3(1, 1, 1)
    ];

    Box.INDICES = [
        0, 2, 1,
        2, 3, 1,
        4, 5, 6,
        5, 7, 6,
        0, 1, 4,
        5, 4, 1,
        3, 5, 1,
        3, 7, 5,
        2, 7, 3,
        2, 6, 7,
        0, 4, 6,
        0, 6, 2
    ];

    Box.prototype = Object.create(AbstractRigidMesh.prototype);

    Box.prototype.computeUnitPoints = function (dc) {
        return Box.UNIT_POINTS;
    };

    Box.prototype.computeIndices = function (dc) {
        return Box.INDICES;
    };

    return Box;
});
