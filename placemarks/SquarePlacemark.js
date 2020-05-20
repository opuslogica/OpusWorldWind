define([
    'WebWorldWind/WorldWind',
    'OpusWorldWind/placemarks/ScreenShapePlacemark'
], function (WorldWind, ScreenShapePlacemark) {
    var SquarePlacemark = function (position, attributes) {
        ScreenShapePlacemark.call(this, [
            -1, 1,
            1, -1,
            1, 1,
            -1, 1,
            -1, -1,
            1, -1
        ], position, attributes);
        this.width = 8;
        this.height = 8;
    };

    SquarePlacemark.prototype = Object.create(ScreenShapePlacemark.prototype);

    return SquarePlacemark;
});
