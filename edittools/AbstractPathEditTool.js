define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/util/Logger',
    'WebWorldWind/error/UnsupportedOperationError',
    'WebWorldWind/shapes/ShapeAttributes',
    'WebWorldWind/geom/Position',
    'OpusWorldWind/edittools/AbstractEditTool',
    'OpusWorldWind/edittools/AbstractSurfaceShapeEditTool',
    'OpusWorldWind/placemarks/SquarePlacemark',
    'OpusWorldWind/misc/ExtUtils',
    'OpusWorldWind/placemarks/ScreenShapePlacemarkAttributes'
], function (OpusWorldWind, WorldWind, Logger, UnsupportedOperationError, ShapeAttributes, Position, AbstractEditTool, AbstractSurfaceShapeEditTool, SquarePlacemark, ExtUtils, ScreenShapePlacemarkAttributes) {
    var AbstractPathEditTool = function (wwd, path) {
        AbstractEditTool.call(this, wwd, path);
        this._handles = null;
        this.updateHandles();

        this.addEventListener('renderableUpdated', this._renderableUpdated.bind(this));
        this.addEventListener('renderableMousedOn', this._renderableMousedOn.bind(this));
        this.addEventListener('renderableMousedOff', this._renderableMousedOff.bind(this));
    };

    AbstractPathEditTool.prototype = Object.create(AbstractEditTool.prototype);

    Object.defineProperties(AbstractPathEditTool.prototype, {
        handles: {
            get: function () {
                return this._handles;
            }
        }
    });

    AbstractPathEditTool.prototype.setEditingEnabled = function (enabled) {
        if (enabled)
        {
            if (this._handles === null)
            {
                this._handles = [];
                this.updateHandles();
            }
        } else
        {
            if (this._handles !== null)
            {
                for (var i = 0; i !== this._handles.length; ++i)
                {
                    this.removeEditRenderable(this._handles[i]);
                }
                this._handles = null;
            }
        }
    };

    AbstractPathEditTool.prototype._styleHandle = function (handle) {
        handle.attributes.interiorColor = AbstractSurfaceShapeEditTool.NORMAL_HANDLE_COLOR;
        handle.attributes.drawOutline = false;
        handle.highlightAttributes = new ScreenShapePlacemarkAttributes(handle.attributes);
        handle.highlightAttributes.interiorColor = AbstractSurfaceShapeEditTool.HIGHLIGHTED_HANDLE_COLOR;
    };

    AbstractPathEditTool.prototype.updateHandles = function () {
        if (this._handles !== null)
        {
            var positions = this.getPositions();
            if (this._handles.length !== positions.length)
            {
                for (var i = 0; i !== this._handles.length; ++i)
                {
                    this.removeEditRenderable(this._handles[i]);
                }
                this._handles = [];
                for (var i = 0; i !== positions.length; ++i)
                {
                    var pos = positions[i];
                    {
                        var handle = new SquarePlacemark(new Position(pos.latitude, pos.longitude, this.getAltitude(0)));
                        handle.altitudeMode = this.renderables[0].altitudeMode;
                        handle._positionIndex = i;
                        this._styleHandle(handle);
                        this.addEditRenderable(handle);
                        this._handles.push(handle);
                    }
                    if (this.hasTwoAltitudes())
                    {
                        var handle = new SquarePlacemark(new Position(pos.latitude, pos.longitude, this.getAltitude(1)));
                        handle.altitudeMode = this.renderables[0].altitudeMode;
                        handle._positionIndex = i;
                        handle._isTopHandle = true;
                        this._styleHandle(handle);
                        this.addEditRenderable(handle);
                        this._handles.push(handle);
                    }
                }
            } else
            {
                for (var i = 0; i !== positions.length; ++i)
                {
                    this._handles[i].position = positions[i];
                }
            }
        }
    };

    AbstractPathEditTool.prototype.isTopHandle = function (handle) {
        return handle._isTopHandle !== undefined;
    };

    AbstractPathEditTool.prototype.handlePositionIndex = function (handle) {
        return handle._positionIndex !== undefined ? handle._positionIndex : null;
    };

    AbstractPathEditTool.prototype._renderableUpdated = function (renderable) {
        if (renderable === this.renderables[0])
        {
            this.updateHandles();
        }
    };

    AbstractPathEditTool.prototype._renderableMousedOn = function (renderable, event) {
        this.wwd.canvas.style.cursor = 'pointer';
        if (this._handles !== null)
        {
            if (this._handles.indexOf(renderable) !== -1)
            {
                renderable.highlighted = true;
            }
        }
        this.wwd.redraw();
    };

    AbstractPathEditTool.prototype._renderableMousedOff = function (renderable, event) {
        this.wwd.canvas.style.cursor = 'default';
        if (this._handles !== null)
        {
            if (this._handles.indexOf(renderable) !== -1)
            {
                renderable.highlighted = false;
            }
        }
        this.wwd.redraw();
    };

    AbstractPathEditTool.prototype.hasTwoAltitudes = function () {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractPathEditTool", "hasTwoAltitudes", "abstractInvocation"));
    };

    AbstractPathEditTool.prototype.getAltitude = function (index) {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractPathEditTool", "getAltitude", "abstractInvocation"));
    };

    // Note: altitude is ignored on these positions and is replaced by the value given by getAltitude
    AbstractPathEditTool.prototype.getPositions = function () {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractPathEditTool", "getPositions", "abstractInvocation"));
    };

    return AbstractPathEditTool;
});
