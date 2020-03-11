define([
    'WebWorldWind/WorldWind'
], function (WorldWind) {
    var Intersection = function (point, isTangent) {
        this.point = point;
        this.isTangent = isTangent;
    };

    return Intersection;
});
