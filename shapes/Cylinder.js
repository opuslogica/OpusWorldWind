define([
    'WebWorldWind/WorldWind',
    '../shapes/RigidWedgeMesh'
], function (WorldWind, RigidWedgeMesh) {
    var Cylinder = function (center, halfWidth, halfLength, halfHeight) {
        RigidWedgeMesh.call(this, center, 360, halfWidth, halfLength, halfHeight, 1);
    };

    Cylinder.prototype = Object.create(RigidWedgeMesh.prototype);

    return Cylinder;
});
