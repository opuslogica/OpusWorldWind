define([
    'OpusWorldWind/OpusWorldWind',
    'WebWorldWind/WorldWind',
    'WebWorldWind/shaders/GpuProgram'
], function (OpusWorldWind, WorldWind, GpuProgram) {
    var OutlineTextureProgram = function (gl) {
        var vertexShaderSource =
            'attribute vec4 vertexPoint;\n' +
            'attribute vec4 vertexTexCoord;\n' +
            'attribute vec4 normalVector;\n' +
            'uniform mat4 mvpMatrix;\n' +
            'uniform mat4 mvInverseMatrix;\n' +
            'uniform mat4 texCoordMatrix;\n' +
            'uniform bool applyLighting;\n' +
            'varying vec2 texCoord;\n' +
            'varying vec4 normal;\n' +
            'void main() {gl_Position = mvpMatrix * vertexPoint;\n' +
            'texCoord = (texCoordMatrix * vertexTexCoord).st;\n' +
            'if (applyLighting) {normal = mvInverseMatrix * normalVector;}\n' +
            '}',
            fragmentShaderSource =
                'precision mediump float;\n' +
                'uniform float opacity;\n' +
                'uniform vec4 color;\n' +
                'uniform float outlineHorizontalThickness;\n' +
                'uniform float outlineVerticalThickness;\n' +
                'uniform vec4 outlineColor;\n' +
                'uniform bool enableTexture;\n' +
                'uniform bool modulateColor;\n' +
                'uniform sampler2D textureSampler;\n' +
                'uniform bool applyLighting;\n' +
                'varying vec2 texCoord;\n' +
                'varying vec4 normal;\n' +
                'bool olTest(float x, float y) {\n' +
                '	return x >= 1.0 || y >= 1.0 || x < 0.0 || y < 0.0 || texture2D(textureSampler, vec2(x, y)).a == 0.0;\n' +
                '}\n' +
                'void main() {\n' +
                'vec4 textureColor = texture2D(textureSampler, texCoord);\n' +
                'float ambient = 0.15; vec4 lightDirection = vec4(0, 0, 1, 0);\n' +
                'if (enableTexture && !modulateColor)\n' +
                '    gl_FragColor = textureColor * color * opacity;\n' +
                'else if (enableTexture && modulateColor)\n' +
                '    gl_FragColor = color * floor(textureColor.a + 0.5);\n' +
                'else\n' +
                '    gl_FragColor = color * opacity;\n' +
                'if (gl_FragColor.a == 0.0) { discard; }\n' +
                'else {\n' +
                '	if (olTest(texCoord.x - outlineHorizontalThickness, texCoord.y - outlineVerticalThickness) || olTest(texCoord.x + outlineHorizontalThickness, texCoord.y - outlineVerticalThickness) || olTest(texCoord.x - outlineHorizontalThickness, texCoord.y + outlineVerticalThickness) || olTest(texCoord.x + outlineHorizontalThickness, texCoord.y + outlineVerticalThickness) || olTest(texCoord.x, texCoord.y - outlineVerticalThickness) || olTest(texCoord.x, texCoord.y + outlineVerticalThickness) || olTest(texCoord.x - outlineHorizontalThickness, texCoord.y) || olTest(texCoord.x + outlineHorizontalThickness, texCoord.y)) {\n' +
                '		gl_FragColor = outlineColor * opacity;\n' +
                '	}\n' +
                '	if (applyLighting) {\n' +
                '		vec4 n = normal * (gl_FrontFacing ? 1.0 : -1.0);\n' +
                '		gl_FragColor.rgb *= clamp(ambient + dot(lightDirection, n), 0.0, 1.0);\n' +
                '	}\n' +
                '}\n' +
                '}';

        var bindings = ["vertexPoint", "normalVector", "vertexTexCoord"];

        GpuProgram.call(this, gl, vertexShaderSource, fragmentShaderSource, bindings);

        this.vertexPointLocation = this.attributeLocation(gl, "vertexPoint");
        this.normalVectorLocation = this.attributeLocation(gl, "normalVector");
        this.vertexTexCoordLocation = this.attributeLocation(gl, "vertexTexCoord");
        this.mvpMatrixLocation = this.uniformLocation(gl, "mvpMatrix");
        this.mvInverseMatrixLocation = this.uniformLocation(gl, "mvInverseMatrix");
        this.colorLocation = this.uniformLocation(gl, "color");
        this.outlineHorizontalThicknessLocation = this.uniformLocation(gl, 'outlineHorizontalThickness');
        this.outlineVerticalThicknessLocation = this.uniformLocation(gl, 'outlineVerticalThickness');
        this.outlineColorLocation = this.uniformLocation(gl, 'outlineColor');
        this.textureEnabledLocation = this.uniformLocation(gl, "enableTexture");
        this.modulateColorLocation = this.uniformLocation(gl, "modulateColor");
        this.textureUnitLocation = this.uniformLocation(gl, "textureSampler");
        this.textureMatrixLocation = this.uniformLocation(gl, "texCoordMatrix");
        this.opacityLocation = this.uniformLocation(gl, "opacity");
        this.applyLightingLocation = this.uniformLocation(gl, "applyLighting");
    };

    OutlineTextureProgram.key = 'WorldWindGpuOutlineTextureProgram';

    OutlineTextureProgram.prototype = Object.create(GpuProgram.prototype);

    OutlineTextureProgram.prototype.loadModelviewInverse = function (gl, matrix) {
        this.loadUniformMatrix(gl, matrix, this.mvInverseMatrixLocation);
    };

    OutlineTextureProgram.prototype.loadModelviewProjection = function (gl, matrix) {
        this.loadUniformMatrix(gl, matrix, this.mvpMatrixLocation);
    };

    OutlineTextureProgram.prototype.loadColor = function (gl, color) {
        this.loadUniformColor(gl, color, this.colorLocation);
    };

    OutlineTextureProgram.prototype.loadTextureEnabled = function (gl, enable) {
        gl.uniform1i(this.textureEnabledLocation, enable ? 1 : 0);
    };

    OutlineTextureProgram.prototype.loadModulateColor = function (gl, enable) {
        gl.uniform1i(this.modulateColorLocation, enable ? 1 : 0);
    };

    OutlineTextureProgram.prototype.loadTextureUnit = function (gl, unit) {
        gl.uniform1i(this.textureUnitLocation, unit - gl.TEXTURE0);
    };

    OutlineTextureProgram.prototype.loadTextureMatrix = function (gl, matrix) {
        this.loadUniformMatrix(gl, matrix, this.textureMatrixLocation);
    };

    OutlineTextureProgram.prototype.loadOpacity = function (gl, opacity) {
        gl.uniform1f(this.opacityLocation, opacity);
    };

    OutlineTextureProgram.prototype.loadApplyLighting = function (gl, applyLighting) {
        gl.uniform1i(this.applyLightingLocation, applyLighting);
    };

    OutlineTextureProgram.prototype.loadOutlineHorizontalThickness = function (gl, outlineHorizontalThickness) {
        gl.uniform1f(this.outlineHorizontalThicknessLocation, outlineHorizontalThickness);
    };

    OutlineTextureProgram.prototype.loadOutlineVerticalThickness = function (gl, outlineVerticalThickness) {
        gl.uniform1f(this.outlineVerticalThicknessLocation, outlineVerticalThickness);
    };

    OutlineTextureProgram.prototype.loadOutlineColor = function (gl, outlineColor) {
        this.loadUniformColor(gl, outlineColor, this.outlineColorLocation);
    };

    return OutlineTextureProgram;
});
