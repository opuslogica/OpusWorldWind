define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/layer/RenderableLayer',
    'WebWorldWind/gesture/ClickRecognizer',
    'WebWorldWind/gesture/DragRecognizer',
    'WebWorldWind/navigate/LookAtNavigator',
    'WebWorldWind/geom/Position',
    'WebWorldWind/geom/Vec3',
    'OpusWorldWind/misc/ExtUtils'
], function (OpusWorldWind, WorldWind, RenderableLayer, ClickRecognizer, DragRecognizer, LookAtNavigator, Position, Vec3, ExtUtils) {
    var AbstractEditTool = function (wwd, renderables) {
        if (!(renderables instanceof Array))
        {
            renderables = [renderables];
        }

        this._wwd = wwd;
        this._renderables = renderables;
        this._editLayer = new RenderableLayer();
        this._timeouts = {};
        this._listeners = {};
        this._activeDragRenderable = null;
        this._mousedOnRenderables = [];
        wwd.addLayer(this._editLayer);

        AbstractEditTool._initWorldWindow(this._wwd);
        wwd.editToolAux.allEditTools.push(this);
    };

    AbstractEditTool.prototype.setTimeout = function (cb, time) {
        var timeoutID = setTimeout(cb, time);
        this._timeouts[timeoutID] = timeoutID;
        return timeoutID;
    };

    AbstractEditTool.prototype.clearTimeout = function (timeoutID) {
        clearTimeout(timeoutID);
        delete this._listeners[timeoutID];
    };

    AbstractEditTool.getMousedDownObject = function (wwd) {
        if (!wwd.editToolAux || wwd.editToolAux.mousedownObject === null)
        {
            // no edit tools
            return null;
        } else
        {
            return wwd.editToolAux.mousedownObject.userObject;
        }
    };

    AbstractEditTool._initWorldWindow = function (wwd) {
        if (!wwd.editToolAux)
        {
            wwd.editToolAux = {};
            wwd.editToolAux.customGestureHandlers = [];
            wwd.editToolAux.allEditTools = [];
            wwd.editToolAux.clickRecognizer = new ClickRecognizer(wwd, function (recognizer) {
                if (recognizer.state === WorldWind.RECOGNIZED)
                {
                    var topPickedObject = wwd.pick(wwd.canvasCoordinates(recognizer.clientX, recognizer.clientY)).topPickedObject();
                    if (topPickedObject !== null)
                    {
                        for (var i = 0; i !== wwd.editToolAux.allEditTools.length; ++i)
                        {
                            var editTool = wwd.editToolAux.allEditTools[i];
                            var renderables = editTool.allRenderables();
                            if (renderables.indexOf(topPickedObject.userObject) !== -1)
                            {
                                editTool.emit('renderableClicked', topPickedObject.userObject, recognizer);
                            }
                        }
                    }
                }
            });
            var overrideDragRecognizers = []; // drag recognizers that the edit tool drag recognizer take should take priority over
            wwd.editToolAux.mousedownObject = null;
            wwd.editToolAux.dragRecognizer = new DragRecognizer(wwd, function (recognizer) {
                if (wwd.editToolAux.mousedownObject === null)
                {
                    return;
                }
                var topPickedObject = wwd.editToolAux.mousedownObject;
                var customHandler = null;
                for (var i = 0; i !== wwd.editToolAux.customGestureHandlers.length; ++i)
                {
                    var handler = wwd.editToolAux.customGestureHandlers[i];
                    if (handler.shouldHandle(topPickedObject, {
                        clientX: recognizer.clientX,
                        clientY: recognizer.clientY
                    }))
                    {
                        customHandler = handler;
                        break;
                    }
                }
                switch (recognizer.state)
                {
                    case WorldWind.BEGAN:
                        // end any existing drags
                        for (var i = 0; i !== wwd.editToolAux.allEditTools.length; ++i)
                        {
                            var editTool = wwd.editToolAux.allEditTools[i];
                            if (editTool._activeDragRenderable !== null)
                            {
                                editTool.renderableDragEnded(editTool._activeDragRenderable, recognizer);
                                editTool._activeDragRenderable = null;
                            }
                        }
                        if (customHandler !== null)
                        {
                            customHandler.dragBegan(topPickedObject, {
                                clientX: recognizer.clientX,
                                clientY: recognizer.clientY
                            });
                        } else
                        {
                            // start dragging exactly one renderable 
                            for (var i = 0; i !== wwd.editToolAux.allEditTools.length; ++i)
                            {
                                var editTool = wwd.editToolAux.allEditTools[i];
                                var renderables = editTool.allRenderables();
                                if (renderables.indexOf(topPickedObject.userObject) !== -1)
                                {
                                    editTool._activeDragRenderable = topPickedObject.userObject;
                                    editTool.emit('renderableDragBegan', editTool._activeDragRenderable, recognizer);
                                    break;
                                }
                            }
                        }
                        break;
                    case WorldWind.CHANGED:
                        if (customHandler !== null)
                        {
                            customHandler.dragChanged(topPickedObject, {
                                clientX: recognizer.clientX,
                                clientY: recognizer.clientY
                            });
                        } else
                        {
                            // continue any existing drags
                            for (var i = 0; i !== wwd.editToolAux.allEditTools.length; ++i)
                            {
                                var editTool = wwd.editToolAux.allEditTools[i];
                                if (editTool._activeDragRenderable !== null)
                                {
                                    editTool.emit('renderableDragChanged', editTool._activeDragRenderable, recognizer);
                                }
                            }
                        }
                        break;
                    case WorldWind.ENDED:
                        if (customHandler !== null)
                        {
                            customHandler.dragEnded(topPickedObject, {
                                clientX: recognizer.clientX,
                                clientY: recognizer.clientY
                            });
                        } else
                        {
                            // end any existing drags
                            for (var i = 0; i !== wwd.editToolAux.allEditTools.length; ++i)
                            {
                                var editTool = wwd.editToolAux.allEditTools[i];
                                if (editTool._activeDragRenderable !== null)
                                {
                                    editTool.emit('renderableDragEnded', editTool._activeDragRenderable, recognizer);
                                    editTool._activeDragRenderable = null;
                                }
                            }
                        }
                        break;
                }
            });
            if (wwd.navigator instanceof LookAtNavigator)
            {
                overrideDragRecognizers.push(wwd.worldWindowController.primaryDragRecognizer);
            }
            wwd.editToolAux.mousedownListener = function (event) {
                // Let drag recognizers first consume the mousedown event so we can cancel them
                setTimeout(function () {
                    var topPickedObject = wwd.pick(wwd.canvasCoordinates(event.clientX, event.clientY)).topPickedObject();
                    if (topPickedObject !== null)
                    {
                        var shouldOverride = false;

                        for (var i = 0; i !== wwd.editToolAux.customGestureHandlers.length; ++i)
                        {
                            var handler = wwd.editToolAux.customGestureHandlers[i];
                            if (handler.shouldHandle(topPickedObject, {
                                clientX: event.clientX,
                                clientY: event.clientY
                            }))
                            {
                                shouldOverride = true;
                                break;
                            }
                        }

                        if (!shouldOverride)
                        {
                            for (var i = 0; i !== wwd.editToolAux.allEditTools.length; ++i)
                            {
                                var editTool = wwd.editToolAux.allEditTools[i];
                                var renderables = editTool.allRenderables();
                                if (renderables.indexOf(topPickedObject.userObject) !== -1)
                                {
                                    shouldOverride = true;
                                    break;
                                }
                            }
                        }

                        if (shouldOverride)
                        {
                            overrideDragRecognizers.forEach(function (recognizer) {
                                if (recognizer.state === WorldWind.POSSIBLE)
                                {
                                    recognizer.transitionToState(WorldWind.FAILED);
                                }
                            });
                            wwd.editToolAux.mousedownObject = topPickedObject;
                        }
                    }
                }, 0);
            };
            wwd.editToolAux.mouseupListener = function (event) {
                // allow drag recognizers to handle this first
                setTimeout(function () {
                    wwd.editToolAux.mousedownObject = null;
                }, 0);
            };
            wwd.editToolAux.mousemoveListener = function (event) {
                // trigger mouse-on for all previously moused-off renderables, and trigger mouse-off for all previously moused-on renderables
                var pickedObjects = wwd.pick(wwd.canvasCoordinates(event.clientX, event.clientY)).objects.map(function (pickedObject) {
                    return pickedObject.userObject;
                });
                for (var i = 0; i !== wwd.editToolAux.allEditTools.length; ++i)
                {
                    var mousedOnQueue = []; // queue up moused-on events until after all moused-off events have been fired
                    var editTool = wwd.editToolAux.allEditTools[i];
                    var renderables = editTool.allRenderables();
                    for (var j = 0; j !== renderables.length; ++j)
                    {
                        var renderable = renderables[j];
                        if (pickedObjects.indexOf(renderable) !== -1)
                        {
                            if (editTool._mousedOnRenderables.indexOf(renderable) === -1)
                            {
                                mousedOnQueue.push(renderable);
                                editTool._mousedOnRenderables.push(renderable);
                            }
                        } else
                        {
                            var index = editTool._mousedOnRenderables.indexOf(renderable);
                            if (index !== -1)
                            {
                                editTool.emit('renderableMousedOff', renderable, event);
                                editTool._mousedOnRenderables.splice(index, 1);
                            }
                        }
                    }
                    mousedOnQueue.forEach(function (renderable) {
                        editTool.emit('renderableMousedOn', renderable, event);
                    });
                }
            };
            wwd.editToolAux.keydownListener = function (event) {
                for (var i = 0; i !== wwd.editToolAux.allEditTools.length; ++i)
                {
                    var editTool = wwd.editToolAux.allEditTools[i];
                    editTool.emit('keydown', event);
                }
            };
            wwd.editToolAux.keyupListener = function (event) {
                for (var i = 0; i !== wwd.editToolAux.allEditTools.length; ++i)
                {
                    var editTool = wwd.editToolAux.allEditTools[i];
                    editTool.emit('keyup', event);
                }
            };

            ExtUtils.beforeDrawFrame(wwd, function () {
                for (var i = 0; i !== wwd.editToolAux.allEditTools.length; ++i)
                {
                    var editTool = wwd.editToolAux.allEditTools[i];
                    editTool.emit('beforeDrawFrame');
                }
            });
        }

        // add event listeners; they will have been removed by destroy()
        wwd.addEventListener('mousedown', wwd.editToolAux.mousedownListener);
        wwd.addEventListener('mouseup', wwd.editToolAux.mouseupListener);
        wwd.addEventListener('mousemove', wwd.editToolAux.mousemoveListener);
        document.addEventListener('keydown', wwd.editToolAux.keydownListener);
        document.addEventListener('keyup', wwd.editToolAux.keyupListener);
    };

    AbstractEditTool.addCustomGestureHandler = function (wwd, handler) {
        AbstractEditTool._initWorldWindow(wwd);
        wwd.editToolAux.customGestureHandlers.push(handler);
    };

    AbstractEditTool.removeCustomGestureHandler = function (wwd, handler) {
        AbstractEditTool._initWorldWindow(wwd);
        var index = wwd.editToolAux.customGestureHandlers.indexOf(handler);
        if (index >= 0)
        {
            wwd.editToolAux.customGestureHandlers.splice(index, 1);
        }
    };

    Object.defineProperties(AbstractEditTool.prototype, {
        wwd: {
            get: function () {
                return this._wwd;
            }
        },
        renderables: {
            get: function () {
                return this._renderables;
            }
        },
        editLayer: {
            get: function () {
                return this._editLayer;
            }
        },
        activeDragRenderable: {
            get: function () {
                return this._activeDragRenderable;
            }
        }
    });

    AbstractEditTool.prototype.allRenderables = function () {
        return this._renderables.concat(this._editLayer.renderables);
    };

    /**
     * Called by client code after an update is performed to any one
     * of the edit tool's renderables.
     */
    AbstractEditTool.prototype.update = function () {
        for (var i = 0; i !== this.renderables.length; ++i)
        {
            this.emit('renderableUpdated', this.renderables[i]);
        }
    };

    AbstractEditTool.prototype.addEventListener = function (event, listener) {
        var eventListeners = this._listeners[event];
        if (eventListeners === undefined)
        {
            eventListeners = this._listeners[event] = [];
        }
        eventListeners.push(listener);
    };

    AbstractEditTool.prototype.removeEventListener = function (event, listener) {
        var eventListeners = this._listeners[event];
        if (eventListeners !== undefined)
        {
            var index = eventListeners.indexOf(listener);
            if (index !== -1)
            {
                eventListeners.splice(index, 1);
                if (eventListeners.length === 0)
                {
                    delete this._listeners[index];
                }
            }
        }
    };

    AbstractEditTool.prototype.emit = function (event) {
        var that = this;
        var eventListeners = this._listeners[event];
        if (eventListeners !== undefined)
        {
            var args = Array.prototype.slice.call(arguments, 1);
            eventListeners.forEach(function (listener) {
                listener.apply(that, args);
            });
        }
    };

    AbstractEditTool.prototype.addEditRenderable = function (renderable) {
        this._editLayer.addRenderable(renderable);
    };

    AbstractEditTool.prototype.removeEditRenderable = function (renderable) {
        this._editLayer.removeRenderable(renderable);
    };

    AbstractEditTool.prototype.destroy = function () {
        var editToolIndex = this._wwd.editToolAux.allEditTools.indexOf(this);
        if (editToolIndex === -1)
        {
            throw new Error('This edit tool is already destroyed');
        }
        this.wwd.editToolAux.allEditTools.splice(editToolIndex, 1);
        this._wwd.removeLayer(this._editLayer);
        Object.keys(this._timeouts).forEach(this.clearTimeout.bind(this));

        this.wwd.removeEventListener('mousedown', this.wwd.editToolAux.mousedownListener);
        this.wwd.removeEventListener('mouseup', this.wwd.editToolAux.mouseupListener);
        this.wwd.removeEventListener('mousemove', this.wwd.editToolAux.mousemoveListener);
        document.removeEventListener('keydown', this.wwd.editToolAux.keydownListener);
        document.removeEventListener('keyup', this.wwd.editToolAux.keyupListener);
    };

    // Utility functions

    /**
     * Computes the position from the point. The resulting position's altitude
     * is converted to the altitude mode for this edit tool (i.e. the altitude mode
     * of this.renderables[0]).
     */
    AbstractEditTool.prototype.positionFromPoint = function (pt) {
        var pos = this.wwd.globe.computePositionFromPoint(pt[0], pt[1], pt[2], new Position(0, 0, 0));
        return ExtUtils.convertWorldWindPositionAltitudeMode(this.wwd, pos, WorldWind.ABSOLUTE, this.renderables[0].altitudeMode);
    };

    AbstractEditTool.prototype.pointFromPosition = function (pos) {
        return this.wwd.drawContext.surfacePointForMode(pos.latitude, pos.longitude, pos.altitude, this.renderables[0].altitudeMode, new Vec3(0, 0, 0));
    };

    return AbstractEditTool;
});
