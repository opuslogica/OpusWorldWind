define([
    'WebWorldWind/WorldWind',
    'OpusWorldWind/edittools/AbstractSurfaceShapeEditTool'
], function (WorldWind, AbstractSurfaceShapeEditTool) {
    var SurfaceRectangleEditTool = function (wwd, shape) {
        AbstractSurfaceShapeEditTool.call(this, wwd, shape);
    };
    SurfaceRectangleEditTool.prototype = Object.create(AbstractSurfaceShapeEditTool.prototype);

    SurfaceRectangleEditTool.prototype.getCenter = function () {
        return this.renderables[0].center;
    };

    SurfaceRectangleEditTool.prototype.setCenter = function (center) {
        this.renderables[0].center = center;
    };

    SurfaceRectangleEditTool.prototype.getHalfWidth = function () {
        return this.renderables[0].width / 2;
    };

    SurfaceRectangleEditTool.prototype.setHalfWidth = function (majorRadius) {
        this.renderables[0].width = majorRadius * 2;
    };

    SurfaceRectangleEditTool.prototype.getHalfHeight = function () {
        return this.renderables[0].height / 2;
    };

    SurfaceRectangleEditTool.prototype.setHalfHeight = function (minorRadius) {
        this.renderables[0].height = minorRadius * 2;
    };

    SurfaceRectangleEditTool.prototype.getHeading = function () {
        return this.renderables[0].heading;
    };

    SurfaceRectangleEditTool.prototype.setHeading = function (heading) {
        this.renderables[0].heading = heading;
    };

    return SurfaceRectangleEditTool;
});
