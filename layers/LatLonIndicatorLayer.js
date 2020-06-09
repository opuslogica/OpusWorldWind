define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/util/Color',
    'WebWorldWind/util/Font',
    'WebWorldWind/util/Offset',
    'WebWorldWind/layer/Layer',
    'WebWorldWind/shapes/ScreenText',
    'WebWorldWind/shapes/TextAttributes'
], function (OpusWorldWind, WorldWind, Color, Font, Offset, Layer, ScreenText, TextAttributes) {
    var LatLonIndicatorLayer = function () {
        Layer.call(this, 'Lat Lon Indicator');

        this.pickEnabled = false;

        var textAttributes = new TextAttributes(null);
        textAttributes.color = Color.WHITE;
        this.text = new ScreenText(new Offset(WorldWind.OFFSET_INSET_PIXELS, 140, WorldWind.OFFSET_PIXELS, 10), " ");
        this.text.attributes = textAttributes;
        this.text.text = '';

        this._latLon = null;
    };

    LatLonIndicatorLayer.prototype = Object.create(Layer.prototype);

    Object.defineProperties(LatLonIndicatorLayer.prototype, {
        latLon: {
            get: function () {
                return this._latLon;
            },
            set: function (v) {
                this._latLon = v;
                if (this._latLon !== null)
                {
                    var latStr = this._latLon.latitude.toString().substring(0, 6);
                    var lonStr = this._latLon.longitude.toString().substring(0, 6);
                    this.text.text = 'Lat: ' + latStr + '\xB0  Lon: ' + lonStr + '\xB0';
                } else
                {
                    this.text.text = '';
                }
            }
        }
    });

    LatLonIndicatorLayer.prototype.doRender = function (dc) {
        if (this._latLon !== null)
        {
            this.text.render(dc);
        }
    };

    return LatLonIndicatorLayer;
});
