define([
    'WebWorldWind/WorldWind',
    'WebWorldWind/error/ArgumentError',
    'WebWorldWind/util/Logger',
    'WebWorldWind/geom/Angle',
    'WebWorldWind/geom/Location',
    'WebWorldWind/geom/Position',
    'OpusWorldWind/shapes/TriPath'
], function (WorldWind, ArgumentError, Logger, Angle, Location, Position, TriPath) {
    var SurfaceArc = function (center, radius, angle, heading, attributes) {
        if (center === undefined)
        {
            throw new ArgumentError(
                Logger.logMessage(Logger.LEVEL_SEVERE, 'SurfaceArc', 'constructor', 'Center is undefined.'));
        }
        if (radius === undefined)
        {
            throw new ArgumentError(
                Logger.logMessage(Logger.LEVEL_SEVERE, 'SurfaceArc', 'constructor', 'Radius is undefined.'));
        }
        if (angle === undefined)
        {
            throw new ArgumentError(
                Logger.logMessage(Logger.LEVEL_SEVERE, 'SurfaceArc', 'constructor', 'Angle is undefined.'));
        }
        if (radius < 0)
        {
            throw new ArgumentError(
                Logger.logMessage(Logger.LEVEL_SEVERE, 'SurfaceArc', 'constructor', 'Radius is negative.'));
        }

        TriPath.call(this, [], attributes);

        this._center = center;
        this._radius = radius;
        this._angle = angle;
        this._heading = heading;
        this._intervals = SurfaceArc.DEFAULT_NUM_INTERVALS;
        this._dirty = true;
    };

    SurfaceArc.prototype = Object.create(TriPath.prototype);

    Object.defineProperties(SurfaceArc.prototype, {
        center: {
            get: function () {
                return this._center;
            },
            set: function (value) {
                this._dirty = true;
                this._center = value;
            }
        },
        radius: {
            get: function () {
                return this._radius;
            },
            set: function (value) {
                this._dirty = true;
                this._radius = value;
            }
        },
        angle: {
            get: function () {
                return this._angle;
            },
            set: function (value) {
                this._dirty = true;
                this._angle = value;
            }
        },
        heading: {
            get: function () {
                return this._heading;
            },
            set: function (value) {
                this._dirty = true;
                this._heading = value;
            }
        },
        intervals: {
            get: function () {
                return this._intervals;
            },
            set: function (value) {
                this._dirty = true;
                this._intervals = value;
            }
        }
    });

    SurfaceArc.DEFAULT_NUM_INTERVALS = 64;
    SurfaceArc.MIN_NUM_INTERVALS = 8;

    SurfaceArc.prototype.doMakeOrderedRenderable = function (dc) {
        if (this._dirty)
        {
            this._positions = this.computePositions(dc);
            this._altitudeMode = WorldWind.CLAMP_TO_GROUND;
            this.referencePosition = this.determineReferencePosition(this._positions);
            this.currentData.tessellatedPoints = null;
            this._dirty = false;
        }
        return TriPath.prototype.doMakeOrderedRenderable.call(this, dc);
    };

    SurfaceArc.prototype.computePositions = function (dc) {
        if (this._radius === 0)
        {
            return null;
        }

        var numLocations = 1 + Math.max(SurfaceArc.MIN_NUM_INTERVALS, this._intervals);
        var globeRadius = dc.globe.radiusAt(this._center.latitude, this._center.longitude);
        var gcPathLength = this._radius / globeRadius;
        var da = this._angle / (numLocations - 1);

        var positions = new Array(numLocations);
        var loc = new Location(0, 0);

        for (var i = 0; i !== numLocations; ++i)
        {
            var azimuth = i * da + this._heading;
            Location.greatCircleLocation(this._center, azimuth, gcPathLength, loc);
            positions[i] = new Position(loc.latitude, loc.longitude, 0);
        }

        return positions;
    };

    SurfaceArc.staticStateKey = function (shape) {
        var shapeStateKey = SurfaceShape.staticStateKey(shape);
        return shapeStateKey +
            ' ce ' + shape.center.toString() +
            ' ra ' + shape.radius.toString() +
            ' an ' + shape.angle.toString() +
            ' he ' + shape.heading.toString() +
            ' in ' + shape.intervals.toString();
    };

    SurfaceArc.prototype.computeStateKey = function () {
        return SurfaceArc.staticStateKey(this);
    };

    return SurfaceArc;
});
