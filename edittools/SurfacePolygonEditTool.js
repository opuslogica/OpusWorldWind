define([
    'OpusWorldWind/edittools/AbstractSurfacePathEditTool'
], function (AbstractSurfacePathEditTool) {
    var SurfacePolygonEditTool = function (wwd, polygon) {
        AbstractSurfacePathEditTool.call(this, wwd, polygon);

        this._dragBeginInfo = null;

        this.addEventListener('renderableDragBegan', this._renderableDragBegan.bind(this));
        this.addEventListener('renderableDragChanged', this._renderableDragChanged.bind(this));
        this.addEventListener('renderableDragEnded', this._renderableDragEnded.bind(this));
    };

    SurfacePolygonEditTool.prototype = Object.create(AbstractSurfacePathEditTool.prototype);

    SurfacePolygonEditTool.prototype.getPositions = function () {
        return this.renderables[0].boundaries;
    };

    SurfacePolygonEditTool.prototype.setPositions = function (positions) {
        this.renderables[0].boundaries = positions;
    };

    SurfacePolygonEditTool.prototype.getMinimumRequiredPositions = function () {
        return 3;
    };

    SurfacePolygonEditTool.prototype.isLoop = function () {
        return true;
    };

    SurfacePolygonEditTool.prototype._renderableDragBegan = function (renderable, recognizer) {
        var pickedTerrain = this.wwd.pickTerrain(this.wwd.canvasCoordinates(recognizer.clientX, recognizer.clientY)).objects[0];
        if (pickedTerrain)
        {
            var positions = angular.copy(this.getPositions());
            this._dragStartInfo = {
                pickedTerrainPosition: pickedTerrain.position,
                positions: positions
            };
        }
    };

    SurfacePolygonEditTool.prototype._renderableDrag = function (renderable, recognizer, ended) {
        if (renderable !== this.renderables[0])
        {
            return;
        }
        var pickedTerrain = this.wwd.pickTerrain(this.wwd.canvasCoordinates(recognizer.clientX, recognizer.clientY)).objects[0];
        if (pickedTerrain)
        {
            var deltaLat = pickedTerrain.position.latitude - this._dragStartInfo.pickedTerrainPosition.latitude;
            var deltaLon = pickedTerrain.position.longitude - this._dragStartInfo.pickedTerrainPosition.longitude;
            var positions = angular.copy(this.getPositions());
            for (var i = 0; i !== positions.length; ++i)
            {
                var p_prev = this._dragStartInfo.positions[i];
                var p = positions[i];
                p.latitude = p_prev.latitude + deltaLat;
                p.longitude = p_prev.longitude + deltaLon;
                if (p.longitude > 180)
                {
                    p.longitude = -180 + (p.longitude - 180);
                } else if (p.longitude < -180)
                {
                    p.longitude = 180 + (p.longitude + 180);
                }
            }
            var allowChange = function () {
                for (var i = 0; i !== positions.length; ++i)
                {
                    var pos = positions[i];
                    if (pos.latitude > 90 || pos.latitude < -90 || pos.longitude < -180 || pos.longitude > 180)
                    {
                        return false;
                    }
                }
                return true;
            };
            if (allowChange())
            {
                this.setPositions(positions);
                this.updateHandles();
                this.emit('update', ended);
                this.wwd.redraw();
            }
        }
    };

    SurfacePolygonEditTool.prototype._renderableDragChanged = function (renderable, recognizer) {
        this._renderableDrag(renderable, recognizer, false);
    };

    SurfacePolygonEditTool.prototype._renderableDragEnded = function (renderable, recognizer) {
        this._renderableDrag(renderable, recognizer, true);
        this._dragStartInfo = null;
    };

    return SurfacePolygonEditTool;
});
