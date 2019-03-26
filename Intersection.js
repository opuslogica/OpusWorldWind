define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind'
], function(OpusWorldWind, WorldWind) {
    var Intersection = function(point, isTangent) {
        this.point = point;
        this.isTangent = isTangent;
    };

    OpusWorldWind.Intersection = Intersection;
    return Intersection;
});
