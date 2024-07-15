
uniform float theta;
attribute vec4 vertex;

// A4: ADD CODE HERE
attribute vec4 colour;
varying lowp vec4 colour_var;

void main()
{
    float s = sin(theta);
    float c = cos(theta);

    // 2D rotation
    gl_Position.x = c * vertex.x - s * vertex.y;
    gl_Position.y = s * vertex.x + c * vertex.y;

    // A3: ADD CODE HERE
    // gl_Position.x *= (1.0 + s) / 2.0;
    // gl_Position.y *= (1.0 + s) / 2.0;

    // zero depth for 2D drawing 
    gl_Position.z = 0.0;
    gl_Position.w = 1.0;

    // A4: ADD CODE HERE
    colour_var = colour;

}

