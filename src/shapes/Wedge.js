define([
    '../shapes/RigidWedgeMesh'
], function(RigidWedgeMesh) {
    var Wedge = function(center, angle, halfWidth, halfLength, halfHeight) {
        RigidWedgeMesh.call(this, center, angle, halfWidth, halfLength, halfHeight, 1);
    };
    Wedge.prototype = Object.create(RigidWedgeMesh.prototype);

    return Wedge;
});
