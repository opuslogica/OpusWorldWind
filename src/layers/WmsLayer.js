define([
    'WorldWind',
    'WorldWind/layer/TiledImageLayer',
    'WorldWind/geom/Sector',
    'WorldWind/geom/Location',
    'WorldWind/util/WmsUrlBuilder'
], function(WorldWind, TiledImageLayer, Sector, Location, WmsUrlBuilder) {
    var WmsLayer = function(wmsHostURL, info) {
        TiledImageLayer.call(this, Sector.FULL_SPHERE, new Location(45, 45), 16, "image/png", info.key, 256, 256);

        this.displayName = info.raptorName;
        this.pickEnabled = false;
        this.useCredentials = true;

        this.urlBuilder = new WmsUrlBuilder(wmsHostURL, info.name);
    };

    WmsLayer.prototype = Object.create(TiledImageLayer.prototype);

    return WmsLayer;
});