define([
    'WebWorldWind/WorldWind',
    'WebWorldWind/geom/Location',
    'WebWorldWind/geom/Position',
    'WebWorldWind/shapes/GeographicText',
    'OpusWorldWind/edittools/AbstractEditTool',
    'OpusWorldWind/placemarks/PedestalPlacemark',
    'OpusWorldWind/placemarks/SquarePlacemark',
], function (WorldWind, Location, Position, GeographicText, AbstractEditTool, PedestalPlacemark, SquarePlacemark) {
    var RangeRingEditTool = function (wwd, arc, label) {
        AbstractEditTool.call(this, wwd, arc);

        this._annotationRenderables = [];
        this._label = label || null;

        this.addEventListener('renderableUpdated', this._renderableUpdated.bind(this));
        this.addEventListener('renderableMousedOn', this._renderableMousedOn.bind(this));
        this.addEventListener('renderableMousedOff', this._renderableMousedOff.bind(this));
    };
    RangeRingEditTool.prototype = Object.create(AbstractEditTool.prototype);

    Object.defineProperties(RangeRingEditTool.prototype, {
        label: {
            get: function () {
                return this._label;
            },
            set: function (value) {
                this._label = value;
            }
        }
    });

    RangeRingEditTool.prototype._clearAnnotation = function (visible) {
        this._annotationRenderables.forEach(this.removeEditRenderable.bind(this));
        this._annotationRenderables = [];
    };

    RangeRingEditTool.prototype._renderableUpdated = function (renderable) {
        if (renderable === this.renderables[0])
        {
            this._clearAnnotation();
            this.wwd.redraw();
        }
    };

    RangeRingEditTool.prototype._renderableMousedOn = function (renderable, event) {
        if (renderable === this.renderables[0])
        {
            this.wwd.canvas.style.cursor = 'pointer';
            this._clearAnnotation();
            var pick = this.wwd.pickTerrain(this.wwd.canvasCoordinates(event.clientX, event.clientY)).objects[0];
            if (!pick)
            {
                return;
            }
            var arc = renderable;
            var pos = pick.position;
            var globeRadius = this.wwd.drawContext.globe.radiusAt(arc.center.latitude, arc.center.longitude);
            var azimuth = Location.greatCircleAzimuth(arc.center, new Location(pos.latitude, pos.longitude));
            var loc = Location.greatCircleLocation(arc.center, azimuth, arc.radius / globeRadius, new Location(0, 0));
            pos = new Position(loc.latitude, loc.longitude, 0);
            var pedestal = new PedestalPlacemark(pos);
            var background = new SquarePlacemark(pos);
            var str;
            if (this._label !== null)
            {
                str = this._label;
            } else
            {
                str = Math.floor(arc.radius) / 1000 + ' km';
            }
            var text = new GeographicText(pos, str);
            pedestal.altitudeMode = background.altitudeMode = text.altitudeMode = WorldWind.CLAMP_TO_GROUND;
            text.attributes.color = WorldWind.Color.WHITE;
            this.wwd.drawContext.textRenderer.typeFace = text.attributes.font;
            var dim = this.wwd.drawContext.textRenderer.textSize(text.text);
            background.position = pos;
            background.width = dim[0] + 10;
            background.height = dim[1];
            background.attributes.drawOutline = false;
            background.attributes.interiorColor = arc.attributes.outlineColor;
            background.offset = new WorldWind.Vec2(0, background.height / 2 + pedestal.height);
            var textOffs = new WorldWind.Offset(WorldWind.OFFSET_FRACTION, 0.5, WorldWind.OFFSET_FRACTION, 0.0).offsetForSize(dim[0], dim[1]);
            textOffs[1] -= pedestal.height;
            text.attributes.offset = new WorldWind.Offset(WorldWind.OFFSET_PIXELS, textOffs[0], WorldWind.OFFSET_PIXELS, textOffs[1]);
            pedestal.position = pos;
            pedestal.attributes.drawOutline = false;
            pedestal.attributes.interiorColor = arc.attributes.outlineColor;
            this.addEditRenderable(pedestal);
            this.addEditRenderable(background);
            this.addEditRenderable(text);
            this._annotationRenderables = [pedestal, background, text];
            this.wwd.redraw();
        }
    };

    RangeRingEditTool.prototype._renderableMousedOff = function (renderable, event) {
        if (renderable === this.renderables[0])
        {
            this.wwd.canvas.style.cursor = 'default';
            this._clearAnnotation();
            this.wwd.redraw();
        }
    };

    return RangeRingEditTool;
});
