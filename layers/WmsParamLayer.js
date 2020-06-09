define([
    'WebWorldWind/layer/WmsLayer',
    'WebWorldWind/util/WmsUrlBuilder'
], function (
    WmsLayer,
    WmsUrlBuilder
) {
    'use strict';

    // override WmsUrlBuilder to allow arbitrary params to be added to the url
    var WmsParamUrlBuilder = function (service, layerNames, styleNames, version, timeString, extraParams) {
        WmsUrlBuilder.apply(this, arguments);
        this.extraParams = extraParams;
    };
    WmsParamUrlBuilder.prototype = Object.create(WmsUrlBuilder.prototype);

    WmsParamUrlBuilder.prototype.urlForTile = function (tile, imageFormat) {
        var sb = WmsUrlBuilder.prototype.urlForTile.call(this, tile, imageFormat);
        if (this.extraParams)
        {
            var that = this;
            Object.keys(this.extraParams).forEach(function (key) {
                sb += "&" + key + "=" + that.extraParams[key];
            });
        }
        return sb;
    };


    /**
     * A WmsLayer that allows you to pass extra parameters to the
     * @param {object} config - Same as config argument to WmsLayer(), except there is an "extraParams" value that takes an object of key/value pairs to be appended to the wms url
     * @param timeString
     * @constructor
     */
    var WmsParamLayer = function (config, timeString) {
        WmsLayer.apply(this, arguments);

        // override the default urlBuilder
        this.urlBuilder = new WmsParamUrlBuilder(config.service, config.layerNames, config.styleNames, config.version, timeString, config.extraParams);
        if (config.coordinateSystem)
        {
            this.urlBuilder.crs = config.coordinateSystem;
        }
    };
    WmsParamLayer.prototype = Object.create(WmsLayer.prototype);

    return WmsParamLayer;
});