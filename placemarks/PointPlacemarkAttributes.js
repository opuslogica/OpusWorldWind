define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/shapes/ShapeAttributes'
], function (OpusWorldWind, WorldWind, ShapeAttributes) {
    var PointPlacemarkAttributes = function (attributes) {
        ShapeAttributes.call(this, attributes);
        this._pointSize = attributes ? attributes.pointSize : PointPlacemarkAttributes.DEFAULT_POINT_SIZE;
    };

    PointPlacemarkAttributes.DEFAULT_POINT_SIZE = 8;

    PointPlacemarkAttributes.prototype = Object.create(ShapeAttributes.prototype);

    Object.defineProperties(PointPlacemarkAttributes.prototype, {
        pointSize: {
            get: function () {
                return this._pointSize;
            },
            set: function (pointSize) {
                this._pointSize = pointSize;
                this.stateKeyInvalid = true;
            }
        }
    });

    PointPlacemarkAttributes.prototype.computeStateKey = function () {
        return ShapeAttributes.prototype.computeStateKey.call(this) +
            ' ps ' + this._pointSize;
    };

    return PointPlacemarkAttributes;
});
