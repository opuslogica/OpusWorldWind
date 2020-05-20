define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/shapes/SurfaceImage',
    'WebWorldWind/util/Logger',
    'WebWorldWind/util/WWMath'
], function (OpusWorldWind, WorldWind, SurfaceImage, Logger, WWMath) {
    var MercatorSurfaceImage = function (sector, imageSource) {
        SurfaceImage.call(this, sector, imageSource);

        this.crossOrigin = 'anonymous';
    };

    MercatorSurfaceImage.prototype = Object.create(SurfaceImage.prototype);

    MercatorSurfaceImage.prototype._unprojectImage = function (dc, img) {
        var srcCanvas = dc.canvas2D;
        var srcContext = dc.ctx2D;
        var destCanvas = document.createElement('canvas');
        var destContext = destCanvas.getContext('2d');
        srcCanvas.width = img.width;
        srcCanvas.height = img.height;
        destCanvas.width = img.width;
        destCanvas.height = img.height;
        srcContext.drawImage(img, 0, 0, img.width, img.height);
        var srcImageData = srcContext.getImageData(0, 0, img.width, img.height);
        var destImageData = destContext.getImageData(0, 0, img.width, img.height);

        // from MercatorTiledImageLayer
        var sector = this.sector;
        var lat, g, srcRow, kSrc, kDest, sy, dy;
        var tMin = WWMath.gudermannianInverse(sector.minLatitude);
        var tMax = WWMath.gudermannianInverse(sector.maxLatitude);
        for (var y = 0; y < img.height; y++)
        {
            sy = 1 - y / (img.height - 1);
            lat = sy * sector.deltaLatitude() + sector.minLatitude;
            g = WWMath.gudermannianInverse(lat);
            dy = 1 - (g - tMin) / (tMax - tMin);
            dy = WWMath.clamp(dy, 0, 1);
            srcRow = Math.floor(dy * (img.height - 1));
            for (var x = 0; x < img.width; x++)
            {
                kSrc = 4 * (x + srcRow * img.width);
                kDest = 4 * (x + y * img.width);

                destImageData.data[kDest] = srcImageData.data[kSrc];
                destImageData.data[kDest + 1] = srcImageData.data[kSrc + 1];
                destImageData.data[kDest + 2] = srcImageData.data[kSrc + 2];
                destImageData.data[kDest + 3] = srcImageData.data[kSrc + 3];
            }
        }

        destContext.putImageData(destImageData, 0, 0);
        return destCanvas;
    };

    MercatorSurfaceImage.prototype._imageSourceKey = function () {
        return 'MercatorSurfaceImage:' + (this.imageSource instanceof WorldWind.ImageSource ? this.imageSource.key : this.imageSource);
    };

    MercatorSurfaceImage.prototype._retrieveTexture = function (dc) {
        var that = this;
        var imageSource = this.imageSource;
        var imageSourceKey = this._imageSourceKey();

        if (!imageSource)
        {
            return null;
        }

        var gl = dc.currentGlContext;
        var cache = dc.gpuResourceCache;

        if (imageSource instanceof WorldWind.ImageSource)
        {
            var unprojImg = this._unprojectImage(dc, imageSource.image);
            var t = new WorldWind.Texture(gl, unprojImg, gl.CLAMP_TO_EDGE);
            cache.putResource(imageSourceKey, t, t.size);
            return t;
        }

        if (cache.currentRetrievals[imageSourceKey] || cache.absentResourceList.isResourceAbsent(imageSourceKey))
        {
            return null;
        }

        var img = new Image();
        img.onload = function () {
            var unprojImg = that._unprojectImage(dc, img);
            var t = new WorldWind.Texture(gl, unprojImg, gl.CLAMP_TO_EDGE);

            cache.putResource(imageSourceKey, t, t.size);
            delete cache.currentRetrievals[imageSourceKey];
            cache.absentResourceList.markResourceAbsent(imageSourceKey);

            // redraw
            var e = document.createEvent('Event');
            e.initEvent(WorldWind.REDRAW_EVENT_TYPE, true, true);
            window.dispatchEvent(e);
        };

        img.onerror = function () {
            delete cache.currentRetrievals[imageSourceKey];
            cache.absentResourceList.markResourceAbsent(imageSourceKey);
            Logger.log(Logger.LEVEL_WARNING, "Image retrieval failed: " + imageSource);
        };

        cache.currentRetrievals[imageSourceKey] = imageSourceKey;
        img.crossOrigin = this.crossOrigin;
        img.src = imageSource;

        return null;
    };

    MercatorSurfaceImage.prototype.bind = function (dc) {
        var imageSourceKey = this._imageSourceKey();
        var texture = dc.gpuResourceCache.resourceForKey(imageSourceKey);
        if (texture && !this.imageSourceWasUpdated)
        {
            return this.bindTexture(dc, texture);
        } else
        {
            texture = this._retrieveTexture(dc);
            this.imageSourceWasUpdated = false;
            if (texture)
            {
                return this.bindTexture(dc, texture);
            }
        }
    };

    return MercatorSurfaceImage;
});
