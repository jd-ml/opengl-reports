precision mediump float;

// global var declarations for red/green vec3
vec3 red;
vec3 green;

// A4: ADD CODE HERE
varying lowp vec4 colour_var;

void main()
{
    // A2 & A4: MODIFY BELOW
    gl_FragColor = colour_var;

    // original rendering
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);

    // blue rendering
    //gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);

    //red = vec3(1.0, 0.0, 0.0);
    //green = vec3(0.0, 1.0, 0.0);
    //gl_FragColor = vec4(red + green, 1.0);
}