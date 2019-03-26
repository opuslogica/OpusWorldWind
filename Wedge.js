define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'OpusWorldWind/RigidWedgeMesh'
], function(OpusWorldWind, WorldWind, RigidWedgeMesh) {
    var Wedge = function(center, angle, halfWidth, halfLength, halfHeight) {
        RigidWedgeMesh.call(this, center, angle, halfWidth, halfLength, halfHeight, 1);
    };
    Wedge.prototype = Object.create(RigidWedgeMesh.prototype);

    OpusWorldWind.Wedge = Wedge;
    return Wedge;
});
