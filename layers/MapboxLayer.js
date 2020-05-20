define([
    'WebWorldWind/geom/Location',
    'WebWorldWind/geom/Sector',
    'WebWorldWind/util/Color',
    'WebWorldWind/WorldWind',
    'WebWorldWind/layer/MercatorTiledImageLayer'
], function (Location, Sector, Color, WorldWind, MercatorTiledImageLayer) {
    var MapboxLayer = function (displayName) {
        this.imageSize = 512;
        displayName = displayName || "Mapbox";

        MercatorTiledImageLayer.call(this,
            new Sector(-85.05, 85.05, -180, 180), new Location(85.05, 180), 19, "image/png", displayName,
            this.imageSize, this.imageSize);

        this.displayName = displayName;
        this.pickEnabled = false;

        this.destCanvas = document.createElement("canvas");
        this.destContext = this.destCanvas.getContext("2d");

        this.urlBuilder = {
            urlForTile: function (tile, imageFormat) {
                var z = tile.level.levelNumber + 1;
                var x = tile.column;
                var y = tile.row;
                return 'https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/512/' + z + '/' + x + '/' + y + '@2x?access_token=pk.eyJ1Ijoib3B1c3JhcHRvciIsImEiOiJjanRxNGxwcDgwMnJqNDRzMDZiMmd3aG1lIn0.MAKhspDfvEMf4MISIyrmAQ';
            }
        };
    };

    MapboxLayer.prototype = Object.create(MercatorTiledImageLayer.prototype);

    MapboxLayer.prototype.createTopLevelTiles = function (dc) {
        this.topLevelTiles = [];

        this.topLevelTiles.push(this.createTile(null, this.levels.firstLevel(), 0, 0));
        this.topLevelTiles.push(this.createTile(null, this.levels.firstLevel(), 0, 1));
        this.topLevelTiles.push(this.createTile(null, this.levels.firstLevel(), 1, 0));
        this.topLevelTiles.push(this.createTile(null, this.levels.firstLevel(), 1, 1));
    };

    MapboxLayer.prototype.mapSizeForLevel = function (levelNumber) {
        return 512 << (levelNumber + 1);
    };

    return MapboxLayer;
});
