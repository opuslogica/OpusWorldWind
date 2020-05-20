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
    /**
     * A layer that indicates whether playback is active.
     */
    var PlaybackIndicatorLayer = function () {
        Layer.call(this, 'Playback Indicator');

        this.pickEnabled = false;

        var textAttributes = new TextAttributes(null);
        textAttributes.color = Color.GREEN;
        this.text = new ScreenText(new Offset(WorldWind.OFFSET_INSET_PIXELS, 55, WorldWind.OFFSET_PIXELS, 5), " ");
        this.text.attributes = textAttributes;
        this.text.text = 'PLAYBACK';
    };

    PlaybackIndicatorLayer.prototype = Object.create(Layer.prototype);

    PlaybackIndicatorLayer.prototype.doRender = function (dc) {
        this.text.render(dc);
    };

    return PlaybackIndicatorLayer;
});
