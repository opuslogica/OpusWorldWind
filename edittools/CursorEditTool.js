define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'OpusWorldWind/edittools/AbstractEditTool'
], function (OpusWorldWind, WorldWind, AbstractEditTool) {
    // An edit tool that just provides a cursor on renderable mouseover.
    var CursorEditTool = function (wwd, renderables) {
        AbstractEditTool.call(this, wwd, renderables);

        this.addEventListener('renderableMousedOn', this._renderableMousedOn.bind(this));
        this.addEventListener('renderableMousedOff', this._renderableMousedOff.bind(this));
    };
    CursorEditTool.prototype = Object.create(AbstractEditTool.prototype);

    CursorEditTool.prototype._renderableMousedOn = function (renderable, event) {
        this.wwd.canvas.style.cursor = 'pointer';
    };

    CursorEditTool.prototype._renderableMousedOff = function (renderable, event) {
        this.wwd.canvas.style.cursor = 'default';
    };

    return CursorEditTool;
});
