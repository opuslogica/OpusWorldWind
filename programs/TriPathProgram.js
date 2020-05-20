define([
    'WebWorldWind/WorldWind',
    'WebWorldWind/shaders/GpuProgram'
], function (WorldWind, GpuProgram) {
    // Derived from BasicTextureProgram
    var TriPathProgram = function (gl) {
        var vertexShaderSource =
            'attribute vec4 vertexPoint;\n' +
            'attribute vec4 vertexTexCoord;\n' +
            'attribute vec4 normalVector;\n' +
            'attribute vec4 offsDir;\n' +
            'uniform float pixelSizeOffset;\n' +
            'uniform float pixelSizeScale;\n' +
            'uniform float lineWidth;\n' +
            'uniform vec4 eyePoint;\n' +
            'uniform vec4 referencePoint;\n' +
            'uniform mat4 mvpMatrix;\n' +
            'uniform mat4 mvInverseMatrix;\n' +
            'uniform mat4 texCoordMatrix;\n' +
            'uniform bool applyLighting;\n' +
            'varying vec2 texCoord;\n' +
            'varying vec4 normal;\n' +
            'void main() {' +
            'float distance = length(vertexPoint + referencePoint - eyePoint);\n' +
            'float pixelSize = pixelSizeScale * distance + pixelSizeOffset;\n' +
            'vec4 offsPoint = vec4(vertexPoint.xyz + pixelSize*lineWidth/2.0*offsDir.xyz, 1);\n' +
            'gl_Position = mvpMatrix * offsPoint;\n' +
            'texCoord = (texCoordMatrix * vertexTexCoord).st;\n' +
            'if (applyLighting) {normal = mvInverseMatrix * normalVector;}\n' +
            '}',
            fragmentShaderSource =
                'precision mediump float;\n' +
                'uniform float opacity;\n' +
                'uniform vec4 color;\n' +
                'uniform bool enableTexture;\n' +
                'uniform bool modulateColor;\n' +
                'uniform sampler2D textureSampler;\n' +
                'uniform bool applyLighting;\n' +
                'varying vec2 texCoord;\n' +
                'varying vec4 normal;\n' +
                'void main() {\n' +
                'vec4 textureColor = texture2D(textureSampler, texCoord);\n' +
                'float ambient = 0.15; vec4 lightDirection = vec4(0, 0, 1, 0);\n' +
                'if (enableTexture && !modulateColor)\n' +
                '    gl_FragColor = textureColor * color * opacity;\n' +
                'else if (enableTexture && modulateColor)\n' +
                '    gl_FragColor = color * floor(textureColor.a + 0.5);\n' +
                'else\n' +
                '    gl_FragColor = color * opacity;\n' +
                'if (gl_FragColor.a == 0.0) {discard;}\n' +
                'if (applyLighting) {\n' +
                '    vec4 n = normal * (gl_FrontFacing ? 1.0 : -1.0);\n' +
                '    gl_FragColor.rgb *= clamp(ambient + dot(lightDirection, n), 0.0, 1.0);\n' +
                '}\n' +
                '}';

        GpuProgram.call(this, gl, vertexShaderSource, fragmentShaderSource, ['vertexPoint', 'vertexTexCoord', 'normalVector', 'offsDir']);

        this.vertexPointLocation = this.attributeLocation(gl, "vertexPoint");
        this.vertexTexCoordLocation = this.attributeLocation(gl, "vertexTexCoord");
        this.normalVectorLocation = this.attributeLocation(gl, "normalVector");
        this.offsDirLocation = this.attributeLocation(gl, "offsDir");
        this.pixelSizeOffsetLocation = this.uniformLocation(gl, "pixelSizeOffset");
        this.pixelSizeScaleLocation = this.uniformLocation(gl, "pixelSizeScale");
        this.lineWidthLocation = this.uniformLocation(gl, "lineWidth");
        this.eyePointLocation = this.uniformLocation(gl, "eyePoint");
        this.referencePointLocation = this.uniformLocation(gl, "referencePoint");
        this.mvpMatrixLocation = this.uniformLocation(gl, "mvpMatrix");
        this.mvInverseMatrixLocation = this.uniformLocation(gl, "mvInverseMatrix");
        this.colorLocation = this.uniformLocation(gl, "color");
        this.textureEnabledLocation = this.uniformLocation(gl, "enableTexture");
        this.modulateColorLocation = this.uniformLocation(gl, "modulateColor");
        this.textureUnitLocation = this.uniformLocation(gl, "textureSampler");
        this.textureMatrixLocation = this.uniformLocation(gl, "texCoordMatrix");
        this.opacityLocation = this.uniformLocation(gl, "opacity");
        this.applyLightingLocation = this.uniformLocation(gl, "applyLighting");
    };

    TriPathProgram.key = "TriPathGpuBasicProgram";

    TriPathProgram.prototype = Object.create(GpuProgram.prototype);

    TriPathProgram.prototype.loadPixelSizeOffset = function (gl, pixelSizeOffset) {
        gl.uniform1f(this.pixelSizeOffsetLocation, pixelSizeOffset);
    };

    TriPathProgram.prototype.loadPixelSizeScale = function (gl, pixelSizeScale) {
        gl.uniform1f(this.pixelSizeScaleLocation, pixelSizeScale);
    };

    TriPathProgram.prototype.loadLineWidth = function (gl, lineWidth) {
        gl.uniform1f(this.lineWidthLocation, lineWidth);
    };

    TriPathProgram.prototype.loadEyePoint = function (gl, eyePoint) {
        gl.uniform4f(this.eyePointLocation, eyePoint[0], eyePoint[1], eyePoint[2], 0);
    };

    TriPathProgram.prototype.loadReferencePoint = function (gl, referencePoint) {
        gl.uniform4f(this.referencePointLocation, referencePoint[0], referencePoint[1], referencePoint[2], 0);
    };

    TriPathProgram.prototype.loadModelviewInverse = function (gl, matrix) {
        this.loadUniformMatrix(gl, matrix, this.mvInverseMatrixLocation);
    };

    TriPathProgram.prototype.loadModelviewProjection = function (gl, matrix) {
        this.loadUniformMatrix(gl, matrix, this.mvpMatrixLocation);
    };

    TriPathProgram.prototype.loadColor = function (gl, color) {
        this.loadUniformColor(gl, color, this.colorLocation);
    };

    TriPathProgram.prototype.loadTextureEnabled = function (gl, enable) {
        gl.uniform1i(this.textureEnabledLocation, enable ? 1 : 0);
    };

    TriPathProgram.prototype.loadModulateColor = function (gl, enable) {
        gl.uniform1i(this.modulateColorLocation, enable ? 1 : 0);
    };

    TriPathProgram.prototype.loadTextureUnit = function (gl, unit) {
        gl.uniform1i(this.textureUnitLocation, unit - gl.TEXTURE0);
    };

    TriPathProgram.prototype.loadTextureMatrix = function (gl, matrix) {
        this.loadUniformMatrix(gl, matrix, this.textureMatrixLocation);
    };

    TriPathProgram.prototype.loadOpacity = function (gl, opacity) {
        gl.uniform1f(this.opacityLocation, opacity);
    };

    TriPathProgram.prototype.loadApplyLighting = function (gl, applyLighting) {
        gl.uniform1i(this.applyLightingLocation, applyLighting);
    };

    return TriPathProgram;
});
