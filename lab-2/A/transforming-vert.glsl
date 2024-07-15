// GLSL VERTEX SHADER

// 4x4 matrices
uniform mat4 pre_scale, pre_rotate, rotate, shear, projective, projective_inv;

uniform vec3 rgb;

// A2 -- DECLARE UNIFORM TRANSLATION MATRIX HERE
uniform mat4 translate;

// xy coordinates are attributes -- different for each vertex
attribute vec4 vertex;

// colour for fragment shader
varying vec4 colour;

void main()
{
    // homogeneous cordinates [x,y,z,w]
    vec4 point =  vec4(vertex.x, vertex.y, 0.0, 1.0);

    // A3 -- DEFINE translate_inv HERE
    mat4 translate_inv = translate;

    // A1 -- ADD CODE HERE
    point = pre_rotate * pre_scale * point;

    // A1, A2, A3, A4, A5 -- MODIFY HERE
    // gl_Position = point; // Original
    // gl_Position = rotate * point; // A1
    // gl_Position = translate  * rotate * point; // A2
    // gl_Position = translate * rotate * translate_inv * point; // A3
    // gl_Position = shear * point; // A4
    // gl_Position = projective * point; // A5
    gl_Position = projective_inv * projective * point;

    // pass uniform colour to fragment shader varying
    // A5 -- MODIFY HERE
    // colour = vec4(rgb, 1.0);
    colour = vec4(gl_Position.w, 0.0, 0.0, 1.0);
}
