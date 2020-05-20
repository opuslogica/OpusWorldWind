define([
    'WebWorldWind/WorldWind',
    'WebWorldWind/shapes/Placemark',
    'WebWorldWind/util/Color',
    'OpusWorldWind/programs/OutlineTextureProgram'
], function (WorldWind, Placemark, Color, OutlineTextureProgram) {
    /**
     * An extension over Placemark that adds extra functionality needed by the Raptor Web Client.
     */
    var WcPlacemark = function (position, eyeDistanceScaling, attributes) {
        Placemark.call(this, position, eyeDistanceScaling, attributes);
    };

    WcPlacemark.prototype = Object.create(Placemark.prototype);

    WcPlacemark.prototype.beginDrawing = function (dc) {
        var gl = dc.currentGlContext;
        dc.findAndBindProgram(OutlineTextureProgram);

        var program = dc.currentProgram;
        gl.bindBuffer(gl.ARRAY_BUFFER, dc.unitQuadBuffer());
        gl.vertexAttribPointer(program.vertexTexCoordLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program.vertexPointLocation);
        gl.enableVertexAttribArray(program.vertexTexCoordLocation);

        program.loadTextureUnit(gl, gl.TEXTURE0);
        program.loadModulateColor(gl, dc.pickingMode);
    };

    WcPlacemark.prototype.doDrawOrderedPlacemark = function (dc) {
        var gl = dc.currentGlContext,
            program = dc.currentProgram;
        if (!dc.pickingMode && this.activeAttributes && this.activeAttributes.drawOutline)
        {
            program.loadOutlineHorizontalThickness(gl, this.activeAttributes.outlineWidth / this.imageBounds.width);
            program.loadOutlineVerticalThickness(gl, this.activeAttributes.outlineWidth / this.imageBounds.height);
            program.loadOutlineColor(gl, this.activeAttributes.outlineColor);
        } else
        {
            program.loadOutlineHorizontalThickness(gl, 0);
            program.loadOutlineVerticalThickness(gl, 0);
            program.loadOutlineColor(gl, Color.TRANSPARENT);
        }
        Placemark.prototype.doDrawOrderedPlacemark.call(this, dc);
    };

    return WcPlacemark;
});
