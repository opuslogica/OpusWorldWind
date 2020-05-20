define([
    'WebWorldWind/WorldWind',
    'OpusWorldWind/edittools/AbstractSurfaceShapeEditTool'
], function (WorldWind, AbstractSurfaceShapeEditTool) {
    var SurfaceCircleEditTool = function (wwd, shape) {
        AbstractSurfaceShapeEditTool.call(this, wwd, shape);
    };
    SurfaceCircleEditTool.prototype = Object.create(AbstractSurfaceShapeEditTool.prototype);

    SurfaceCircleEditTool.prototype.getCenter = function () {
        return this.renderables[0].center;
    };

    SurfaceCircleEditTool.prototype.setCenter = function (center) {
        this.renderables[0].center = center;
    };

    var getRadius = function () {
        return this.renderables[0].radius;
    };

    var setRadius = function (radius) {
        this.renderables[0].radius = radius;
    };

    SurfaceCircleEditTool.prototype.getHalfWidth = getRadius;

    SurfaceCircleEditTool.prototype.setHalfWidth = setRadius;

    SurfaceCircleEditTool.prototype.getHalfHeight = getRadius;

    SurfaceCircleEditTool.prototype.setHalfHeight = setRadius;

    SurfaceCircleEditTool.prototype.getHeading = function () {
        return this.renderables[0].heading;
    };

    SurfaceCircleEditTool.prototype.setHeading = function (heading) {
        this.renderables[0].heading = heading;
    };

    return SurfaceCircleEditTool;
});
