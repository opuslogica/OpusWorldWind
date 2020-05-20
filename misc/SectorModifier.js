define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/layer/RenderableLayer',
    'WebWorldWind/geom/Location',
    'WebWorldWind/geom/Vec3',
    'OpusWorldWind/misc/SectorRenderable'
], function (OpusWorldWind, WorldWind, RenderableLayer, Location, Vec3, SectorRenderable) {
    /**
     * When constructed, will handle user inputs to modify a sector
     * and will display the sector on the globe.
     *
     * @param {WorldWind.WorldWindow} wwd
     * @param {WorldWind.Sector} sector
     */
    var SectorModifier = function (wwd, sector) {
        this._wwd = wwd;
        this._gestureHandler = {
            shouldHandle: this._shouldHandle.bind(this),
            dragBegan: this._dragBegan.bind(this),
            dragChanged: this._dragChanged.bind(this),
            dragEnded: this._dragEnded.bind(this)
        };
        this._sectorListeners = [];
        this._sector = sector;
        this._dragStartLocation = null;

        this._layer = new RenderableLayer();
        this._renderables = [];

        wwd.addLayer(this._layer);
        OpusWorldWind.AbstractEditTool.addCustomGestureHandler(this._wwd, this._gestureHandler);

        this._updateRenderables();
    };

    SectorModifier.prototype._shouldHandle = function (object, evt) {
        return true;
    };

    SectorModifier.prototype._positionToScreenPoint = function (latitude, longitude, result) {
        var dc = this._wwd.drawContext;
        var pt = new Vec3(0, 0, 0);
        var terrains = [this._wwd.terrainCenter, this._wwd.terrainRight, this._wwd.terrainCenter, dc.terrain];
        var vp = this._wwd.viewport;
        for (var i = 0; i !== terrains.length; ++i)
        {
            var terrain = terrains[i];
            if (terrain)
            {
                terrain.surfacePointForMode(latitude, longitude, 0, WorldWind.CLAMP_TO_GROUND, pt);
                if (dc.projectWithDepth(pt, 0, result) && result[0] >= 0 && result[0] <= vp.width)
                {
                    return result;
                }
            }
        }
        return null;
    };

    SectorModifier.prototype._updateRenderables = function () {
        var shouldSplit = this._sector.minLongitude < -180;
        var minLat = this._sector.minLatitude;
        var maxLat = this._sector.maxLatitude;
        var minLon1 = shouldSplit ? -180 : this._sector.minLongitude;
        var maxLon1 = this._sector.maxLongitude;
        if (this._renderables.length < 1)
        {
            this._renderables.push(new SectorRenderable(new WorldWind.Sector(minLat, maxLat, minLon1, maxLon1)));
            this._layer.addRenderable(this._renderables[0]);
        } else
        {
            var r = this._renderables[0];
            r.sector.minLatitude = minLat;
            r.sector.maxLatitude = maxLat;
            r.sector.minLongitude = minLon1;
            r.sector.maxLongitude = maxLon1;
        }
        if (shouldSplit)
        {
            var minLon2 = this._sector.minLongitude + 360;
            var maxLon2 = 180;
            if (this._renderables.length < 2)
            {
                this._renderables.push(new SectorRenderable(new WorldWind.Sector(minLat, maxLat, minLon2, maxLon2)));
                this._layer.addRenderable(this._renderables[1]);
            } else
            {
                var r = this._renderables[1];
                r.sector.minLatitude = minLat;
                r.sector.maxLatitude = maxLat;
                r.sector.minLongitude = minLon2;
                r.sector.maxLongitude = maxLon2;
            }
        } else if (this._renderables.length === 2)
        {
            this._layer.removeRenderable(this._renderables[1]);
            this._renderables.pop();
        }
    };

    SectorModifier.prototype._updateSector = function (dragLocation) {
        var lat1 = this._dragStartLocation.latitude;
        var lat2 = dragLocation.latitude;
        var lon1 = this._dragStartLocation.longitude;
        var lon2 = dragLocation.longitude;
        this._sector.minLatitude = Math.min(lat1, lat2);
        this._sector.maxLatitude = Math.max(lat1, lat2);
        this._sector.minLongitude = Math.min(lon1, lon2);
        this._sector.maxLongitude = Math.max(lon1, lon2);
        var sp1 = this._positionToScreenPoint(this._sector.minLatitude, this._sector.minLongitude, new Vec3(0, 0, 0));
        var sp2 = this._positionToScreenPoint(this._sector.maxLatitude, this._sector.maxLongitude, new Vec3(0, 0, 0));
        if (sp1 && sp2 && sp1[0] > sp2[0])
        {
            // sector crossing anti-meridian needs to be corrected
            var t = this._sector.maxLongitude;
            this._sector.maxLongitude = this._sector.minLongitude;
            this._sector.minLongitude = t - 360;
        }
    };

    SectorModifier.prototype._dragBegan = function (object, evt) {
        if (object.position !== null)
        {
            this._dragStartLocation = object.position;
            this._updateSector(object.position);
            this._updateRenderables();
            this._wwd.redraw();
        }
    };

    SectorModifier.prototype._dragChanged = function (object, evt) {
        if (this._dragStartLocation !== null)
        {
            var pickedTerrain = this._wwd.pickTerrain(this._wwd.canvasCoordinates(evt.clientX, evt.clientY)).objects[0];
            if (pickedTerrain)
            {
                this._updateSector(pickedTerrain.position);
                this._updateRenderables();
                this._wwd.redraw();
            }
        }
    };

    SectorModifier.prototype._dragEnded = function (object, evt) {
        var that = this;
        if (this._dragStartLocation !== null)
        {
            this._dragChanged(object, evt);
            this._sectorListeners.forEach(function (listener) {
                listener(that._sector);
            });
        }
    };

    SectorModifier.prototype.onSectorChanged = function (listener) {
        this._sectorListeners.push(listener);
    };

    SectorModifier.prototype.offSectorChanged = function (listener) {
        var index = this._sectorListeners.indexOf(listener);
        if (index >= 0)
        {
            this._sectorListeners.splice(index, 1);
        }
    };

    SectorModifier.prototype.finished = function () {
        this._wwd.removeLayer(this._layer);
        OpusWorldWind.AbstractEditTool.removeCustomGestureHandler(this._wwd, this._gestureHandler);
    };

    return SectorModifier;
});
