define([
    'WebWorldWind/WorldWind',
    'WebWorldWind/geom/Location',
    'WebWorldWind/geom/Sector',
    'WebWorldWind/util/Color',
    'WebWorldWind/layer/MercatorTiledImageLayer'
], function (WorldWind, Location, Sector, Color, MercatorTiledImageLayer) {
    var servers = ['a', 'b', 'c'];
    var OpenStreetMapImageLayer = function (displayName) {
        this.imageSize = 256;
        displayName = displayName || "Open Street Map";

        MercatorTiledImageLayer.call(this,
            new Sector(-85.05, 85.05, -180, 180), new Location(85.05, 180), 19, "image/png", displayName,
            this.imageSize, this.imageSize);

        this.displayName = displayName;
        this.pickEnabled = false;

        this.destCanvas = document.createElement("canvas");
        this.destContext = this.destCanvas.getContext("2d");

        this.urlBuilder = {
            urlForTile: function (tile, imageFormat) {
                var server = servers[Math.floor(Math.random() * servers.length)];
                return "https://" + server + ".tile.openstreetmap.org/" + (tile.level.levelNumber + 1) + "/" + tile.column + "/" + tile.row + ".png";
            }
        };
    };
    OpenStreetMapImageLayer.prototype = Object.create(MercatorTiledImageLayer.prototype);

    OpenStreetMapImageLayer.prototype.createTopLevelTiles = function (dc) {
        this.topLevelTiles = [];

        this.topLevelTiles.push(this.createTile(null, this.levels.firstLevel(), 0, 0));
        this.topLevelTiles.push(this.createTile(null, this.levels.firstLevel(), 0, 1));
        this.topLevelTiles.push(this.createTile(null, this.levels.firstLevel(), 1, 0));
        this.topLevelTiles.push(this.createTile(null, this.levels.firstLevel(), 1, 1));
    };

    OpenStreetMapImageLayer.prototype.mapSizeForLevel = function (levelNumber) {
        return 256 << (levelNumber + 1);
    };

    return OpenStreetMapImageLayer;
});
