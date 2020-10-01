define([
    '../edittools/AbstractPathEditTool',
    '../edittools/EditToolClickRecognizer', // was WebEditToolClickRecognizer?
    '../misc/ExtUtils',
    'WorldWind/error/UnsupportedOperationError',
    'WorldWind/geom/Position',
    'WorldWind/geom/Vec2',
    'WorldWind/geom/Vec3',
    'WorldWind/geom/Line',
    'WorldWind/util/Logger'
], function (
    AbstractPathEditTool,
    EditToolClickRecognizer,
    ExtUtils,
    UnsupportedOperationError,
    Position,
    Vec2,
    Vec3,
    Line,
    Logger
    ) {


    var AbstractAirspacePathEditTool = function (wwd, path) {
        AbstractPathEditTool.call(this, wwd, path);

        this._dragBeginInfo = null;
        this._translateAltitude = false;

        this.addEventListener('renderableDragBegan', this._renderableDragBegan.bind(this));
        this.addEventListener('renderableDragChanged', this._renderableDragChanged.bind(this));
        this.addEventListener('renderableDragEnded', this._renderableDragEnded.bind(this));
        this.addEventListener('keydown', this._keydown.bind(this));
        this.addEventListener('keyup', this._keyup.bind(this));

        new EditToolClickRecognizer(this, this._clickRecognized.bind(this));
    };

    AbstractAirspacePathEditTool.prototype = Object.create(AbstractPathEditTool.prototype);

    AbstractAirspacePathEditTool.prototype._renderableAltitudeIndex = function (renderable) {
        if (this.hasTwoAltitudes()) {
            return renderable === this.renderables[0] ? 1 : (this.isTopHandle(renderable) ? 1 : 0);
        } else {
            return 0;
        }
    };

    AbstractAirspacePathEditTool.prototype._renderableDragBegan = function (renderable, recognizer) {
        var ray = ExtUtils.rayFromScreenPoint(this.wwd.drawContext, this.wwd.drawContext.convertPointToViewport(this.wwd.canvasCoordinates(recognizer.clientX, recognizer.clientY), new Vec3(0, 0)), new Line(new Vec3(0, 0, 0), new Vec3(0, 0, 0)));
        if (renderable === this.renderables[0] || this.handlePositionIndex(renderable) !== null) {
            var positions = this.getPositions().slice();
            var altitude = this.getAltitude(this._renderableAltitudeIndex(renderable));
            this._dragBeginInfo = {
                renderable: renderable,
                altitude: altitude,
                positions: positions.map(function (pos) {
                    return new Position(0, 0, 0).copy(pos);
                }),
                translateAltitude: this._translateAltitude
            };
            if (this._translateAltitude) {
                var center = new Position(0, 0, 0);
                for (var i = 0; i !== positions.length; ++i) {
                    var pos = positions[i];
                    center.latitude += pos.latitude;
                    center.longitude += pos.longitude;
                }
                center.latitude /= positions.length;
                center.longitude /= positions.length;
                center.altitude = this.hasTwoAltitudes() ? (this.getAltitude(0) + this.getAltitude(1)) / 2 : this.getAltitude(0);
                var plane = ExtUtils.computeAltitudePlane(this.wwd, center, renderable.altitudeMode);
                this._dragBeginInfo.altPlane = plane;
                this._dragBeginInfo.altIntersectPt = ExtUtils.intersectPlaneWithLine(plane, ray, new Vec3(0, 0, 0));
            } else {
                this._dragBeginInfo.globeIntersectPt = ExtUtils.nearestIntersectionPoint(ExtUtils.intersectGlobe(this.wwd, ray, altitude), ray);
            }
        }
    };

    AbstractAirspacePathEditTool.prototype._dragged = function (renderable, recognizer, ended) {
        var update = false;
        if (this._dragBeginInfo !== null && renderable === this._dragBeginInfo.renderable) {
            var ray = ExtUtils.rayFromScreenPoint(this.wwd.drawContext, this.wwd.drawContext.convertPointToViewport(this.wwd.canvasCoordinates(recognizer.clientX, recognizer.clientY), new Vec2(0, 0)), new Line(new Vec3(0, 0, 0), new Vec3(0, 0, 0)));
            if (this._dragBeginInfo.translateAltitude) {
                var altIntersectPt = ExtUtils.intersectPlaneWithLine(this._dragBeginInfo.altPlane, ray, new Vec3(0, 0, 0));
                var pos1 = this.positionFromPoint(this._dragBeginInfo.altIntersectPt);
                var pos2 = this.positionFromPoint(altIntersectPt);
                var dalt = pos2.altitude - pos1.altitude;
                this.setAltitude(this._renderableAltitudeIndex(renderable), this._dragBeginInfo.altitude + dalt);
                this.updateHandles();
                update = true;
            } else {
                var globeIntersectPt = ExtUtils.nearestIntersectionPoint(ExtUtils.intersectGlobe(this.wwd, ray, this._dragBeginInfo.altitude), ray);
                if (globeIntersectPt !== null) {
                    var pos1 = this.positionFromPoint(this._dragBeginInfo.globeIntersectPt);
                    var pos2 = this.positionFromPoint(globeIntersectPt);
                    var dlat = pos2.latitude - pos1.latitude;
                    var dlon = pos2.longitude - pos1.longitude;
                    var positions = this.getPositions().slice();
                    if (renderable === this.renderables[0]) {
                        var polygon = renderable;
                        for (var i = 0; i !== positions.length; ++i) {
                            var pos = this._dragBeginInfo.positions[i];
                            pos = new Position(pos.latitude + dlat, pos.longitude + dlon, 0);
                            positions[i] = pos;
                        }
                    } else { // handle
                        var handle = renderable;
                        var index = this.handlePositionIndex(handle);
                        var pos = this._dragBeginInfo.positions[index];
                        pos = new Position(pos.latitude + dlat, pos.longitude + dlon, 0);
                        positions[index] = pos;
                    }
                    var valid = true;
                    for (var i = 0; i !== positions.length; ++i) {
                        var pos = positions[i];
                        pos.longitude = ExtUtils.fixLongitude(pos.longitude);
                        if (!ExtUtils.isValidCoordinates(pos.latitude, pos.longitude)) {
                            valid = false;
                            break;
                        }
                    }
                    if (valid) {
                        update = true;
                        this.setPositions(positions);
                        this.updateHandles();
                    }
                }
            }
        }
        if (ended) {
            this._dragBeginInfo = null;
        }
        if (update) {
            this.emit('update', ended);
            this.wwd.redraw();
        }
    };

    AbstractAirspacePathEditTool.prototype._renderableDragChanged = function (renderable, recognizer) {
        this._dragged(renderable, recognizer, false);
    };

    AbstractAirspacePathEditTool.prototype._renderableDragEnded = function (renderable, recognizer) {
        this._dragged(renderable, recognizer, true);
    };

    AbstractAirspacePathEditTool.prototype._keydown = function (event) {
        if (event.key === 'Shift') {
            this._translateAltitude = true;
        }
    };

    AbstractAirspacePathEditTool.prototype._keyup = function (event) {
        if (event.key === 'Shift') {
            this._translateAltitude = false;
        }
    };

    AbstractAirspacePathEditTool.prototype._clickRecognized = function (renderable, clickCount, info) {
        if (this.handles === null || clickCount !== 2) {
            return;
        }
        if (renderable === this.renderables[0]) {
            var positions = this.getPositions().slice();
            var ray = ExtUtils.rayFromScreenPoint(this.wwd.drawContext, this.wwd.drawContext.convertPointToViewport(this.wwd.canvasCoordinates(info.clientX, info.clientY), new Vec2(0, 0)), new Line(new Vec3(0, 0, 0), new Vec3(0, 0, 0)));
            var altitude = this.getAltitude(this._renderableAltitudeIndex(renderable));
            var intersectPt = ExtUtils.nearestIntersectionPoint(ExtUtils.intersectGlobe(this.wwd, ray, altitude), ray);
            if (intersectPt !== null) {
                var pos = this.positionFromPoint(intersectPt);
                ExtUtils.addPositionToPath(this.wwd, pos, positions, this.isLoop(), WorldWind.CLAMP_TO_GROUND);
                this.setPositions(positions);
                this.updateHandles();
                this.emit('update');
                this.wwd.redraw();
            }
        } else if (this.handles.indexOf(renderable) !== -1) {
            var index = this.handlePositionIndex(renderable);
            var positions = this.getPositions().slice();
            if (positions.length > this.getMinimumRequiredPositions()) {
                positions.splice(index, 1);
                this.setPositions(positions);
                this.updateHandles();
                this.emit('update');
                this.wwd.redraw();
            } else {
                this.emit('delete');
                this.wwd.redraw();
            }
        }
    };

    AbstractAirspacePathEditTool.prototype.setAltitude = function (index, altitude) {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractAirspacePathEditTool", "setAltitude", "abstractInvocation"));
    };

    AbstractAirspacePathEditTool.prototype.getMinimumRequiredPositions = function () {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractAirspacePathEditTool", "getMinimumRequiredPositions", "abstractInvocation"));
    };

    AbstractAirspacePathEditTool.prototype.getPositions = function () {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractAirspacePathEditTool", "getPositions", "abstractInvocation"));
    };

    AbstractAirspacePathEditTool.prototype.setPositions = function (positions) {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractAirspacePathEditTool", "setPositions", "abstractInvocation"));
    };

    AbstractAirspacePathEditTool.prototype.isLoop = function () {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractAirspacePathEditTool", "isLoop", "abstractInvocation"));
    };

    return AbstractAirspacePathEditTool;
});
