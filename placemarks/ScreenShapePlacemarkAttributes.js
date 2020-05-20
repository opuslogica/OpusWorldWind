define([
    'WebWorldWind/WorldWind',
    'WebWorldWind/shapes/ShapeAttributes'
], function (WorldWind, ShapeAttributes) {
    var ScreenShapePlacemarkAttributes = function (attributes) {
        ShapeAttributes.call(this, attributes);
        this._depthTest = attributes ? attributes.depthTest : true;
        this._allowPicking = true;
    };

    ScreenShapePlacemarkAttributes.prototype = Object.create(ShapeAttributes.prototype);

    Object.defineProperties(ScreenShapePlacemarkAttributes.prototype, {
        depthTest: {
            get: function () {
                return this._depthTest;
            },
            set: function (v) {
                this._depthTest = v;
                this.stateKeyInvalid = true;
            }
        },
        allowPicking: {
            get: function () {
                return this._allowPicking;
            },
            set: function (v) {
                this._allowPicking = v;
                this.stateKeyInvalid = true;
            }
        }
    });

    ScreenShapePlacemarkAttributes.prototype.computeStateKey = function () {
        return ShapeAttributes.prototype.computeStateKey.call(this) +
            ' dt ' + this._depthTest;
    };

    return ScreenShapePlacemarkAttributes;
});
