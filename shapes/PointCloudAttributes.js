define([
    'WebWorldWind/WorldWind',
    'WebWorldWind/shapes/ShapeAttributes'
], function (WorldWind, ShapeAttributes) {
    var PointCloudAttributes = function (attributes) {
        ShapeAttributes.call(this, attributes);
        this._pointSize = attributes ? attributes.pointSize : PointCloudAttributes.DEFAULT_POINT_SIZE;
        this._offsetDepth = attributes ? attributes.offsetDepth : true;
    };

    PointCloudAttributes.DEFAULT_POINT_SIZE = 8;

    PointCloudAttributes.prototype = Object.create(ShapeAttributes.prototype);

    Object.defineProperties(PointCloudAttributes.prototype, {
        pointSize: {
            get: function () {
                return this._pointSize;
            },
            set: function (pointSize) {
                this._pointSize = pointSize;
                this.stateKeyInvalid = true;
            }
        },
        offsetDepth: {
            get: function () {
                return this._offsetDepth;
            },
            set: function (offsetDepth) {
                this._offsetDepth = offsetDepth;
                this.stateKeyInvalid = true;
            }
        }
    });

    PointCloudAttributes.prototype.computeStateKey = function () {
        return ShapeAttributes.prototype.computeStateKey.call(this) +
            ' ps ' + this._pointSize;
    };

    return PointCloudAttributes;
});
