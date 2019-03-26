define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'OpusWorldWind/RaptorOpenStreetMapImageLayer'
], function(OpusWorldWind, WorldWind, RaptorOpenStreetMapImageLayer) {
    var RaptorMapboxLayer = function(displayName) {
        RaptorOpenStreetMapImageLayer.call(this, displayName);

        this.urlBuilder = {
            urlForTile: function (tile, imageFormat) {
                var z = tile.level.levelNumber + 1;
                var x = tile.column;
                var y = tile.row;
                return 'https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/' + z + '/' + x + '/' + y + '?access_token=pk.eyJ1Ijoib3B1c3JhcHRvciIsImEiOiJjanRxNGxwcDgwMnJqNDRzMDZiMmd3aG1lIn0.MAKhspDfvEMf4MISIyrmAQ';
            }
        };
    };

    RaptorMapboxLayer.prototype = Object.create(RaptorOpenStreetMapImageLayer.prototype);

    OpusWorldWind.RaptorMapboxLayer = RaptorMapboxLayer;
    return RaptorMapboxLayer;
});
