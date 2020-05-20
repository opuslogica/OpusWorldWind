define([
    'WebWorldWind/WorldWind',
    'WebWorldWind/shapes/Path',
    'WebWorldWind/shapes/ShapeAttributes',
    'WebWorldWind/util/Color',
    'WebWorldWind/geom/Position',
    'WebWorldWind/geom/Angle',
    'WebWorldWind/geom/Vec3',
    'WebWorldWind/geom/Vec2',
    'WebWorldWind/geom/Line',
    'WebWorldWind/geom/Plane',
    'WebWorldWind/geom/Matrix',
    'OpusWorldWind/edittools/AbstractEditTool',
    'OpusWorldWind/shapes/AbstractRigidMesh',
    'OpusWorldWind/shapes/Pyramid',
    'OpusWorldWind/shapes/Ellipsoid',
    'OpusWorldWind/misc/ExtUtils'
], function (WorldWind, Path, ShapeAttributes, Color, Position, Angle, Vec3, Vec2, Line, Plane, Matrix, AbstractEditTool, AbstractRigidMesh, Pyramid, Ellipsoid, ExtUtils) {
    var EditingMode = {
        NONE: 'NONE',
        MOVE: 'MOVE',
        SCALE: 'SCALE',
        ROTATE: 'ROTATE',
        SKEW: 'SKEW'
    };

    var RigidMeshEditTool = function (wwd, shape) {
        AbstractEditTool.call(this, wwd, shape);

        var that = this;

        var center = this.renderables[0].center;

        this._haveMouseOn = false;
        this._dragBeginInfo = null;
        this._editingMode = EditingMode.NONE;
        this._rs = {
            move: {
                handles: {
                    widthFirst: new Pyramid(new Position(0, 0, 0), 0, 0, 0),
                    widthSecond: new Pyramid(new Position(0, 0, 0), 0, 0, 0),
                    lengthFirst: new Pyramid(new Position(0, 0, 0), 0, 0, 0),
                    lengthSecond: new Pyramid(new Position(0, 0, 0), 0, 0, 0),
                    heightFirst: new Pyramid(new Position(0, 0, 0), 0, 0, 0),
                    heightSecond: new Pyramid(new Position(0, 0, 0), 0, 0, 0)
                },
                connectors: {
                    width: new Path([
                        new Position(0, 0, 0),
                        new Position(0, 0, 0)
                    ]),
                    length: new Path([
                        new Position(0, 0, 0),
                        new Position(0, 0, 0)
                    ]),
                    height: new Path([
                        new Position(0, 0, 0),
                        new Position(0, 0, 0)
                    ])
                }
            },
            scale: {
                handles: {
                    widthFirst: new Ellipsoid(new Position(0, 0, 0), 0, 0, 0),
                    widthSecond: new Ellipsoid(new Position(0, 0, 0), 0, 0, 0),
                    lengthFirst: new Ellipsoid(new Position(0, 0, 0), 0, 0, 0),
                    lengthSecond: new Ellipsoid(new Position(0, 0, 0), 0, 0, 0),
                    heightFirst: new Ellipsoid(new Position(0, 0, 0), 0, 0, 0),
                    heightSecond: new Ellipsoid(new Position(0, 0, 0), 0, 0, 0)
                },
                connectors: {
                    width: new Path([
                        new Position(0, 0, 0),
                        new Position(0, 0, 0)
                    ]),
                    length: new Path([
                        new Position(0, 0, 0),
                        new Position(0, 0, 0)
                    ]),
                    height: new Path([
                        new Position(0, 0, 0),
                        new Position(0, 0, 0)
                    ])
                }
            },
            rotate: {
                handles: {
                    aroundX: new Ellipsoid(new Position(0, 0, 0), 0, 0, 0),
                    aroundY: new Ellipsoid(new Position(0, 0, 0), 0, 0, 0),
                    aroundZ: new Ellipsoid(new Position(0, 0, 0), 0, 0, 0)
                },
                connectors: {}
            },
            skew: {
                handles: {
                    x: new Ellipsoid(new Position(0, 0, 0), 0, 0, 0),
                    y: new Ellipsoid(new Position(0, 0, 0), 0, 0, 0)
                },
                connectors: {
                    centerToX: new Path([
                        new Position(0, 0, 0),
                        new Position(0, 0, 0)
                    ]),
                    centerToY: new Path([
                        new Position(0, 0, 0),
                        new Position(0, 0, 0)
                    ])
                }
            }
        };
        Object.values(this._rs.move.handles).forEach(function (handle) {
            handle.attributes.interiorColor = RigidMeshEditTool.MOVE_HANDLE_COLOR;
        });
        this._rs.move.handles.widthFirst.roll = 90;
        this._rs.move.handles.widthSecond.roll = -90;
        this._rs.move.handles.lengthFirst.pitch = -90;
        this._rs.move.handles.lengthSecond.pitch = 90;
        this._rs.move.handles.heightFirst.roll = -180;
        Object.values(this._rs.move.connectors).forEach(function (connector) {
            connector.attributes.outlineColor = RigidMeshEditTool.MOVE_HANDLE_COLOR;
        });
        Object.values(this._rs.scale.handles).forEach(function (handle) {
            handle.attributes.interiorColor = RigidMeshEditTool.SCALE_HANDLE_COLOR;
        });
        Object.values(this._rs.scale.connectors).forEach(function (handle) {
            handle.attributes.outlineColor = RigidMeshEditTool.SCALE_HANDLE_COLOR;
        });
        this._rs.rotate.handles.aroundX.attributes.interiorColor = RigidMeshEditTool.AROUND_MAJOR_HANDLE_COLOR;
        this._rs.rotate.handles.aroundY.attributes.interiorColor = RigidMeshEditTool.AROUND_MINOR_HANDLE_COLOR;
        this._rs.rotate.handles.aroundZ.attributes.interiorColor = RigidMeshEditTool.AROUND_VERTICAL_HANDLE_COLOR;
        Object.values(this._rs.skew.handles).forEach(function (handle) {
            handle.attributes.interiorColor = RigidMeshEditTool.SKEW_HANDLE_COLOR;
        });
        Object.values(this._rs.skew.connectors).forEach(function (handle) {
            handle.attributes.outlineColor = RigidMeshEditTool.SKEW_HANDLE_COLOR;
        });
        Object.values(this._rs).forEach(function (o) {
            Object.values(o.handles).concat(Object.values(o.connectors)).forEach(function (r) {
                var interiorColor = r.attributes.interiorColor.clone();
                interiorColor.alpha = RigidMeshEditTool.HANDLE_OPACITY_INACTIVE;
                r.highlightAttributes = new ShapeAttributes(r.attributes);
                r.highlightAttributes.interiorColor = r.attributes.interiorColor;
                r.attributes.interiorColor = interiorColor;
                that.addEditRenderable(r);
            });
            Object.values(o.connectors).forEach(function (path) {
                if (!(path instanceof Path))
                {
                    throw new Error('expected connector to be a path');
                }
                var outlineColor = path.attributes.outlineColor.clone();
                outlineColor.alpha = RigidMeshEditTool.HANDLE_OPACITY_INACTIVE;
                path.attributes.outlineColor = outlineColor;
                path.pathType = WorldWind.LINEAR;
            });
        });
        this.editLayer.renderables.forEach(function (renderable) {
            renderable.enabled = false;
        });
        this.addEventListener('beforeDrawFrame', this._beforeDrawFrame.bind(this));
        this.addEventListener('renderableDragBegan', this._renderableDragBegan.bind(this));
        this.addEventListener('renderableDragChanged', this._renderableDragChanged.bind(this));
        this.addEventListener('renderableDragEnded', this._renderableDragEnded.bind(this));
        this.addEventListener('renderableMousedOn', this._renderableMousedOn.bind(this));
        this.addEventListener('renderableMousedOff', this._renderableMousedOff.bind(this));
    };

    RigidMeshEditTool.HANDLE_DISTANCE_PX = 32;
    RigidMeshEditTool.HANDLE_RADIUS_PX = 16;
    RigidMeshEditTool.HANDLE_OPACITY_INACTIVE = 0.5;
    RigidMeshEditTool.HANDLE_OPACITY_ACTIVE = 1.0;
    RigidMeshEditTool.MOVE_HANDLE_COLOR = Color.GREEN;
    RigidMeshEditTool.SCALE_HANDLE_COLOR = Color.RED;
    RigidMeshEditTool.ROTATE_HANDLE_THICKNESS_PX = 8;
    RigidMeshEditTool.AROUND_MAJOR_HANDLE_COLOR = Color.GREEN;
    RigidMeshEditTool.AROUND_MINOR_HANDLE_COLOR = Color.RED;
    RigidMeshEditTool.AROUND_VERTICAL_HANDLE_COLOR = Color.YELLOW;
    RigidMeshEditTool.SKEW_HANDLE_COLOR = Color.BLUE;

    RigidMeshEditTool.EditingMode = EditingMode;

    RigidMeshEditTool.prototype = Object.create(AbstractEditTool.prototype);

    RigidMeshEditTool.prototype._pointFromCenterWithSurfaceRotation = function (xLength, yLength, zLength, info) {
        info = info || this.renderables[0];
        var center = info.center;
        var centerPoint = this.wwd.drawContext.surfacePointForMode(center.latitude, center.longitude, center.altitude, info.altitudeMode, new Vec3(0, 0, 0));
        var pt = new Vec3(xLength, yLength, zLength);
        var transform = Matrix.fromIdentity();
        AbstractRigidMesh.multiplyMatrixBySurfaceRotation(transform, this.wwd.globe, info.center);
        pt.multiplyByMatrix(transform);
        pt[0] += centerPoint[0];
        pt[1] += centerPoint[1];
        pt[2] += centerPoint[2];
        return pt;
    };

    RigidMeshEditTool.prototype._pointFromCenterWithAll = function (xLength, yLength, zLength, info) {
        info = info || this.renderables[0];
        var center = info.center;
        var centerPoint = this.wwd.drawContext.surfacePointForMode(center.latitude, center.longitude, center.altitude, info.altitudeMode, new Vec3(0, 0, 0));
        var pt = new Vec3(xLength, yLength, zLength);
        var transform = Matrix.fromIdentity();
        AbstractRigidMesh.multiplyMatrixBySurfaceRotation(transform, this.wwd.globe, info.center);
        transform.multiplyByRotation(0, 1, 0, 360 - info.roll);
        transform.multiplyByRotation(1, 0, 0, 360 - info.pitch);
        transform.multiplyByRotation(0, 0, 1, 360 - info.heading);
        AbstractRigidMesh.multiplyMatrixBySkew(transform, info.skewX, info.skewY);
        pt.multiplyByMatrix(transform);
        pt[0] += centerPoint[0];
        pt[1] += centerPoint[1];
        pt[2] += centerPoint[2];
        return pt;
    };

    RigidMeshEditTool.prototype._allHandles = function () {
        return Object.values(this._rs).reduce(function (arr, o) {
            arr.push.apply(arr, Object.values(o.handles));
            return arr;
        }, []);
    };

    RigidMeshEditTool.prototype._allConnectors = function () {
        return Object.values(this._rs).reduce(function (arr, o) {
            arr.push.apply(arr, Object.values(o.connectors));
            return arr;
        }, []);
    };

    RigidMeshEditTool.prototype._computeHandlePoints = function (rsk, info) {
        info = info || this.renderables[0];
        var that = this;
        var center = info.center;
        var centerPt = this.wwd.drawContext.surfacePointForMode(center.latitude, center.longitude, center.altitude, info.altitudeMode, new Vec3(0, 0, 0));
        if (rsk === 'rotate')
        {
            return {
                aroundX: centerPt,
                aroundY: centerPt,
                aroundZ: centerPt
            };
        } else
        {
            var eyePoint = this.wwd.drawContext.eyePoint;
            var handleCenterPts;
            if (rsk === 'move')
            {
                handleCenterPts = {
                    widthFirst: this._pointFromCenterWithSurfaceRotation(-info.halfWidth, 0, 0),
                    widthSecond: this._pointFromCenterWithSurfaceRotation(info.halfWidth, 0, 0),
                    lengthFirst: this._pointFromCenterWithSurfaceRotation(0, -info.halfLength, 0),
                    lengthSecond: this._pointFromCenterWithSurfaceRotation(0, info.halfLength, 0),
                    heightFirst: this._pointFromCenterWithSurfaceRotation(0, 0, -info.halfHeight),
                    heightSecond: this._pointFromCenterWithSurfaceRotation(0, 0, info.halfHeight)
                };
            } else if (rsk === 'scale')
            {
                handleCenterPts = {
                    widthFirst: this._pointFromCenterWithAll(-info.halfWidth, 0, 0),
                    widthSecond: this._pointFromCenterWithAll(info.halfWidth, 0, 0),
                    lengthFirst: this._pointFromCenterWithAll(0, -info.halfLength, 0),
                    lengthSecond: this._pointFromCenterWithAll(0, info.halfLength, 0),
                    heightFirst: this._pointFromCenterWithAll(0, 0, -info.halfHeight),
                    heightSecond: this._pointFromCenterWithAll(0, 0, info.halfHeight)
                };
            } else if (rsk === 'skew')
            {
                handleCenterPts = {
                    x: this._pointFromCenterWithAll(info.halfWidth, 0, info.halfHeight),
                    y: this._pointFromCenterWithAll(0, info.halfLength, info.halfHeight)
                }
            } else
            {
                throw new Error();
            }
            var result = {};
            Object.keys(handleCenterPts).forEach(function (k) {
                var pixelSize = that.wwd.drawContext.pixelSizeAtDistance(eyePoint.distanceTo(handleCenterPts[k]));
                var direction = new Vec3(0, 0, 0).copy(handleCenterPts[k]).subtract(centerPt).normalize();
                result[k] = new Vec3(0, 0, 0).copy(direction).multiply(pixelSize * RigidMeshEditTool.HANDLE_DISTANCE_PX).add(handleCenterPts[k]);
            });
            return result;
        }
    };

    RigidMeshEditTool.prototype._computeHandleScales = function (rsk, info) {
        info = info || this.renderables[0];
        var that = this;
        var o = this._rs[rsk];
        var pixelSizes = Object.keys(o.handles).reduce(function (result, k) {
            var handle = o.handles[k];
            var handleCenterPt = that.wwd.drawContext.surfacePointForMode(handle.center.latitude, handle.center.longitude, handle.center.altitude, handle.altitudeMode, new Vec3(0, 0, 0));
            result[k] = that.wwd.drawContext.pixelSizeAtDistance(that.wwd.drawContext.eyePoint.distanceTo(handleCenterPt));
            return result;
        }, {});
        if (rsk === 'rotate')
        {
            return {
                aroundX: {
                    halfWidth: pixelSizes.aroundX * RigidMeshEditTool.ROTATE_HANDLE_THICKNESS_PX,
                    halfLength: info.halfLength + pixelSizes.aroundX * (RigidMeshEditTool.HANDLE_DISTANCE_PX + RigidMeshEditTool.HANDLE_RADIUS_PX / 2),
                    halfHeight: info.halfHeight + pixelSizes.aroundX * (RigidMeshEditTool.HANDLE_DISTANCE_PX + RigidMeshEditTool.HANDLE_RADIUS_PX / 2)
                },
                aroundY: {
                    halfWidth: info.halfWidth + pixelSizes.aroundY * (RigidMeshEditTool.HANDLE_DISTANCE_PX + RigidMeshEditTool.HANDLE_RADIUS_PX / 2),
                    halfLength: pixelSizes.aroundY * RigidMeshEditTool.ROTATE_HANDLE_THICKNESS_PX,
                    halfHeight: info.halfHeight + pixelSizes.aroundY * (RigidMeshEditTool.HANDLE_DISTANCE_PX + RigidMeshEditTool.HANDLE_RADIUS_PX / 2)
                },
                aroundZ: {
                    halfWidth: info.halfWidth + pixelSizes.aroundZ * (RigidMeshEditTool.HANDLE_DISTANCE_PX + RigidMeshEditTool.HANDLE_RADIUS_PX / 2),
                    halfLength: info.halfLength + pixelSizes.aroundZ * (RigidMeshEditTool.HANDLE_DISTANCE_PX + RigidMeshEditTool.HANDLE_RADIUS_PX / 2),
                    halfHeight: pixelSizes.aroundZ * RigidMeshEditTool.ROTATE_HANDLE_THICKNESS_PX
                }
            };
        } else
        {
            return Object.keys(o.handles).reduce(function (result, k) {
                var pixelSize = pixelSizes[k];
                result[k] = {
                    halfWidth: pixelSize * RigidMeshEditTool.HANDLE_RADIUS_PX,
                    halfLength: pixelSize * RigidMeshEditTool.HANDLE_RADIUS_PX,
                    halfHeight: pixelSize * RigidMeshEditTool.HANDLE_RADIUS_PX
                };
                return result;
            }, {});
        }
    };

    RigidMeshEditTool.prototype._getConnectorHandleKeys = function (rsk, connectorKey) {
        if (rsk === 'move')
        {
            switch (connectorKey)
            {
                case 'width':
                    return ['widthFirst', 'widthSecond'];
                case 'length':
                    return ['lengthFirst', 'lengthSecond'];
                case 'height':
                    return ['heightFirst', 'heightSecond'];
            }
        } else if (rsk === 'scale')
        {
            switch (connectorKey)
            {
                case 'width':
                    return ['widthFirst', 'widthSecond'];
                case 'length':
                    return ['lengthFirst', 'lengthSecond'];
                case 'height':
                    return ['heightFirst', 'heightSecond'];
            }
        } else if (rsk === 'rotate')
        {
            switch (connectorKey)
            {
            }
        } else if (rsk === 'skew')
        {
            switch (connectorKey)
            {
                case 'centerToX':
                    return [null, 'x'];
                case 'centerToY':
                    return [null, 'y'];
            }
        }
        throw new Error();
    };

    Object.defineProperties(RigidMeshEditTool.prototype, {
        editingMode: {
            get: function () {
                return this._editingMode;
            },
            set: function (editingMode) {
                this._editingMode = editingMode;
                this._allHandles().concat(this._allConnectors()).forEach(function (renderable) {
                    renderable.enabled = false;
                });
                switch (this._editingMode)
                {
                    case EditingMode.NONE:
                        break;
                    case EditingMode.MOVE:
                        Object.values(this._rs.move.handles).concat(Object.values(this._rs.move.connectors)).forEach(function (renderable) {
                            renderable.enabled = true;
                        });
                        break;
                    case EditingMode.SCALE:
                        Object.values(this._rs.scale.handles).concat(Object.values(this._rs.scale.connectors)).forEach(function (renderable) {
                            renderable.enabled = true;
                        });
                        break;
                    case EditingMode.ROTATE:
                        Object.values(this._rs.rotate.handles).concat(Object.values(this._rs.rotate.connectors)).forEach(function (renderable) {
                            renderable.enabled = true;
                        });
                        break;
                    case EditingMode.SKEW:
                        Object.values(this._rs.skew.handles).concat(Object.values(this._rs.skew.connectors)).forEach(function (renderable) {
                            renderable.enabled = true;
                        });
                        break;
                    default:
                        throw new Error('Unrecognized editing mode \'' + this._editingMode + '\'');
                }
            }
        }
    });

    RigidMeshEditTool.prototype._beforeDrawFrame = function () {
        var that = this;
        var centerPt = this.pointFromPosition(this.renderables[0].center);
        // update handle positions
        Object.keys(this._rs).forEach(function (rsk) {
            var o = that._rs[rsk];
            var points = that._computeHandlePoints(rsk);
            Object.keys(o.handles).forEach(function (k) {
                o.handles[k].center = that.positionFromPoint(points[k]);
            });
        });
        // update handle scales
        Object.keys(this._rs).forEach(function (rsk) {
            var o = that._rs[rsk];
            var scales = that._computeHandleScales(rsk);
            Object.keys(o.handles).forEach(function (k) {
                var handle = o.handles[k];
                var scale = scales[k];
                handle.halfWidth = scale.halfWidth;
                handle.halfLength = scale.halfLength;
                handle.halfHeight = scale.halfHeight;
            });
        });
        // update handle connectors
        Object.keys(this._rs).forEach(function (rsk) {
            var o = that._rs[rsk];
            var points = that._computeHandlePoints(rsk);
            var scales = that._computeHandleScales(rsk);
            Object.keys(o.connectors).forEach(function (k) {
                var connector = o.connectors[k];
                var handleKeys = that._getConnectorHandleKeys(rsk, k);
                var pt1 = handleKeys[0] === null ? centerPt : points[handleKeys[0]];
                var pt2 = handleKeys[1] === null ? centerPt : points[handleKeys[1]];
                var direction = new Vec3(0, 0, 0).copy(pt2).subtract(pt1).normalize();
                connector.positions = [
                    handleKeys[0] === null ? that.renderables[0].center : that.positionFromPoint(new Vec3(0, 0, 0).copy(direction).multiply(scales[handleKeys[0]].halfHeight).add(points[handleKeys[0]])),
                    handleKeys[1] === null ? that.renderables[0].center : that.positionFromPoint(new Vec3(0, 0, 0).copy(direction).multiply(-scales[handleKeys[1]].halfHeight).add(points[handleKeys[1]]))
                ];
            });
        });
        // update rotate renderable rotations
        Object.keys(this._rs.rotate.handles).forEach(function (k) {
            var handle = that._rs.rotate.handles[k];
            handle.pitch = that.renderables[0].pitch;
            handle.roll = that.renderables[0].roll;
            handle.heading = that.renderables[0].heading;
        });
        // update altitude modes
        var altitudeMode = this.renderables[0].altitudeMode;
        this.editLayer.renderables.forEach(function (renderable) {
            renderable.altitudeMode = altitudeMode;
        });
    };

    RigidMeshEditTool.prototype._computeMoveVerticalPlane = function (clientX, clientY) {
        var right = ExtUtils.computeScreenRightDirection(this.wwd.drawContext, new Vec3(0, 0, 0));
        var pa = this.wwd.drawContext.surfacePointForMode(this.renderables[0].center.latitude, this.renderables[0].center.longitude, this.renderables[0].center.altitude, this.renderables[0].altitudeMode, new Vec3(0, 0, 0));
        var pb = new Vec3(0, 0, 0).copy(pa).add(right);
        var pc = this.wwd.drawContext.surfacePointForMode(this.renderables[0].center.latitude, this.renderables[0].center.longitude, this.renderables[0].center.altitude + 1, this.renderables[0].altitudeMode, new Vec3(0, 0, 0));
        return Plane.fromPoints(pa, pb, pc);
    };

    RigidMeshEditTool.prototype._computeScalePlane = function (clientX, clientY, scaleHandle) {
        var right = ExtUtils.computeScreenRightDirection(this.wwd.drawContext, new Vec3(0, 0, 0));
        var handles;
        if (scaleHandle === this._rs.scale.handles.heightFirst || scaleHandle === this._rs.scale.handles.heightSecond)
        {
            handles = [this._rs.scale.handles.heightFirst, this._rs.scale.handles.heightSecond];
        } else if (scaleHandle === this._rs.scale.handles.widthFirst || scaleHandle === this._rs.scale.handles.widthSecond)
        {
            handles = [this._rs.scale.handles.widthFirst, this._rs.scale.handles.widthSecond];
        } else if (scaleHandle === this._rs.scale.handles.lengthFirst || scaleHandle === this._rs.scale.handles.lengthSecond)
        {
            handles = [this._rs.scale.handles.lengthFirst, this._rs.scale.handles.lengthSecond];
        } else
        {
            throw new Error();
        }
        var pa = this.wwd.drawContext.surfacePointForMode(handles[0].center.latitude, handles[0].center.longitude, handles[0].center.altitude, handles[0].altitudeMode, new Vec3(0, 0, 0));
        var pb = this.wwd.drawContext.surfacePointForMode(handles[1].center.latitude, handles[1].center.longitude, handles[1].center.altitude, handles[1].altitudeMode, new Vec3(0, 0, 0));
        var pc = new Vec3(0, 0, 0).copy(pa).add(right);
        return Plane.fromPoints(pa, pb, pc);
    };

    RigidMeshEditTool.prototype._computeRotatePlane = function (clientX, clientY, rotateHandle, info) {
        info = info || this.renderables[0];
        var pa = this.pointFromPosition(info.center), pb, pc;
        if (rotateHandle === this._rs.rotate.handles.aroundX)
        {
            pb = this._pointFromCenterWithAll(0, 1, 0, info);
            pc = this._pointFromCenterWithAll(0, 0, 1, info);
        } else if (rotateHandle === this._rs.rotate.handles.aroundY)
        {
            pb = this._pointFromCenterWithAll(1, 0, 0, info);
            pc = this._pointFromCenterWithAll(0, 0, 1, info);
        } else if (rotateHandle === this._rs.rotate.handles.aroundZ)
        {
            pb = this._pointFromCenterWithAll(1, 0, 0, info);
            pc = this._pointFromCenterWithAll(0, 1, 0, info);
        } else
        {
            throw new Error();
        }
        return Plane.fromPoints(pa, pb, pc);
    };

    /**
     * Compute the axis of rotation for the handle absolutely (i.e. including surface rotation,
     * shape rotation, and skew)
     *
     * @param {RigidMesh} rotateHandle The handle to compute the axis of rotation for
     * @param {Object} [info] The shape information (defaults to this.renderables[0])
     */
    RigidMeshEditTool.prototype._computeAbsoluteRotateAxisDirection = function (rotateHandle, info) {
        info = info || this.renderables[0];
        var centerPt = this.pointFromPosition(info.center);
        if (rotateHandle === this._rs.rotate.handles.aroundX)
        {
            return this._pointFromCenterWithAll(1, 0, 0, info).subtract(centerPt).normalize();
        } else if (rotateHandle === this._rs.rotate.handles.aroundY)
        {
            return this._pointFromCenterWithAll(0, 1, 0, info).subtract(centerPt).normalize();
        } else if (rotateHandle === this._rs.rotate.handles.aroundZ)
        {
            return this._pointFromCenterWithAll(0, 0, 1, info).subtract(centerPt).normalize();
        } else
        {
            throw new Error();
        }
    };

    /**
     * Compute the axis of rotation for the handle relatively (i.e. without any transforms)
     *
     * @param {RigidMesh} rotateHandle The handle to compute the axis of rotation for
     */
    RigidMeshEditTool.prototype._computeRelativeRotateAxisDirection = function (rotateHandle) {
        if (rotateHandle === this._rs.rotate.handles.aroundX)
        {
            return new Vec3(1, 0, 0);
        } else if (rotateHandle === this._rs.rotate.handles.aroundY)
        {
            return new Vec3(0, 1, 0);
        } else if (rotateHandle === this._rs.rotate.handles.aroundZ)
        {
            return new Vec3(0, 0, 1);
        } else
        {
            throw new Error();
        }
    };

    RigidMeshEditTool.prototype._computeSkewPlane = function (clientX, clientY, skewHandle, info) {
        info = info || this.renderables[0];
        if (skewHandle === this._rs.skew.handles.x)
        {
            return this._computeScalePlane(clientX, clientY, this._rs.scale.handles.widthFirst, info);
        } else if (skewHandle === this._rs.skew.handles.y)
        {
            return this._computeScalePlane(clientX, clientY, this._rs.scale.handles.lengthFirst, info);
        } else
        {
            throw new Error();
        }
    };

    RigidMeshEditTool.prototype._computeSkewDirection = function (skewHandle, info) {
        info = info || this.renderables[0];
        var centerPt = this.pointFromPosition(this.renderables[0].center);
        if (skewHandle === this._rs.skew.handles.x)
        {
            return this._pointFromCenterWithAll(1, 0, 0, info).subtract(centerPt).normalize();
        } else if (skewHandle === this._rs.skew.handles.y)
        {
            return this._pointFromCenterWithAll(0, 1, 0, info).subtract(centerPt).normalize();
        } else
        {
            throw new Error();
        }
    };

    RigidMeshEditTool.prototype._dragged = function (renderable, recognizer, ended) {
        var that = this;
        var update = false;
        var centerPt = this.wwd.drawContext.surfacePointForMode(this.renderables[0].center.latitude, this.renderables[0].center.longitude, this.renderables[0].center.altitude, this.renderables[0].altitudeMode, new Vec3(0, 0, 0));
        var renderableAbsAltitude = ExtUtils.convertWorldWindPositionAltitudeMode(this.wwd, renderable.center, renderable.altitudeMode, WorldWind.ABSOLUTE).altitude;
        var ray = ExtUtils.rayFromScreenPoint(this.wwd.drawContext, this.wwd.drawContext.convertPointToViewport(this.wwd.canvasCoordinates(recognizer.clientX, recognizer.clientY), new Vec2(0, 0)), new Line(new Vec3(0, 0, 0), new Vec3(0, 0, 0)));
        if ((this._editingMode === EditingMode.MOVE || this._editingMode === EditingMode.SCALE) && this._dragBeginInfo.globeIntersectPt !== null && renderable === this.renderables[0])
        {
            var intersectPt = ExtUtils.nearestIntersectionPoint(ExtUtils.intersectGlobe(this.wwd, ray, renderableAbsAltitude), ray);
            if (intersectPt !== null)
            {
                switch (this._editingMode)
                {
                    case EditingMode.MOVE:
                    {
                        var dragBeginIntersectPos = this.positionFromPoint(this._dragBeginInfo.globeIntersectPt);
                        var intersectPos = this.positionFromPoint(intersectPt);
                        var nextCenter = new Position(0, 0, 0).copy(this._dragBeginInfo.center);
                        nextCenter.latitude += intersectPos.latitude - dragBeginIntersectPos.latitude;
                        nextCenter.longitude += intersectPos.longitude - dragBeginIntersectPos.longitude;
                        nextCenter.longitude = ExtUtils.fixLongitude(nextCenter.longitude)
                        if (ExtUtils.isValidCoordinates(nextCenter.latitude, nextCenter.longitude))
                        {
                            this.renderables[0].center = nextCenter;
                            update = true;
                        }
                    }
                        break;
                    case EditingMode.SCALE:
                    {
                        var lengthRatio = this._dragBeginInfo.halfLength / this._dragBeginInfo.halfWidth;
                        var heightRatio = this._dragBeginInfo.halfHeight / this._dragBeginInfo.halfWidth;
                        var beginCenterDist = this._dragBeginInfo.globeIntersectPt.distanceTo(centerPt);
                        var currCenterDist = intersectPt.distanceTo(centerPt);
                        var nextHalfWidth = Math.abs(this._dragBeginInfo.halfWidth + currCenterDist - beginCenterDist);
                        this.renderables[0].halfWidth = nextHalfWidth;
                        this.renderables[0].halfLength = nextHalfWidth * lengthRatio;
                        this.renderables[0].halfHeight = nextHalfWidth * heightRatio;
                        update = true;
                    }
                        break;
                    default:
                        throw new Error();
                }
            }
        } else if (Object.values(this._rs.move.handles).indexOf(renderable) !== -1)
        {
            if (renderable === this._rs.move.handles.heightFirst || renderable === this._rs.move.handles.heightSecond)
            {
                if (this._dragBeginInfo.verticalPlaneIntersectPt !== null)
                {
                    var pt = ExtUtils.intersectPlaneWithLine(this._computeMoveVerticalPlane(recognizer.clientX, recognizer.clientY, new Vec3(0, 0, 0)), ray, new Vec3(0, 0, 0));
                    if (pt !== null)
                    {
                        var dragStartPos = this.positionFromPoint(this._dragBeginInfo.verticalPlaneIntersectPt);
                        var pos = this.positionFromPoint(pt);
                        var nextCenter = new Position(0, 0, 0).copy(this.renderables[0].center);
                        nextCenter.altitude = this._dragBeginInfo.center.altitude + pos.altitude - dragStartPos.altitude;
                        this.renderables[0].center = nextCenter;
                        update = true;
                    }
                }
            } else if (this._dragBeginInfo.globeIntersectPt !== null)
            {
                var dragBeginIntersectPos = this.positionFromPoint(this._dragBeginInfo.globeIntersectPt);
                var intersectPt = ExtUtils.nearestIntersectionPoint(ExtUtils.intersectGlobe(this.wwd, ray, renderableAbsAltitude), ray);
                if (intersectPt !== null)
                {
                    var intersectPos = this.positionFromPoint(intersectPt);
                    var nextCenter = new Position(0, 0, 0).copy(this._dragBeginInfo.center);
                    if (renderable === this._rs.move.handles.widthFirst || renderable === this._rs.move.handles.widthSecond)
                    {
                        nextCenter.longitude += intersectPos.longitude - dragBeginIntersectPos.longitude;
                    } else if (renderable === this._rs.move.handles.lengthFirst || renderable === this._rs.move.handles.lengthSecond)
                    {
                        nextCenter.latitude += intersectPos.latitude - dragBeginIntersectPos.latitude;
                    } else
                    {
                        throw new Error();
                    }
                    nextCenter.longitude = ExtUtils.fixLongitude(nextCenter.longitude);
                    if (ExtUtils.isValidCoordinates(nextCenter.latitude, nextCenter.longitude))
                    {
                        this.renderables[0].center = nextCenter;
                        update = true;
                    }
                }
            }
        } else if (this._dragBeginInfo.scalePlaneIntersectPt !== null && Object.values(this._rs.scale.handles).indexOf(renderable) !== -1)
        {
            var plane = this._computeScalePlane(recognizer.clientX, recognizer.clientY, renderable);
            var intersectPt = ExtUtils.intersectPlaneWithLine(plane, ray, new Vec3(0, 0, 0));
            if (intersectPt !== null)
            {
                var startDist = this._dragBeginInfo.scalePlaneIntersectPt.distanceTo(centerPt);
                var currDist = intersectPt.distanceTo(centerPt);
                if (renderable === this._rs.scale.handles.widthFirst || renderable === this._rs.scale.handles.widthSecond)
                {
                    this.renderables[0].halfWidth = this._dragBeginInfo.halfWidth + currDist - startDist;
                } else if (renderable === this._rs.scale.handles.lengthFirst || renderable === this._rs.scale.handles.lengthSecond)
                {
                    this.renderables[0].halfLength = this._dragBeginInfo.halfLength + currDist - startDist;
                } else if (renderable === this._rs.scale.handles.heightFirst || renderable === this._rs.scale.handles.heightSecond)
                {
                    this.renderables[0].halfHeight = this._dragBeginInfo.halfHeight + currDist - startDist;
                } else
                {
                    throw new Error();
                }
            }
            update = true;
        } else if (this._dragBeginInfo.rotatePlaneIntersectPt !== null && Object.values(this._rs.rotate.handles).indexOf(renderable) !== -1)
        {
            var rotMat = Matrix.fromIdentity();
            var intersectPt = ExtUtils.intersectPlaneWithLine(this._dragBeginInfo.rotatePlane, ray, new Vec3(0, 0, 0));
            if (intersectPt !== null)
            {
                var absAxis = this._computeAbsoluteRotateAxisDirection(renderable, this._dragBeginInfo);
                var v1 = new Vec3(0, 0, 0).copy(this._dragBeginInfo.rotatePlaneIntersectPt).subtract(centerPt).normalize();
                var v2 = new Vec3(0, 0, 0).copy(intersectPt).subtract(centerPt).normalize();
                var up = new Vec3(0, 0, 0).copy(v1).multiplyByMatrix(Matrix.fromIdentity().multiplyByRotation(absAxis[0], absAxis[1], absAxis[2], 90));
                var sign = Math.sign(v2.dot(up));
                if (sign === 0)
                {
                    sign = 1;
                }
                var deltaTheta = Math.acos(v1.dot(v2)) * sign * Angle.RADIANS_TO_DEGREES;
                var matRot = Matrix.fromIdentity();
                matRot.multiplyByRotation(0, 1, 0, 360 - this._dragBeginInfo.roll);
                matRot.multiplyByRotation(1, 0, 0, 360 - this._dragBeginInfo.pitch);
                matRot.multiplyByRotation(0, 0, 1, 360 - this._dragBeginInfo.heading);
                var rotAxis = this._computeRelativeRotateAxisDirection(renderable).multiplyByMatrix(matRot);
                matRot = Matrix.fromIdentity().multiplyByRotation(rotAxis[0], rotAxis[1], rotAxis[2], deltaTheta).multiplyMatrix(matRot);
                var angles = ExtUtils.extractKMLRotationAngles(matRot, new Vec3(0, 0, 0));
                this.renderables[0].pitch = angles[0];
                this.renderables[0].roll = angles[1];
                this.renderables[0].heading = angles[2];
                update = true;
            }
        } else if (this._dragBeginInfo.skewPlaneIntersectPt !== null && Object.values(this._rs.skew.handles).indexOf(renderable) !== -1)
        {
            var plane = this._dragBeginInfo.skewPlane;
            var direction = this._dragBeginInfo.skewDirection;
            var intersectPt = ExtUtils.intersectPlaneWithLine(plane, ray, new Vec3(0, 0, 0));
            if (intersectPt !== null)
            {
                var P = new Vec3(0, 0, 0).copy(direction).multiply(direction.dot(this._dragBeginInfo.skewPlaneIntersectPt)).add(centerPt);
                var Pp = new Vec3(0, 0, 0).copy(direction).multiply(direction.dot(intersectPt)).add(centerPt);
                var dist = P.distanceTo(Pp);
                if (new Vec3(0, 0, 0).copy(Pp).subtract(P).dot(direction) < 0)
                {
                    dist *= -1;
                }
                var nextCenter = this.positionFromPoint(new Vec3(0, 0, 0).copy(direction).multiply(dist / 2).add(this.pointFromPosition(this._dragBeginInfo.center)));
                nextCenter.longitude = ExtUtils.fixLongitude(nextCenter.longitude);
                if (ExtUtils.isValidCoordinates(nextCenter.latitude, nextCenter.longitude))
                {
                    this.renderables[0].center = nextCenter;
                    if (renderable === this._rs.skew.handles.x)
                    {
                        this.renderables[0].skewX = Math.atan(dist / (2 * this.renderables[0].halfHeight) + Math.tan((this._dragBeginInfo.skewX - 90) * Angle.DEGREES_TO_RADIANS)) * Angle.RADIANS_TO_DEGREES + 90;
                    } else if (renderable === this._rs.skew.handles.y)
                    {
                        this.renderables[0].skewY = Math.atan(dist / (2 * this.renderables[0].halfHeight) + Math.tan((this._dragBeginInfo.skewY - 90) * Angle.DEGREES_TO_RADIANS)) * Angle.RADIANS_TO_DEGREES + 90;
                    } else
                    {
                        throw new Error();
                    }
                    update = true;
                }
            }
        }
        if (update)
        {
            this.emit('update', ended);
            this.wwd.redraw();
        }
    };

    RigidMeshEditTool.prototype._setCursorIsPointer = function (b) {
        this.wwd.canvas.style.cursor = b ? 'pointer' : 'default';
    };

    RigidMeshEditTool.prototype._renderableDragBegan = function (renderable, recognizer) {
        var ray = ExtUtils.rayFromScreenPoint(this.wwd.drawContext, this.wwd.drawContext.convertPointToViewport(this.wwd.canvasCoordinates(recognizer.clientX, recognizer.clientY), new Vec2(0, 0)), new Line(new Vec3(0, 0, 0), new Vec3(0, 0, 0)));
        this._dragBeginInfo = {
            center: new Position(0, 0, 0).copy(this.renderables[0].center),
            halfWidth: this.renderables[0].halfWidth,
            halfLength: this.renderables[0].halfLength,
            halfHeight: this.renderables[0].halfHeight,
            altitudeMode: this.renderables[0].altitudeMode,
            roll: this.renderables[0].roll,
            pitch: this.renderables[0].pitch,
            heading: this.renderables[0].heading,
            skewX: this.renderables[0].skewX,
            skewY: this.renderables[0].skewY
        };
        if (renderable === this.renderables[0]
            || renderable === this._rs.move.handles.widthFirst
            || renderable === this._rs.move.handles.widthSecond
            || renderable === this._rs.move.handles.lengthFirst
            || renderable === this._rs.move.handles.lengthSecond)
        {
            this._dragBeginInfo.globeIntersectPt = ExtUtils.nearestIntersectionPoint(ExtUtils.intersectGlobe(this.wwd, ray, ExtUtils.convertWorldWindPositionAltitudeMode(this.wwd, renderable.center, renderable.altitudeMode, WorldWind.ABSOLUTE).altitude), ray);
        } else if (renderable === this._rs.move.handles.heightFirst
            || renderable === this._rs.move.handles.heightSecond)
        {
            this._dragBeginInfo.verticalPlaneIntersectPt = ExtUtils.intersectPlaneWithLine(this._computeMoveVerticalPlane(recognizer.clientX, recognizer.clientY), ray, new Vec3(0, 0, 0));
        } else if (Object.values(this._rs.scale.handles).indexOf(renderable) !== -1)
        {
            this._dragBeginInfo.scalePlaneIntersectPt = ExtUtils.intersectPlaneWithLine(this._computeScalePlane(recognizer.clientX, recognizer.clientY, renderable), ray, new Vec3(0, 0, 0));
        } else if (Object.values(this._rs.rotate.handles).indexOf(renderable) !== -1)
        {
            var plane = this._computeRotatePlane(recognizer.clientX, recognizer.clientY, renderable);
            this._dragBeginInfo.rotatePlane = plane;
            this._dragBeginInfo.rotatePlaneIntersectPt = ExtUtils.intersectPlaneWithLine(plane, ray, new Vec3(0, 0, 0));
        } else if (Object.values(this._rs.skew.handles).indexOf(renderable) !== -1)
        {
            var plane = this._computeSkewPlane(recognizer.clientX, recognizer.clientY, renderable);
            var direction = this._computeSkewDirection(renderable);
            this._dragBeginInfo.skewPlane = plane;
            this._dragBeginInfo.skewDirection = direction;
            this._dragBeginInfo.skewPlaneIntersectPt = ExtUtils.intersectPlaneWithLine(plane, ray, new Vec3(0, 0, 0));
        }
    };

    RigidMeshEditTool.prototype._renderableDragChanged = function (renderable, recognizer) {
        this._dragged(renderable, recognizer, false);
    };

    RigidMeshEditTool.prototype._renderableDragEnded = function (renderable, recognizer) {
        this._dragged(renderable, recognizer, true);
        this._dragBeginInfo = null;
        if (!this._haveMouseOn)
        {
            this._setCursorIsPointer(false);
        }
        if (this._allHandles().indexOf(renderable) !== -1)
        {
            renderable.highlighted = false;
            this.wwd.redraw();
        }
    };

    RigidMeshEditTool.prototype._renderableMousedOn = function (renderable, recognizer) {
        var isHandle = this._allHandles().indexOf(renderable) !== -1;
        if (isHandle)
        {
            renderable.highlighted = true;
            this.wwd.redraw();
        }
        if (isHandle || renderable === this.renderables[0])
        {
            this._setCursorIsPointer(true);
            this._haveMouseOn = true;
            this.wwd.redraw();
        }
    };

    RigidMeshEditTool.prototype._renderableMousedOff = function (renderable, recognizer) {
        if (AbstractEditTool.getMousedDownObject(this.wwd) !== renderable
            && this.activeDragRenderable !== renderable
            && this.editLayer.renderables.indexOf(renderable) !== -1)
        {
            renderable.highlighted = false;
            this.wwd.redraw();
        }
        if (this._allHandles().indexOf(renderable) !== -1 || renderable === this.renderables[0])
        {
            if (this._dragBeginInfo === null)
            {
                this._setCursorIsPointer(false);
            }
            this._haveMouseOn = false;
        }
    };

    return RigidMeshEditTool;
});
