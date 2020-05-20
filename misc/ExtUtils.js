define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/globe/Globe',
    'WebWorldWind/globe/Globe2D',
    'WebWorldWind/geom/Angle',
    'WebWorldWind/geom/Vec3',
    'WebWorldWind/geom/Matrix',
    'WebWorldWind/geom/Plane',
    'WebWorldWind/geom/Line',
    'WebWorldWind/geom/Position',
    'OpusWorldWind/misc/Intersection'
], function (OpusWorldWind, WorldWind, Globe, Globe2D, Angle, Vec3, Matrix, Plane, Line, Position, Intersection) {
    var ExtUtils = {
        scratchMatrix: Matrix.fromIdentity(),
        convertWorldWindPositionAltitudeMode: function (wwd, position, fromAltitudeMode, toAltitudeMode) {
            if (fromAltitudeMode === toAltitudeMode || toAltitudeMode === WorldWind.CLAMP_TO_GROUND)
            {
                return new Position(position.latitude, position.longitude, position.altitude);
            } else
            {
                var result = new Position();
                result.latitude = position.latitude;
                result.longitude = position.longitude;
                var elev = wwd.drawContext.globe.elevationAtLocation(position.latitude, position.longitude);
                switch (fromAltitudeMode)
                {
                    case WorldWind.CLAMP_TO_GROUND:
                        result.altitude = elev;
                        break;
                    case WorldWind.RELATIVE_TO_GROUND:
                        result.altitude = position.altitude + elev;
                        break;
                    case WorldWind.ABSOLUTE:
                        result.altitude = position.altitude;
                        break;
                    default:
                        throw new Error();
                }
                switch (toAltitudeMode)
                {
                    case WorldWind.RELATIVE_TO_GROUND:
                        result.altitude -= elev;
                        break;
                    case WorldWind.ABSOLUTE:
                        break;
                    default:
                        throw new Error();
                }
                return result;
            }
        },
        intersectPlaneWithLine: function (plane, line, result) {
            // from World-Wind-Java
            var t = (function () {
                var ldotv = plane.normal.dot(line.direction);
                if (ldotv === 0)
                {
                    var ldots = plane.normal.dot(line.origin) + plane.distance;
                    if (ldots === 0)
                    {
                        return Number.POSITIVE_INFINITY;
                    } else
                    {
                        return Number.NaN;
                    }
                } else
                {
                    return -(plane.normal.dot(line.origin) + plane.distance) / ldotv;
                }
            })();
            if (isNaN(t))
            {
                return null;
            } else if (!isFinite(t))
            {
                return result.copy(line.origin);
            } else
            {
                return line.pointAt(t, result);
            }
        },
        // finds the point on the line that has the minimum distance to point pt
        projectPointOntoLine: function (pt, line, result) {
            var op = new Vec3(0, 0, 0).copy(pt).subtract(line.origin);
            return line.pointAt(op.dot(line.direction) / line.direction.magnitude(), result);
        },
        intersectGlobe: function (wwd, line, altitude) {
            // from World-Wind-Java
            if (line === null)
            {
                return null;
            }
            var equRadius = wwd.globe.equatorialRadius + altitude;
            var polRadius = wwd.globe.polarRadius + altitude;
            if (wwd.globe instanceof Globe2D)
            {
                var plane = new Plane(0, 0, 1, -(equRadius - wwd.globe.equatorialRadius));
                var p = ExtUtils.intersectPlaneWithLine(plane, line, new Vec3(0, 0, 0));
                if (p === null)
                {
                    return null;
                }
                var pos = wwd.globe.computePositionFromPoint(p[0], p[1], p[2], new Position(0, 0, 0));
                if (pos === null || pos.latitude < -90 || pos.latitude > 90 || pos.longitude < -180 || pos.longitude > 180)
                {
                    return null;
                }
                return [new Intersection(p, false)];
            } else
            {
                var m = equRadius / polRadius;
                var n = 1;
                var m2 = m * m;
                var n2 = n * n;
                var r2 = equRadius * equRadius;
                var vx = line.direction[0], vy = line.direction[1], vz = line.direction[2];
                var sx = line.origin[0], sy = line.origin[1], sz = line.origin[2];
                var a = vx * vx + m2 * vy * vy + n2 * vz * vz;
                var b = 2 * (sx * vx + m2 * sy * vy + n2 * sz * vz);
                var c = sx * sx + m2 * sy * sy + n2 * sz * sz - r2;
                var discriminant = b * b - 4 * a * c;
                if (discriminant < 0)
                {
                    return null;
                }
                var discriminantRoot = Math.sqrt(discriminant);
                if (discriminant === 0)
                {
                    var p = line.pointAt((-b - discriminantRoot) / (2 * a), new Vec3(0, 0, 0));
                    return [new Intersection(p, true)];
                } else
                {
                    var far = line.pointAt((-b + discriminantRoot) / (2 * a), new Vec3(0, 0, 0));
                    if (c >= 0)
                    {
                        var near = line.pointAt((-b - discriminantRoot) / (2 * a), new Vec3(0, 0, 0));
                        return [new Intersection(near, false), new Intersection(far, false)];
                    } else
                    {
                        return [new Intersection(far, false)];
                    }
                }
            }
        },
        nearestIntersectionPoint: function (intersections, line) {
            // from World-Wind-Java
            var isPointBehindLineOrigin = function (line, point) {
                return new Vec3(0, 0, 0).copy(point).subtract(line.origin).dot(line.direction) < 0;
            };
            if (line === null || intersections === null || intersections.length === 0)
            {
                return null;
            } else
            {
                var result = null;
                var nearestDistanceSq = Number.MAX_VALUE;
                for (var i = 0; i !== intersections.length; ++i)
                {
                    var intersection = intersections[i];
                    if (!isPointBehindLineOrigin(line, intersection.point))
                    {
                        var dsq = intersection.point.distanceToSquared(line.origin);
                        if (dsq < nearestDistanceSq)
                        {
                            result = intersection.point;
                            nearestDistanceSq = dsq;
                        }
                    }
                }
                return result;
            }
        },
        rayFromScreenPoint: function (dc, screenPoint, result) {
            this.scratchMatrix.setToIdentity();
            var modelviewProjectionInv = this.scratchMatrix;
            modelviewProjectionInv.invertMatrix(dc.modelviewProjection);
            var p1 = new Vec3(screenPoint[0], screenPoint[1], 0);
            var p2 = new Vec3(screenPoint[0], screenPoint[1], 1);
            if (!modelviewProjectionInv.unProject(p1, dc.viewport, result.origin))
            {
                return null;
            }
            if (!modelviewProjectionInv.unProject(p2, dc.viewport, result.direction))
            {
                return null;
            }
            result.direction.subtract(result.origin).normalize();
            return result;
        },
        // computes a direction vector for a ray facing right across the screen
        computeScreenRightDirection: function (dc, result) {
            this.scratchMatrix.setToIdentity();
            var modelviewProjectionInv = this.scratchMatrix;
            modelviewProjectionInv.invertMatrix(dc.modelviewProjection);
            var p1 = new Vec3(0, 0, 0);
            var p2 = new Vec3(1, 0, 0);
            var pt1 = new Vec3(0, 0, 0);
            var pt2 = new Vec3(0, 0, 0);
            if (!modelviewProjectionInv.unProject(p1, dc.viewport, pt1))
            {
                return null;
            }
            if (!modelviewProjectionInv.unProject(p2, dc.viewport, pt2))
            {
                return null;
            }
            pt2.subtract(pt1).normalize();
            result.copy(pt2);
            return result;
        },
        // compute a plane facing the viewer for translating altitude at a position
        computeAltitudePlane: function (wwd, pos, altitudeMode) {
            var right = ExtUtils.computeScreenRightDirection(wwd.drawContext, new Vec3(0, 0, 0));
            var pa = wwd.drawContext.surfacePointForMode(pos.latitude, pos.longitude, pos.altitude, altitudeMode, new Vec3(0, 0, 0));
            var pb = new Vec3(0, 0, 0).copy(pa).add(right);
            var pc = wwd.drawContext.surfacePointForMode(pos.latitude, pos.longitude, pos.altitude + 1, altitudeMode, new Vec3(0, 0, 0));
            return Plane.fromPoints(pa, pb, pc);
        },
        // adds a position to a path such that the index of the new position is on the closest path segment
        addPositionToPath: function (wwd, pos, path, loop, altitudeMode) {
            var pt = wwd.drawContext.surfacePointForMode(pos.latitude, pos.longitude, pos.altitude, altitudeMode, new Vec3(0, 0, 0));
            var closestSegIndex = 0, closestSegDistSq = Number.MAX_VALUE;
            var seg = new Line(new Vec3(0, 0, 0), new Vec3(0, 0, 0));
            var projPt = new Vec3(0, 0, 0);
            var checkSegment = function (i1, i2) {
                var p1 = path[i1], p2 = path[i2];
                wwd.drawContext.surfacePointForMode(p1.latitude, p1.longitude, 0, altitudeMode, seg.origin);
                wwd.drawContext.surfacePointForMode(p2.latitude, p2.longitude, 0, altitudeMode, seg.direction);
                seg.direction.subtract(seg.origin).normalize();
                ExtUtils.projectPointOntoLine(pt, seg, projPt);
                var distSq = projPt.distanceToSquared(pt);
                if (distSq < closestSegDistSq)
                {
                    closestSegIndex = i;
                    closestSegDistSq = distSq;
                }
            };
            for (var i = 0; i !== path.length - 1; ++i)
            {
                checkSegment(i, i + 1);
            }
            if (loop)
            {
                checkSegment(path.length - 1, 0);
            }
            path.splice(closestSegIndex + 1, 0, pos);
            return path;
        },
        extractKMLRotationAngles: function (matrix, result) {
            // from World-Wind-Java Matrix
            var xRadians = Math.asin(-matrix[6]);
            if (isNaN(xRadians))
            {
                return null;
            }
            var yRadians;
            if (xRadians < Math.PI / 2)
            {
                if (xRadians > -Math.PI / 2)
                {
                    yRadians = Math.atan2(matrix[2], matrix[10]);
                } else
                {
                    yRadians = -Math.atan2(-matrix[1], matrix[0]);
                }
            } else
            {
                yRadians = Math.atan2(-matrix[1], matrix[0]);
            }
            if (isNaN(yRadians))
            {
                return null;
            }
            var zRadians;
            if (xRadians < Math.PI / 2 && xRadians > -Math.PI / 2)
            {
                zRadians = Math.atan2(matrix[4], matrix[5]);
            } else
            {
                zRadians = 0;
            }
            result[0] = -xRadians * Angle.RADIANS_TO_DEGREES;
            result[1] = -yRadians * Angle.RADIANS_TO_DEGREES;
            result[2] = -zRadians * Angle.RADIANS_TO_DEGREES;
            return result;
        },
        // if longitude is not within -180 and 180, wrap it
        fixLongitude: function (longitude) {
            if (longitude > 180)
            {
                return -180 + (longitude - 180);
            } else if (longitude < -180)
            {
                return 180 + (longitude + 180);
            } else
            {
                return longitude;
            }
        },
        isValidCoordinates: function (latitude, longitude) {
            return latitude >= -90 && latitude < 90 && longitude >= -180 && longitude <= 180;
        },
        beforeDrawFrame: function (wwd, cb) {
            var origDrawFrame = wwd.drawFrame;
            wwd.drawFrame = function () {
                cb();
                origDrawFrame.call(this);
            };
        }
    };

    return ExtUtils;
});
