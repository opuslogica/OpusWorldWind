define([
    'WebWorldWind/WorldWind',
    'OpusWorldWind/edittools/AbstractSurfaceShapeEditTool'
], function (WorldWind, AbstractSurfaceShapeEditTool) {
    var SurfaceEllipseEditTool = function (wwd, shape) {
        AbstractSurfaceShapeEditTool.call(this, wwd, shape);
    };
    SurfaceEllipseEditTool.prototype = Object.create(AbstractSurfaceShapeEditTool.prototype);

    SurfaceEllipseEditTool.prototype.getCenter = function () {
        return this.renderables[0].center;
    };

    SurfaceEllipseEditTool.prototype.setCenter = function (center) {
        this.renderables[0].center = center;
    };

    SurfaceEllipseEditTool.prototype.getHalfWidth = function () {
        return this.renderables[0].majorRadius;
    };

    SurfaceEllipseEditTool.prototype.setHalfWidth = function (majorRadius) {
        this.renderables[0].majorRadius = majorRadius;
    };

    SurfaceEllipseEditTool.prototype.getHalfHeight = function () {
        return this.renderables[0].minorRadius;
    };

    SurfaceEllipseEditTool.prototype.setHalfHeight = function (minorRadius) {
        this.renderables[0].minorRadius = minorRadius;
    };

    SurfaceEllipseEditTool.prototype.getHeading = function () {
        return this.renderables[0].heading;
    };

    SurfaceEllipseEditTool.prototype.setHeading = function (heading) {
        this.renderables[0].heading = heading;
    };

    return SurfaceEllipseEditTool;
});
