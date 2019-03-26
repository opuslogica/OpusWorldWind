define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/layer/TiledImageLayer',
    'WebWorldWind/geom/Sector',
    'WebWorldWind/geom/Location',
    'WebWorldWind/util/WmsUrlBuilder'
], function(OpusWorldWind, WorldWind, TiledImageLayer, Sector, Location, WmsUrlBuilder) {
    var RaptorWmsLayer = function(wmsHostURL, info) {
        TiledImageLayer.call(this, Sector.FULL_SPHERE, new Location(45, 45), 16, "image/png", info.key, 256, 256);

        this.displayName = info.raptorName;
        this.pickEnabled = false;
        this.useCredentials = true;

        this.urlBuilder = new WmsUrlBuilder(wmsHostURL, info.name);
    };

    RaptorWmsLayer.prototype = Object.create(TiledImageLayer.prototype);

    OpusWorldWind.RaptorWmsLayer = RaptorWmsLayer;

    return RaptorWmsLayer;
});
