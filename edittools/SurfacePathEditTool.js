define([
    'WebWorldWind/WorldWind',
    'WebWorldWind/shapes/ShapeAttributes',
    'OpusWorldWind/edittools/AbstractSurfacePathEditTool'
], function (WorldWind, ShapeAttributes, AbstractSurfacePathEditTool) {
    var SurfacePathEditTool = function (wwd, path) {
        AbstractSurfacePathEditTool.call(this, wwd, path);
    };

    SurfacePathEditTool.prototype = Object.create(AbstractSurfacePathEditTool.prototype);

    SurfacePathEditTool.prototype.getPositions = function () {
        return this.renderables[0].positions;
    };

    SurfacePathEditTool.prototype.setPositions = function (positions) {
        this.renderables[0].positions = positions;
    };

    SurfacePathEditTool.prototype.getMinimumRequiredPositions = function () {
        return 2;
    };

    SurfacePathEditTool.prototype.isLoop = function () {
        return false;
    };

    return SurfacePathEditTool;
});
