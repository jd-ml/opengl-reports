// GLSL VERTEX SHADER

uniform mat4 modelview, projection;

// C1: DECLARE ROTATION AND TRANSLATION HERE

uniform float alpha;
uniform bool use_colour;

attribute vec4 vertex;
attribute vec4 colour;

varying vec4 colour_var;

void main()
{
    // C1: DEFINE INVERSE TRANSLATION MATRIX HERE

    // convert to homogeneous coordinates
    vec4 point = vec4(vertex.x, vertex.y, vertex.z, 1.0);

    // C1: USE ROTATION AND TRANSLATION MATRICES HERE

    // transform and then project -- note that division is performed later
    gl_Position = projection * modelview * point;

    if(use_colour) {
        // from attribute array
        colour_var = colour;
    }
    else {
        // monchrome controlled by uniform rgba
        colour_var = vec4(0.5, 0.5, 0.5, alpha);
    }
}

