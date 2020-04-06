/**
 * Contains overrides to make the map render at the screen's native DPI
 */
require([
    'WebWorldWind/geom/Vec2',
    'WebWorldWind/shapes/Placemark',
    'WebWorldWind/util/WWMath',
    'WebWorldWind/WorldWindow',
], function (Vec2,
             Placemark,
             WWMath,
             WorldWindow) {
    'use strict';

    Placemark.prototype.makeOrderedRenderable = function (dc) {
        var w, h, s,
            offset;

        this.determineActiveAttributes(dc);
        if (!this.activeAttributes)
        {
            return null;
        }

        // Compute the placemark's model point and corresponding distance to the eye point. If the placemark's
        // position is terrain-dependent but off the terrain, then compute it ABSOLUTE so that we have a point for
        // the placemark and are thus able to draw it. Otherwise its image and label portion that are potentially
        // over the terrain won't get drawn, and would disappear as soon as there is no terrain at the placemark's
        // position. This can occur at the window edges.
        dc.surfacePointForMode(this.position.latitude, this.position.longitude, this.position.altitude,
            this.altitudeMode, this.placePoint);

        this.eyeDistance = this.alwaysOnTop ? 0 : dc.eyePoint.distanceTo(this.placePoint);

        if (this.mustDrawLeaderLine(dc))
        {
            dc.surfacePointForMode(this.position.latitude, this.position.longitude, 0,
                this.altitudeMode, this.groundPoint);
        }

        // Compute the placemark's screen point in the OpenGL coordinate system of the WorldWindow by projecting its model
        // coordinate point onto the viewport. Apply a depth offset in order to cause the placemark to appear above nearby
        // terrain. When a placemark is displayed near the terrain portions of its geometry are often behind the terrain,
        // yet as a screen element the placemark is expected to be visible. We adjust its depth values rather than moving
        // the placemark itself to avoid obscuring its actual position.
        if (!dc.projectWithDepth(this.placePoint, this.depthOffset, Placemark.screenPoint))
        {
            return null;
        }

        var visibilityScale = this.eyeDistanceScaling ?
            Math.max(0.0, Math.min(1, this.eyeDistanceScalingThreshold / this.eyeDistance)) : 1;

        // Compute the placemark's transform matrix and texture coordinate matrix according to its screen point, image size,
        // image offset and image scale. The image offset is defined with its origin at the image's bottom-left corner and
        // axes that extend up and to the right from the origin point. When the placemark has no active texture the image
        // scale defines the image size and no other scaling is applied.
        if (this.activeTexture)
        {
            w = this.activeTexture.originalImageWidth;
            h = this.activeTexture.originalImageHeight;
            s = this.activeAttributes.imageScale * visibilityScale;
            offset = this.activeAttributes.imageOffset.offsetForSize(w, h);
            // hack: scaled for high-dpi monitors
            offset.multiply(dc.pixelScale);

            this.imageTransform.setTranslation(
                Placemark.screenPoint[0] - offset[0] * s,
                Placemark.screenPoint[1] - offset[1] * s,
                Placemark.screenPoint[2]);

            this.imageTransform.setScale(w * s, h * s, 1);
        } else
        {
            s = this.activeAttributes.imageScale * visibilityScale;
            offset = this.activeAttributes.imageOffset.offsetForSize(s, s);
            // hack: scaled for high-dpi monitors
            offset.multiply(dc.pixelScale);

            this.imageTransform.setTranslation(
                Placemark.screenPoint[0] - offset[0],
                Placemark.screenPoint[1] - offset[1],
                Placemark.screenPoint[2]);

            this.imageTransform.setScale(s, s, 1);
        }

        this.imageBounds = WWMath.boundingRectForUnitQuad(this.imageTransform);

        // If there's a label, perform these same operations for the label texture.

        if (this.mustDrawLabel())
        {

            this.labelTexture = dc.createTextTexture(this.label, this.activeAttributes.labelAttributes);

            w = this.labelTexture.imageWidth;
            h = this.labelTexture.imageHeight;
            s = this.activeAttributes.labelAttributes.scale * visibilityScale;
            offset = this.activeAttributes.labelAttributes.offset.offsetForSize(w, h);

            this.labelTransform.setTranslation(
                Placemark.screenPoint[0] - offset[0] * s,
                Placemark.screenPoint[1] - offset[1] * s,
                Placemark.screenPoint[2]);

            this.labelTransform.setScale(w * s, h * s, 1);

            this.labelBounds = WWMath.boundingRectForUnitQuad(this.labelTransform);
        }

        return this;
    };


    WorldWindow.prototype.canvasCoordinates = function (x, y) {
        var bbox = this.canvas.getBoundingClientRect(),
            xc = x - (bbox.left + this.canvas.clientLeft),// * (this.canvas.width / bbox.width),
            yc = y - (bbox.top + this.canvas.clientTop);// * (this.canvas.height / bbox.height);

        // hack: scaled for high-dpi monitors
        return (new Vec2(xc, yc)).multiply(this.pixelScale);
    };

});
