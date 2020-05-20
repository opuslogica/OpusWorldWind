define([
    'WebWorldWind/WorldWind',
    'WebWorldWind/util/Color',
    'WebWorldWind/util/Font',
    'WebWorldWind/geom/Vec2',
    'WebWorldWind/util/Offset',
    'WebWorldWind/shapes/GeographicText',
    'OpusWorldWind/placemarks/PedestalPlacemark',
    'OpusWorldWind/placemarks/SquarePlacemark'
], function (WorldWind, Color, Font, Vec2, Offset, GeographicText, PedestalPlacemark, SquarePlacemark) {
    var TextBox = function (wwd, position, text) {
        this._wwd = wwd;

        this._position = position;
        this._borderColor = Color.BLACK;
        this._borderWidth = 3;
        this._backgroundColor = Color.WHITE;
        this._textColor = Color.BLACK;
        this._textFont = new Font(14);
        this._text = text;

        this._pedestal = new PedestalPlacemark(position);
        this._background = new SquarePlacemark(position);
        this._geogText = new GeographicText(position, text);

        this._updateAttributes();
    };

    var props = {};
    ['_position', '_borderColor', '_borderWidth', '_backgroundColor', '_textColor', '_textFont', '_text'].forEach(function (attr) {
        props[attr.substring(1)] = {
            get: function () {
                return this[attr];
            },
            set: function (v) {
                this[attr] = v;
                this._updateAttributes();
            }
        };
    });
    Object.defineProperties(TextBox.prototype, props);

    TextBox.prototype._updateAttributes = function () {
        var backgroundOffsetY = -2;
        var backgroundHorizPadding = 10;
        var backgroundVertPadding = 4;

        this._wwd.drawContext.textRenderer.typeFace = this._textFont;
        var dim = this._wwd.drawContext.textRenderer.textSize(this._text);

        this._pedestal.position = this._position;
        this._pedestal.width = 12;
        this._pedestal.height = 12;
        this._pedestal.attributes.drawOutline = false;
        this._pedestal.attributes.depthTest = false;
        this._pedestal.attributes.offset = new Vec2(4 * backgroundOffsetY * window.devicePixelRatio, 0);
        this._pedestal.attributes.interiorColor = this._borderColor;
        this._pedestal.alwaysOnTop = true;

        this._background.position = this._position;
        this._background.attributes.drawOutline = true;
        this._background.attributes.outlineWidth = 3;
        this._background.attributes.outlineColor = this._borderColor;
        this._background.attributes.interiorColor = this._backgroundColor;
        this._background.attributes.depthTest = false;
        this._background.width = dim[0] + backgroundHorizPadding;
        this._background.height = dim[1] + backgroundVertPadding;
        this._background.offset = (new Vec2(0, this._background.height / 2 + this._pedestal.height + backgroundOffsetY)).multiply(window.devicePixelRatio);
        this._background.alwaysOnTop = true;

        this._geogText.text = this._text;
        this._geogText.attributes.font = this._textFont;
        this._geogText.attributes.color = this._textColor;
        this._geogText.position = this._position;
        this._geogText.attributes.enableOutline = false;
        this._geogText.attributes.alwaysOnTop = true;
        this._geogText.attributes.depthTest = false;
        this._geogText.alwaysOnTop = true;

        var textOffs = (new Offset(WorldWind.OFFSET_FRACTION, 0.5, WorldWind.OFFSET_FRACTION, 0.0).offsetForSize(dim[0], dim[1])).multiply(window.devicePixelRatio);
        textOffs[1] += (backgroundOffsetY - this._pedestal.height) * window.devicePixelRatio;
        this._geogText.attributes.offset = new Offset(WorldWind.OFFSET_PIXELS, textOffs[0], WorldWind.OFFSET_PIXELS, textOffs[1]);
    };

    TextBox.prototype.addToLayer = function (renderableLayer) {
        renderableLayer.addRenderable(this._pedestal);
        renderableLayer.addRenderable(this._background);
        renderableLayer.addRenderable(this._geogText);
    };

    TextBox.prototype.removeFromLayer = function (renderableLayer) {
        renderableLayer.removeRenderable(this._pedestal);
        renderableLayer.removeRenderable(this._background);
        renderableLayer.removeRenderable(this._geogText);
    };

    return TextBox;
});
