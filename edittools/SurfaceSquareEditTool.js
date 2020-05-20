define([
    'WebWorldWind/WorldWind',
    'OpusWorldWind/edittools/AbstractSurfaceShapeEditTool'
], function (WorldWind, AbstractSurfaceShapeEditTool) {
    var SurfaceSquareEditTool = function (wwd, shape) {
        AbstractSurfaceShapeEditTool.call(this, wwd, shape);
    };
    SurfaceSquareEditTool.prototype = Object.create(AbstractSurfaceShapeEditTool.prototype);

    SurfaceSquareEditTool.prototype.getCenter = function () {
        return this.renderables[0].center;
    };

    SurfaceSquareEditTool.prototype.setCenter = function (center) {
        this.renderables[0].center = center;
    };

    var getHalfWidth = function () {
        return this.renderables[0].width / 2;
    };

    var setHalfWidth = function (radius) {
        this.renderables[0].width = radius * 2;
        this.renderables[0].height = radius * 2;
    };

    SurfaceSquareEditTool.prototype.getHalfWidth = getHalfWidth;

    SurfaceSquareEditTool.prototype.setHalfWidth = setHalfWidth;

    SurfaceSquareEditTool.prototype.getHalfHeight = getHalfWidth;

    SurfaceSquareEditTool.prototype.setHalfHeight = setHalfWidth;

    SurfaceSquareEditTool.prototype.getHeading = function () {
        return this.renderables[0].heading;
    };

    SurfaceSquareEditTool.prototype.setHeading = function (heading) {
        this.renderables[0].heading = heading;
    };

    return SurfaceSquareEditTool;
});
