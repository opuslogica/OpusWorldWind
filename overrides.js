/**
 * This file contains patches applied at runtime to various WebWorldWind components. Eventually
 * these should be transformed into issues/pull requests.
 */
require([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/cache/GpuResourceCache',
    'WebWorldWind/util/ImageSource',
    'WebWorldWind/util/Logger',
    'WebWorldWind/render/Texture',
    'WebWorldWind/layer/TiledImageLayer',
    'WebWorldWind/shapes/SurfaceShape',
    'WebWorldWind/shapes/SurfaceShapeTile',
    'WebWorldWind/shapes/SurfaceCircle',
    'WebWorldWind/shapes/SurfaceEllipse',
    'WebWorldWind/shapes/SurfaceRectangle',
    'WebWorldWind/shapes/Path',
    'WebWorldWind/shapes/GeographicText',
    'WebWorldWind/pick/PickedObject'
], function (OpusWorldWind, WorldWind, GpuResourceCache, ImageSource, Logger, Texture, TiledImageLayer, SurfaceShape, SurfaceShapeTile, SurfaceCircle, SurfaceEllipse, SurfaceRectangle, Path, GeographicText, PickedObject) {
    // patch image retrieving functions to support authenticated cross-origin requests
    ImageSource.fromUrl = function (url, imageWidth, imageHeight) {
        var result = Object.create(ImageSource.prototype);
        result.imageUrl = url;
        result.imageWidth = imageWidth * window.devicePixelRatio;
        result.imageHeight = imageHeight * window.devicePixelRatio;
        result.key = url;
        if (imageWidth)
        {
            result.key = 'w ' + imageWidth + ' ' + result.key;
        }
        if (imageHeight)
        {
            result.key = 'h ' + imageHeight + ' ' + result.key;
        }
        return result;
    };
    GpuResourceCache.prototype.retrieveTexture = function (gl, imageSource, wrapMode) {
        if (!imageSource)
        {
            return null;
        }

        if (imageSource instanceof ImageSource && imageSource.image)
        {
            var t = new Texture(gl, imageSource.image, wrapMode);
            this.putResource(imageSource.key, t, t.size);
            return t;
        }

        if (!(imageSource instanceof ImageSource))
        {
            imageSource = ImageSource.fromUrl(imageSource);
        }

        if (this.currentRetrievals[imageSource.key] || this.absentResourceList.isResourceAbsent(imageSource.key))
        {
            return null;
        }

        var cache = this,
            image = new Image();

        image.onload = function () {
            Logger.log(Logger.LEVEL_INFO, "Image retrieval succeeded: " + imageSource.key);

            var texture = new Texture(gl, image, wrapMode);

            cache.putResource(imageSource.key, texture, texture.size);

            delete cache.currentRetrievals[imageSource.key];
            cache.absentResourceList.unmarkResourceAbsent(imageSource.key);

            // Send an event to request a redraw.
            var e = document.createEvent('Event');
            e.initEvent(WorldWind.REDRAW_EVENT_TYPE, true, true);
            window.dispatchEvent(e);
        };

        image.onerror = function () {
            delete cache.currentRetrievals[imageSource.key];
            cache.absentResourceList.markResourceAbsent(imageSource.key);
            Logger.log(Logger.LEVEL_WARNING, "Image retrieval failed: " + imageSource.key);
        };

        this.currentRetrievals[imageSource.key] = imageSource;
        image.crossOrigin = 'use-credentials';
        image.src = imageSource.imageUrl;
        if (imageSource.imageWidth)
        {
            image.width = imageSource.imageWidth;
        }
        if (imageSource.imageHeight)
        {
            image.height = imageSource.imageHeight;
        }

        return null;
    };
    TiledImageLayer.prototype.retrieveTileImage = function (dc, tile, suppressRedraw) {
        if (this.currentRetrievals.indexOf(tile.imagePath) < 0)
        {
            if (this.absentResourceList.isResourceAbsent(tile.imagePath))
            {
                return;
            }

            var url = this.resourceUrlForTile(tile, this.retrievalImageFormat),
                image = new Image(),
                imagePath = tile.imagePath,
                cache = dc.gpuResourceCache,
                canvas = dc.currentGlContext.canvas,
                layer = this;

            if (!url)
            {
                this.currentTilesInvalid = true;
                return;
            }

            image.onload = function () {
                Logger.log(Logger.LEVEL_INFO, "Image retrieval succeeded: " + url);
                var texture = layer.createTexture(dc, tile, image);
                layer.removeFromCurrentRetrievals(imagePath);

                if (texture)
                {
                    cache.putResource(imagePath, texture, texture.size);

                    layer.currentTilesInvalid = true;
                    layer.absentResourceList.unmarkResourceAbsent(imagePath);

                    if (!suppressRedraw)
                    {
                        // Send an event to request a redraw.
                        var e = document.createEvent('Event');
                        e.initEvent(WorldWind.REDRAW_EVENT_TYPE, true, true);
                        canvas.dispatchEvent(e);
                    }
                }
            };

            image.onerror = function () {
                layer.removeFromCurrentRetrievals(imagePath);
                layer.absentResourceList.markResourceAbsent(imagePath);
                Logger.log(Logger.LEVEL_WARNING, "Image retrieval failed: " + url);
            };

            this.currentRetrievals.push(imagePath);
            image.crossOrigin = this.useCredentials ? 'use-credentials' : 'anonymous';
            image.src = url;
        }
    };

    // patch various surface shapes' property setters to correctly propogate changes (until https://github.com/NASAWorldWind/WebWorldWind/issues/168 is fixed).
    {
        var classPropertyDescriptorOverrides = [
            [SurfaceCircle, {
                radius: {
                    set: function (orig, value) {
                        orig.call(this, value);
                        this.isPrepared = false;
                        this._boundaries = null;
                        this._minorRadius = value;
                        this._majorRadius = value;
                    }
                }
            }],
            [SurfaceEllipse, {
                center: {
                    set: function (orig, value) {
                        orig.call(this, value);
                        this.stateKeyInvalid = true;
                        this.isPrepared = false;
                        this._boundaries = null;
                    }
                },
                majorRadius: {
                    set: function (orig, value) {
                        orig.call(this, value);
                        this.stateKeyInvalid = true;
                        this.isPrepared = false;
                        this._boundaries = null;
                    }
                },
                minorRadius: {
                    set: function (orig, value) {
                        orig.call(this, value);
                        this.stateKeyInvalid = true;
                        this.isPrepared = false;
                        this._boundaries = null;
                    }
                },
                heading: {
                    set: function (orig, value) {
                        orig.call(this, value);
                        this.stateKeyInvalid = true;
                        this.isPrepared = false;
                        this._boundaries = null;
                    }
                },
                intervals: {
                    set: function (orig, value) {
                        orig.call(this, value);
                        this.stateKeyInvalid = true;
                        this.isPrepared = false;
                        this._boundaries = null;
                    }
                }
            }],
            [SurfaceRectangle, {
                center: {
                    set: function (orig, value) {
                        orig.call(this, value);
                        this.stateKeyInvalid = true;
                        this.isPrepared = false;
                        this._center = null;
                    }
                },
                width: {
                    set: function (orig, value) {
                        orig.call(this, value);
                        this.stateKeyInvalid = true;
                        this.isPrepared = false;
                        this._width = null;
                    }
                },
                height: {
                    set: function (orig, value) {
                        orig.call(this, value);
                        this.stateKeyInvalid = true;
                        this.isPrepared = false;
                        this._boundaries = null;
                    }
                },
                heading: {
                    set: function (orig, value) {
                        orig.call(this, value);
                        this.stateKeyInvalid = true;
                        this.isPrepared = false;
                        this._heading = null;
                    }
                }
            }]
        ];
        classPropertyDescriptorOverrides.forEach(function (p) {
            var clazz = p[0];
            var propertyDescOverrides = p[1];
            var newPrototype = {};
            Object.setPrototypeOf(newPrototype, Object.getPrototypeOf(clazz.prototype));
            Object.getOwnPropertyNames(clazz.prototype).forEach(function (propName) {
                var descriptor = Object.getOwnPropertyDescriptor(clazz.prototype, propName);
                for (var k in propertyDescOverrides)
                {
                    if (descriptor[k] !== undefined)
                    {
                        var orig = descriptor[k];
                        descriptor[k] = propertyDescOverrides[k];
                        if (typeof descriptor[k] === 'function')
                        {
                            var fn = descriptor[k];
                            descriptor[k] = function () {
                                return fn.apply(this, [orig].concat(arguments));
                            };
                        }
                    }
                }
            });
        });
    }

    // disable picking on GeographicText (it currently does not work correctly if there are multiple GeographicTexts)
    var prevGtRender = GeographicText.prototype.render;
    GeographicText.prototype.render = function (dc) {
        if (dc.pickingMode)
        {
            return;
        } else
        {
            prevGtRender.call(this, dc);
        }
    };

    // introduce a way to render a hatch pattern (for geofences)
    SurfaceShape.prototype._showHatchPattern = false;

    Object.defineProperties(SurfaceShape.prototype, {
        showHatchPattern: {
            get: function () {
                return this._showHatchPattern;
            },
            set: function (showHatchPattern) {
                this._showHatchPattern = showHatchPattern;
                this.stateKeyInvalid = true;
            }
        }
    });

    var prevSsStaticShapeKey = SurfaceShape.staticStateKey;
    SurfaceShape.staticStateKey = function (shape) {
        var stateKey = prevSsStaticShapeKey.call(this, shape);
        return stateKey +
            ' hp ' + shape.showHatchPattern;
    };

    SurfaceShape.prototype.renderToTexture = function (dc, ctx2D, xScale, yScale, dx, dy) {
        var patternCanvas = SurfaceShapeTile.patternCanvas;
        var patternCtx2D = SurfaceShapeTile.patternCtx2D;
        var attributes = (this._highlighted ? (this._highlightAttributes || this._attributes) : this._attributes);
        var drawInterior = (!this._isInteriorInhibited && attributes.drawInterior);
        var drawOutline = (attributes.drawOutline && attributes.outlineWidth > 0);

        if (!drawInterior && !drawOutline)
        {
            return;
        }

        if (dc.pickingMode && !this.pickColor)
        {
            this.pickColor = dc.uniquePickColor();
        }

        if (dc.pickingMode)
        {
            var pickColor = this.pickColor.toHexString();
        } else
        {
            if (this._showHatchPattern)
            {
                var w = patternCanvas.width;
                var h = patternCanvas.height;
                patternCtx2D.fillStyle = attributes.interiorColor.toCssColorString();
                patternCtx2D.fillRect(0, 0, w, h);
                patternCtx2D.beginPath();
                patternCtx2D.moveTo(0, 0);
                patternCtx2D.lineTo(w, h);
                patternCtx2D.moveTo(w, 0);
                patternCtx2D.lineTo(0, h);
                patternCtx2D.strokeStyle = 'rgba(0, 0, 0, 0.75)';
                patternCtx2D.stroke();
            }
        }

        if (this.crossesAntiMeridian || this.containsPole)
        {
            if (drawInterior)
            {
                this.draw(this._interiorGeometry, ctx2D, xScale, yScale, dx, dy);
                if (!dc.pickingMode && this._showHatchPattern)
                {
                    ctx2D.fillStyle = ctx2D.createPattern(patternCanvas, 'repeat');
                } else
                {
                    ctx2D.fillStyle = dc.pickingMode ? pickColor : attributes.interiorColor.toCssColorString();
                }
                ctx2D.fill();
            }
            if (drawOutline)
            {
                this.draw(this._outlineGeometry, ctx2D, xScale, yScale, dx, dy);
                ctx2D.lineWidth = attributes.outlineWidth;
                ctx2D.strokeStyle = dc.pickingMode ? pickColor : attributes.outlineColor.toCssColorString();
                ctx2D.stroke();
            }
        } else
        {
            this.draw(this._interiorGeometry, ctx2D, xScale, yScale, dx, dy);
            if (drawInterior)
            {
                if (!dc.pickingMode && this._showHatchPattern)
                {
                    ctx2D.fillStyle = ctx2D.createPattern(patternCanvas, 'repeat');
                } else
                {
                    ctx2D.fillStyle = dc.pickingMode ? pickColor : attributes.interiorColor.toCssColorString();
                }
                ctx2D.fill();
            }
            if (drawOutline)
            {
                ctx2D.lineWidth = attributes.outlineWidth;
                ctx2D.strokeStyle = dc.pickingMode ? pickColor : attributes.outlineColor.toCssColorString();
                ctx2D.stroke();
            }
        }

        if (dc.pickingMode)
        {
            var po = new PickedObject(this.pickColor.clone(), this.pickDelegate ? this.pickDelegate : this,
                null, this.layer, false);
            dc.resolvePick(po);
        }
    };

    var prevSstUpdateTexture = SurfaceShapeTile.prototype.updateTexture;
    SurfaceShapeTile.prototype.updateTexture = function (dc) {
        SurfaceShapeTile.patternCanvas.width = this.tileWidth / 8;
        SurfaceShapeTile.patternCanvas.height = this.tileHeight / 8;
        prevSstUpdateTexture.call(this, dc);
    };

    var prevSstCreateCtx2D = SurfaceShapeTile.prototype.createCtx2D;
    SurfaceShapeTile.prototype.createCtx2D = function () {
        if (SurfaceShapeTile.patternCanvas === null)
        {
            SurfaceShapeTile.patternCanvas = document.createElement('canvas');
            SurfaceShapeTile.patternCtx2D = SurfaceShapeTile.patternCanvas.getContext('2d');
        }
        prevSstCreateCtx2D.call(this);
    };

    SurfaceShapeTile.patternCanvas = null;
    SurfaceShapeTile.patternCtx2D = null;
    SurfaceShapeTile.pattern = null;
});
