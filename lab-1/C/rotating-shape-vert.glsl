
attribute vec4 vertex;
attribute vec4 colour;
varying lowp vec4 colour_var;

void main()
{
    // 2D coordinates
    gl_Position.x = vertex.x;
    gl_Position.y = vertex.y;

    // zero depth for 2D drawing 
    gl_Position.z = 0.0;
    gl_Position.w = 1.0;

    // pass vertex colour to varying
    colour_var = colour;
}

