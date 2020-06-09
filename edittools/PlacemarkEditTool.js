define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/geom/Vec2',
    'WebWorldWind/geom/Vec3',
    'OpusWorldWind/edittools/AbstractEditTool',
], function (OpusWorldWind, WorldWind, Vec2, Vec3, AbstractEditTool) {
    var PlacemarkEditTool = function (wwd, placemarks) {
        AbstractEditTool.call(this, wwd, placemarks);

        this._highlightOnMouseOver = false;

        this._prevScales = placemarks.map(function () {
        });
        this._prevHighlightScales = placemarks.map(function () {
        });
        this._renderableDragScreenOffs = placemarks.map(function () {
            return new Vec2(0, 0);
        });

        this.addEventListener('renderableMousedOn', this._renderableMousedOn.bind(this));
        this.addEventListener('renderableMousedOff', this._renderableMousedOff.bind(this));
        this.addEventListener('renderableDragBegan', this._renderableDragBegan.bind(this));
        this.addEventListener('renderableDragChanged', this._renderableDragChanged.bind(this));
        this.addEventListener('renderableDragEnded', this._renderableDragEnded.bind(this));
    };

    PlacemarkEditTool.prototype = Object.create(AbstractEditTool.prototype);

    Object.defineProperties(PlacemarkEditTool.prototype, {
        highlightOnMouseOver: {
            get: function () {
                return this._highlightOnMouseOver;
            },
            set: function (value) {
                this._highlightOnMouseOver = value;
            }
        }
    });

    PlacemarkEditTool.prototype._renderableMousedOn = function (renderable, event) {
        var that = this;
        this.renderables.forEach(function (renderable, index) {
            that._prevScales[index] = renderable.attributes.imageScale;
            renderable.attributes.imageScale *= 1.2;
            if (that._highlightOnMouseOver)
            {
                renderable.highlighted = true;
            }
            if (renderable.highlightAttributes)
            {
                that._prevHighlightScales[index] = renderable.highlightAttributes.imageScale;
                renderable.highlightAttributes.imageScale *= 1.2;
            }
        });
        this.wwd.canvas.style.cursor = 'pointer';
        this.emit('update', false);
        this.wwd.redraw();
    };

    PlacemarkEditTool.prototype._renderableMousedOff = function (renderable, event) {
        var that = this;
        this.renderables.forEach(function (renderable, index) {
            renderable.attributes.imageScale = that._prevScales[index];
            if (that._highlightOnMouseOver)
            {
                renderable.highlighted = false;
            }
            if (renderable.highlightAttributes && that._prevHighlightScales[index] !== undefined)
            {
                renderable.highlightAttributes.imageScale = that._prevHighlightScales[index];
            }
            that._prevScales[index] = undefined;
            that._prevHighlightScales[index] = undefined;
        });
        this.wwd.canvas.style.cursor = 'default';
        this.emit('update', false);
        this.wwd.redraw();
    };

    PlacemarkEditTool.prototype._renderableDragBegan = function (renderable, recognizer) {
        var that = this;
        this.renderables.forEach(function (renderable, index) {
            var dragScreenCoord = that.wwd.canvasCoordinates(recognizer.clientX, recognizer.clientY);
            var position = renderable.position;
            var point = that.wwd.globe.computePointFromPosition(position.latitude, position.longitude, position.altitude, new Vec3(0, 0, 0));
            var screenPoint = new Vec3(0, 0, 0);
            that.wwd.drawContext.project(point, screenPoint);
            var screenCoord = that.wwd.drawContext.convertPointToViewport(screenPoint, new Vec2(0, 0));
            var offs = that._renderableDragScreenOffs[index];
            offs[0] = screenCoord[0] - dragScreenCoord[0];
            offs[1] = screenCoord[1] - dragScreenCoord[1];
        });
    };

    PlacemarkEditTool.prototype._renderableDragChanged = function (renderable, recognizer) {
        var that = this;
        this.renderables.forEach(function (renderable, index) {
            var dragScreenCoord = that.wwd.canvasCoordinates(recognizer.clientX, recognizer.clientY);
            var offs = that._renderableDragScreenOffs[index];
            dragScreenCoord[0] += offs[0];
            dragScreenCoord[1] += offs[1];
            var pickedTerrain = that.wwd.pickTerrain(dragScreenCoord).objects[0];
            if (pickedTerrain)
            {
                renderable.position = pickedTerrain.position;
            }
        });
        this.emit('update', false);
        this.wwd.redraw();
    };

    PlacemarkEditTool.prototype._renderableDragEnded = function (renderable, recognizer) {
        this.emit('update', true);
        this.wwd.redraw();
    };

    return PlacemarkEditTool;
});
