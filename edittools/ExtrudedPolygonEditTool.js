define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/geom/Position',
    'OpusWorldWind/edittools/AbstractAirspacePathEditTool'
], function (OpusWorldWind, WorldWind, Position, AbstractAirspacePathEditTool) {
    var ExtrudedPolygonEditTool = function (wwd, polygon) {
        AbstractAirspacePathEditTool.call(this, wwd, polygon);
    };

    ExtrudedPolygonEditTool.prototype = Object.create(AbstractAirspacePathEditTool.prototype);

    ExtrudedPolygonEditTool.prototype.hasTwoAltitudes = function () {
        return false;
    };

    ExtrudedPolygonEditTool.prototype.getAltitude = function (index) {
        return this.renderables[0].boundaries[0].altitude;
    };

    ExtrudedPolygonEditTool.prototype.setAltitude = function (index, altitude) {
        this.renderables[0].boundaries = this.renderables[0].boundaries.map(function (pos) {
            return new Position(pos.latitude, pos.longitude, altitude);
        });
    };

    ExtrudedPolygonEditTool.prototype.getMinimumRequiredPositions = function () {
        return 3;
    };

    ExtrudedPolygonEditTool.prototype.getPositions = function () {
        return this.renderables[0].boundaries;
    };

    ExtrudedPolygonEditTool.prototype.setPositions = function (positions) {
        var altitude = this.getAltitude();
        positions = positions.map(function (pos) {
            return new Position(pos.latitude, pos.longitude, altitude);
        });
        this.renderables[0].boundaries = positions;
    };

    ExtrudedPolygonEditTool.prototype.isLoop = function () {
        return true;
    };

    return ExtrudedPolygonEditTool;
});
