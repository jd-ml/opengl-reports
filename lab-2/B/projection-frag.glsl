// GLSL FRAGMENT SHADER

precision mediump float;

varying vec4 colour_var;

void main()
{
    gl_FragColor = colour_var;
}

