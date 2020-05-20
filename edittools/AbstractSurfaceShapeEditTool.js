define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/util/Logger',
    'WebWorldWind/util/Color',
    'WebWorldWind/util/WWMath',
    'WebWorldWind/geom/Angle',
    'WebWorldWind/geom/Vec3',
    'WebWorldWind/geom/Position',
    'WebWorldWind/geom/Location',
    'WebWorldWind/error/UnsupportedOperationError',
    'WebWorldWind/shapes/Path',
    'WebWorldWind/shapes/ShapeAttributes',
    'OpusWorldWind/edittools/AbstractEditTool',
    'OpusWorldWind/placemarks/PointPlacemark',
    'OpusWorldWind/placemarks/PointPlacemarkAttributes',
    'OpusWorldWind/placemarks/SquarePlacemark',
    'OpusWorldWind/placemarks/ScreenShapePlacemarkAttributes'
], function (OpusWorldWind, WorldWind, Logger, Color, WWMath, Angle, Vec3, Position, Location, UnsupportedOperationError, Path, ShapeAttributes, AbstractEditTool, PointPlacemark, PointPlacemarkAttributes, SquarePlacemark, ScreenShapePlacemarkAttributes) {
    var AbstractSurfaceShapeEditTool = function (wwd, shape) {
        AbstractEditTool.call(this, wwd, [shape]);

        var centerHandlePosition = this._computeCenterHandlePosition();
        var widthHandlePositions = this._computeWidthHandlePositions();
        var heightHandlePositions = this._computeHeightHandlePositions();
        this._haveMouseOn = false;
        this._dragStartInfo = null;
        this._centerHandle = new SquarePlacemark(centerHandlePosition);
        this._widthHandles = [
            new SquarePlacemark(widthHandlePositions[0]),
            new SquarePlacemark(widthHandlePositions[1])
        ];
        this._heightHandles = [
            new SquarePlacemark(heightHandlePositions[0]),
            new SquarePlacemark(heightHandlePositions[1])
        ];

        [this._centerHandle].concat(this._widthHandles).concat(this._heightHandles).forEach(function (handle) {
            handle.attributes.interiorColor = AbstractSurfaceShapeEditTool.NORMAL_HANDLE_COLOR;
            handle.attributes.drawOutline = false;
            handle.highlightAttributes = new ScreenShapePlacemarkAttributes(handle.attributes);
            handle.highlightAttributes.interiorColor = AbstractSurfaceShapeEditTool.HIGHLIGHTED_HANDLE_COLOR;
        });

        this._allHandles().forEach(this.addEditRenderable.bind(this));

        this.editLayer.renderables.forEach(function (r) {
            r.altitudeMode = WorldWind.CLAMP_TO_GROUND;
        });

        this.setEditingEnabled(false);

        this.addEventListener('renderableMousedOn', this._renderableMousedOn.bind(this));
        this.addEventListener('renderableMousedOff', this._renderableMousedOff.bind(this));
        this.addEventListener('renderableUpdated', this._renderableUpdated.bind(this));
        this.addEventListener('renderableDragBegan', this._renderableDragBegan.bind(this));
        this.addEventListener('renderableDragChanged', this._renderableDragChanged.bind(this));
        this.addEventListener('renderableDragEnded', this._renderableDragEnded.bind(this));
    };

    AbstractSurfaceShapeEditTool.NORMAL_HANDLE_COLOR = Color.BLUE;
    AbstractSurfaceShapeEditTool.HIGHLIGHTED_HANDLE_COLOR = Color.GREEN;

    AbstractSurfaceShapeEditTool.prototype = Object.create(AbstractEditTool.prototype);

    AbstractSurfaceShapeEditTool.prototype._allHandles = function () {
        return [this._centerHandle].concat(this._heightHandles).concat(this._widthHandles);
    };

    AbstractSurfaceShapeEditTool.prototype._fromCenterWithHeading = function (xLength, yLength) {
        // use the same calculation here as for (most) surface shapes
        var distance = Math.sqrt(xLength * xLength + yLength * yLength);
        var center = this.getCenter();
        var globeRadius = this.wwd.globe.radiusAt(center.latitude, center.longitude);
        var azimuthRadians = Math.PI / 2.0 - Math.acos(xLength / distance) * (yLength === 0 ? 1 : WWMath.signum(yLength)) + this.renderables[0].heading * Angle.DEGREES_TO_RADIANS;
        var loc = Location.greatCircleLocation(center, azimuthRadians * Angle.RADIANS_TO_DEGREES, distance / globeRadius, new Location(0, 0));
        return new Position(loc.latitude, loc.longitude, 0);
    };

    AbstractSurfaceShapeEditTool.prototype._computeCenterHandlePosition = function () {
        return this.getCenter();
    };

    AbstractSurfaceShapeEditTool.prototype._computeWidthHandlePositions = function () {
        return [
            this._fromCenterWithHeading(-this.getHalfWidth(), 0),
            this._fromCenterWithHeading(this.getHalfWidth(), 0)
        ];
    };

    AbstractSurfaceShapeEditTool.prototype._computeHeightHandlePositions = function () {
        return [
            this._fromCenterWithHeading(0, -this.getHalfHeight()),
            this._fromCenterWithHeading(0, this.getHalfHeight())
        ];
    };

    AbstractSurfaceShapeEditTool.prototype._updateHandlePositions = function () {
        this._centerHandle.position = this._computeCenterHandlePosition();
        var widthHandlePositions = this._computeWidthHandlePositions();
        var heightHandlePositions = this._computeHeightHandlePositions();
        this._widthHandles[0].position = widthHandlePositions[0];
        this._widthHandles[1].position = widthHandlePositions[1];
        this._heightHandles[0].position = heightHandlePositions[0];
        this._heightHandles[1].position = heightHandlePositions[1];
        // heading handle is updated in beforeDrawFrame handler
    };

    AbstractSurfaceShapeEditTool.prototype._renderableMousedOn = function (renderable, event) {
        this.wwd.canvas.style.cursor = 'pointer';
        if (this._allHandles().indexOf(renderable) !== -1)
        {
            renderable.highlighted = true;
        }
        this._haveMouseOn = true;
        this.wwd.redraw();
    };

    AbstractSurfaceShapeEditTool.prototype._renderableMousedOff = function (renderable, event) {
        if (this.activeDragRenderable !== renderable
            && AbstractEditTool.getMousedDownObject(this.wwd) !== renderable
            && this._allHandles().indexOf(renderable) !== -1)
        {
            renderable.highlighted = false;
        }
        this._haveMouseOn = false;
        if (this._dragStartInfo === null)
        {
            this.wwd.canvas.style.cursor = 'default';
        }
        this.wwd.redraw();
    };

    AbstractSurfaceShapeEditTool.prototype._axisHandleDrag = function (relAxisAngle, position, setter) {
        var center = this.getCenter();
        var centerLoc = new Location(center.latitude, center.longitude);
        var posLoc = new Location(position.latitude, position.longitude);
        var globeRadius = this.wwd.globe.radiusAt(center.latitude, center.longitude);
        var axisAngleRadians = relAxisAngle * Angle.DEGREES_TO_RADIANS + this.renderables[0].heading * Angle.DEGREES_TO_RADIANS;
        var posAngleRadians = Location.greatCircleAzimuth(centerLoc, posLoc) * Angle.DEGREES_TO_RADIANS;
        var angleRadians = axisAngleRadians - posAngleRadians;
        var radius = Math.abs(Location.greatCircleDistance(centerLoc, posLoc) * globeRadius * Math.cos(angleRadians));
        setter.call(this, radius);
    };

    AbstractSurfaceShapeEditTool.prototype._renderableDrag = function (renderable, recognizer, ended) {
        var pickedTerrain = this.wwd.pickTerrain(this.wwd.canvasCoordinates(recognizer.clientX, recognizer.clientY)).objects[0];
        if (pickedTerrain)
        {
            if (renderable === this.renderables[0])
            {
                var deltaLat = pickedTerrain.position.latitude - this._dragStartInfo.pickedTerrainPosition.latitude;
                var deltaLon = pickedTerrain.position.longitude - this._dragStartInfo.pickedTerrainPosition.longitude;
                var nextCenter = new Position(0, 0, 0).copy(this._dragStartInfo.center);
                nextCenter.latitude += deltaLat;
                nextCenter.longitude += deltaLon;
                if (nextCenter.latitude <= 90 && nextCenter.latitude >= -90 && nextCenter.longitude >= -180 && nextCenter.longitude <= 180)
                {
                    this.setCenter(nextCenter);
                }
            } else if (renderable === this._centerHandle)
            {
                this.setCenter(pickedTerrain.position);
            } else if (this._widthHandles.indexOf(renderable) !== -1)
            {
                this._axisHandleDrag(90, pickedTerrain.position, this.setHalfWidth);
            } else if (this._heightHandles.indexOf(renderable) !== -1)
            {
                this._axisHandleDrag(0, pickedTerrain.position, this.setHalfHeight);
            } else if (renderable === this._headingHandle)
            {
                var azimuthDegrees = Location.greatCircleAzimuth(this.getCenter(), pickedTerrain.position);
                this.setHeading(azimuthDegrees);
            } else
            {
                throw new Error('Unrecognized handle');
            }
            this._updateHandlePositions();
            this.emit('update', ended);
            this.wwd.redraw();
        } else if (ended)
        {
            this.emit('update', true);
            this.wwd.redraw();
        }
    };

    AbstractSurfaceShapeEditTool.prototype._renderableUpdated = function (renderable) {
        if (renderable === this.renderables[0])
        {
            this._updateHandlePositions();
        }
    };

    AbstractSurfaceShapeEditTool.prototype._renderableDragBegan = function (renderable, recognizer) {
        var pickedTerrain = this.wwd.pickTerrain(this.wwd.canvasCoordinates(recognizer.clientX, recognizer.clientY)).objects[0];
        if (pickedTerrain)
        {
            this._dragStartInfo = {
                pickedTerrainPosition: pickedTerrain.position,
                center: new Position(0, 0, 0).copy(this.renderables[0].center)
            };
            if (this._allHandles().indexOf(renderable) !== -1)
            {
                renderable.highlighted = true;
                this.wwd.redraw();
            }
        }
    };

    AbstractSurfaceShapeEditTool.prototype._renderableDragChanged = function (renderable, recognizer) {
        this._renderableDrag(renderable, recognizer, false);
    };

    AbstractSurfaceShapeEditTool.prototype._renderableDragEnded = function (renderable, recognizer) {
        this._renderableDrag(renderable, recognizer, true);
        this._dragStartInfo = null;
        if (!this._haveMouseOn)
        {
            this.wwd.canvas.style.cursor = 'default';
        }
        if (this._allHandles().indexOf(renderable) !== -1)
        {
            renderable.highlighted = false;
            this.wwd.redraw();
        }
    };

    AbstractSurfaceShapeEditTool.prototype.getCenter = function () {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractSurfaceShapeEditTool", "getCenter", "abstractInvocation"));
    };

    AbstractSurfaceShapeEditTool.prototype.setCenter = function (center) {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractSurfaceShapeEditTool", "setCenter", "abstractInvocation"));
    };

    AbstractSurfaceShapeEditTool.prototype.getHalfWidth = function () {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractSurfaceShapeEditTool", "getHalfWidth", "abstractInvocation"));
    };

    AbstractSurfaceShapeEditTool.prototype.setHalfWidth = function (halfWidth) {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractSurfaceShapeEditTool", "setHalfWidth", "abstractInvocation"));
    };

    AbstractSurfaceShapeEditTool.prototype.getHalfHeight = function () {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractSurfaceShapeEditTool", "getHalfHeight", "abstractInvocation"));
    };

    AbstractSurfaceShapeEditTool.prototype.setHalfHeight = function (halfHeight) {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractSurfaceShapeEditTool", "setHalfHeight", "abstractInvocation"));
    };

    AbstractSurfaceShapeEditTool.prototype.getHeading = function () {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractSurfaceShapeEditTool", "getHeading", "abstractInvocation"));
    };

    AbstractSurfaceShapeEditTool.prototype.setHeading = function (heading) {
        throw new UnsupportedOperationError(Logger.logMessage(Logger.LEVEL_SEVERE, "AbstractSurfaceShapeEditTool", "setHeading", "abstractInvocation"));
    };

    AbstractSurfaceShapeEditTool.prototype.isEditingEnabled = function () {
        return this.editLayer.renderables.reduce(function (acc, renderable) {
            return acc || renderable.enabled;
        }, false);
    };

    AbstractSurfaceShapeEditTool.prototype.setEditingEnabled = function (enabled) {
        this.editLayer.renderables.forEach(function (renderable) {
            renderable.enabled = enabled;
        });
    };

    return AbstractSurfaceShapeEditTool;
});
