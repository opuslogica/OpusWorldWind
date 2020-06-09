define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind'
], function (OpusWorldWind, WorldWind) {
    var EditToolClickRecognizer = function (editTool, cb) {
        this._editTool = editTool;
        this._cb = cb;
        this._lastClick = null;
        this.maxClickInterval = 200;

        editTool.addEventListener('renderableClicked', this._renderableClicked.bind(this));
    };

    EditToolClickRecognizer.prototype._consumeLastClick = function () {
        this._cb(this._lastClick.renderable, this._lastClick.clickCount, this._lastClick.info);
        this._lastClick = null;
    };

    EditToolClickRecognizer.prototype._renderableClicked = function (renderable, recognizer) {
        var time = new Date().getTime();
        if (this._lastClick !== null)
        {
            this._editTool.clearTimeout(this._lastClick.timeoutID);
            if (this._lastClick.renderable !== renderable)
            {
                this._consumeLastClick();
            }
        }
        this._lastClick = {
            renderable: renderable,
            info: {
                clientX: recognizer.clientX,
                clientY: recognizer.clientY
            },
            timeoutID: this._editTool.setTimeout(this._consumeLastClick.bind(this), this.maxClickInterval),
            clickCount: this._lastClick !== null ? this._lastClick.clickCount + 1 : 1
        };
    };

    return EditToolClickRecognizer;
});
