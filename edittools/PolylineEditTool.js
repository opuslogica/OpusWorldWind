define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/geom/Position',
    'OpusWorldWind/edittools/AbstractAirspacePathEditTool'
], function (OpusWorldWind, WorldWind, Position, AbstractAirspacePathEditTool) {
    var PolylineEditTool = function (wwd, mesh) {
        AbstractAirspacePathEditTool.call(this, wwd, mesh);
    };

    PolylineEditTool.prototype = Object.create(AbstractAirspacePathEditTool.prototype);

    PolylineEditTool.prototype.hasTwoAltitudes = function () {
        return true;
    };

    PolylineEditTool.prototype.getAltitude = function (index) {
        return this.renderables[0].positions[0][index].altitude;
    };

    PolylineEditTool.prototype.setAltitude = function (index, altitude) {
        var positions = this.renderables[0].positions;
        for (var i = 0; i !== positions.length; ++i)
        {
            positions[i][index].altitude = altitude;
        }
        this.renderables[0].positions = positions;
    };

    PolylineEditTool.prototype.getMinimumRequiredPositions = function () {
        return 2;
    };

    PolylineEditTool.prototype.getPositions = function () {
        var res = this.renderables[0].positions.map(function (p) {
            var pos = p[0];
            return new Position(pos.latitude, pos.longitude, 0);
        });
        return res;
    };

    PolylineEditTool.prototype.setPositions = function (positions) {
        var alt0 = this.getAltitude(0);
        var alt1 = this.getAltitude(1);
        positions = positions.map(function (pos) {
            return [
                new Position(pos.latitude, pos.longitude, alt0),
                new Position(pos.latitude, pos.longitude, alt1)
            ];
        });
        this.renderables[0].positions = positions;
    };

    PolylineEditTool.prototype.isLoop = function () {
        return false;
    };

    return PolylineEditTool;
});
