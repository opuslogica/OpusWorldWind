define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/util/Logger',
    'WebWorldWind/error/UnsupportedOperationError',
    'WebWorldWind/geom/Line',
    'WebWorldWind/geom/Vec3',
    'OpusWorldWind/edittools/AbstractPathEditTool',
    'OpusWorldWind/edittools/EditToolClickRecognizer',
    'OpusWorldWind/misc/ExtUtils'
], function (OpusWorldWind, WorldWind, Logger, UnsupportedOperationError, Line, Vec3, AbstractPathEditTool, EditToolClickRecognizer, ExtUtils) {
    var AbstractSurfacePathEditTool = function (wwd, path) {
        var that = this;

        AbstractPathEditTool.call(this, wwd, path);

        this.addEventListener('renderableDragChanged', function (renderable, recognizer) {
            that._dragged(renderable, recognizer, false);
        });

        this.addEventListener('renderableDragEnded', function (renderable, recognizer) {
            that._dragged(renderable, recognizer, true);
        });

        new EditToolClickRecognizer(this, this._clickRecognized.bind(this));
    };

    AbstractSurfacePathEditTool.prototype = Object.create(AbstractPathEditTool.prototype);

    AbstractSurfacePathEditTool.prototype._dragged = function (renderable, recognizer, ended) {
        if (this._handles !== null)
        {
            var index = this.handlePositionIndex(renderable);
            if (index !== null)
            {
                var positions = this.getPositions();
                var topPickedObject = this.wwd.pickTerrain(this.wwd.canvasCoordinates(recognizer.clientX, recognizer.clientY)).topPickedObject();
                if (topPickedObject)
                {
                    var nextPositions = positions.slice();
                    nextPositions[index] = topPickedObject.position;
                    this.setPositions(nextPositions);
                    this.updateHandles();
                    this.emit('update', ended);
                    this.wwd.redraw();
                }
            }
        }
    };

    AbstractSurfacePathEditTool.prototype._clickRecognized = function (renderable, clickCount, info) {
        var that = this;
        var handleIndex;
        var positions = this.getPositions();
        if (clickCount === 2 && this.handles !== null)
        {
            var topPickedObject = this.wwd.pickTerrain(this.wwd.canvasCoordinates(info.clientX, info.clientY)).topPickedObject();
            if (topPickedObject !== null)
            {
                var pickedPosition = topPickedObject.position;
                if (renderable === this.renderables[0])
                {
                    var insertIndex;
                    var nextPositions = positions.slice();
                    ExtUtils.addPositionToPath(this.wwd, pickedPosition, nextPositions, this.isLoop(), WorldWind.CLAMP_TO_GROUND);
                    this.setPositions(nextPositions);
                    this.updateHandles();
                    this.emit('update', true);
                } else if ((handleIndex = this.handlePositionIndex(renderable)) !== null)
                {
                    var nextPositions = positions.slice();
                    if (nextPositions.length > this.getMinimumRequiredPositions())
                    {
                        nextPositions.splice(handleIndex, 1);
                        this.setPositions(nextPositions);
                        this.updateHandles();
                        this.emit('update', true);
                    } else
                    {
                        this.emit('delete');
                    }
                }
                this.wwd.redraw();
            }
        }
    };

    AbstractSurfacePathEditTool.prototype.hasTwoAltitudes = function () {
        return false;
    };

    AbstractSurfacePathEditTool.prototype.getAltitude = function (index) {
        return 0;
    };

    AbstractSurfacePathEditTool.prototype.setPositions = function (positions) {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractSurfacePathEditTool", "setPositions", "abstractInvocation"));
    };

    AbstractSurfacePathEditTool.prototype.getMinimumRequiredPositions = function () {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractSurfacePathEditTool", "getMinimumRequiredPositions", "abstractInvocation"));
    };

    AbstractSurfacePathEditTool.prototype.isLoop = function () {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractSurfacePathEditTool", "isLoop", "abstractInvocation"));
    };

    return AbstractSurfacePathEditTool;
});
