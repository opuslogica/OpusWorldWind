define([
    'WorldWind/geom/Vec2',
    '../placemarks/ScreenShapePlacemark'
], function(
    Vec2,
    ScreenShapePlacemark
) {
    var PedestalPlacemark = function(position, attributes) {
        ScreenShapePlacemark.call(this, [
            -1, 1,
            0, -1,
            1, 1
        ], position, attributes);
        this.width = 18;
        this.height = 9;
        this.offset = new Vec2(0, 4.5);
    };

    PedestalPlacemark.prototype = Object.create(ScreenShapePlacemark.prototype);

    return PedestalPlacemark;
});
