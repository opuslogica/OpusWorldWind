define([
    'WebWorldWind/WorldWind',
    'WebWorldWind/render/SurfaceTile',
    'WebWorldWind/render/Texture'
], function (WorldWind, SurfaceTile, Texture) {
    /**
     * Renderable for visualizing a sector.
     */
    var SectorRenderable = function (sector) {
        SurfaceTile.call(this, sector);

        this.enabled = true;
        this.displayName = 'Extent Renderable';
    };
    SectorRenderable.prototype = Object.create(SurfaceTile.prototype);

    SectorRenderable.prototype.bind = function (dc) {
        var gl = dc.currentGlContext;
        var textureKey = this.displayName;
        var texture = dc.gpuResourceCache.resourceForKey(textureKey);
        if (texture)
        {
            return texture.bind(dc);
        } else
        {
            var canvas = dc.canvas2D;
            var ctx = dc.ctx2D;
            canvas.width = 1;
            canvas.height = 1;
            ctx.fillStyle = 'rgba(230, 230, 230, 0.75)';
            ctx.fillRect(0, 0, 1, 1);
            texture = new Texture(gl, canvas, gl.CLAMP_TO_EDGE);
            dc.gpuResourceCache.putResource(textureKey, texture, texture.size);
        }
    };

    SectorRenderable.prototype.applyInternalTransform = function (dc, matrix) {
    };

    SectorRenderable.prototype.render = function (dc) {
        if (!this.enabled || dc.pickingMode || !dc.terrain || !this.sector.overlaps(dc.terrain.sector) || dc.pickingMode)
        {
            return;
        }

        dc.surfaceTileRenderer.renderTiles(dc, [this], 1);

        dc.currentLayer.inCurrentFrame = true;
    };

    return SectorRenderable;
});
