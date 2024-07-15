// ECS610U -- Miles Hansard 2020

// rotation/translation and camera matrix
uniform mat4 modelview, projection;

// light position and colour -- only need position here, but the 
// whole struct declaration must EXACTLY match that in the FS
uniform struct  {
    mediump vec4 position, ambient, diffuse, specular;
} light;

// incoming attributes
attribute vec3 vertex, normal;

// normal, source and target directions for the FS
varying vec3 m, s, t;

void main()
{
    // transform point to camera coordinates
    vec4 p = modelview * vec4(vertex,1.0);

    // transform normal to camera coordinates
    m = normalize(modelview * vec4(normal,0.0)).xyz;

    // light (already in camera coordinates) relative to vertex position
    s = normalize(light.position.xyz - p.xyz);

    // camera [0,0,0] relative to vertex position
    t = normalize(-p.xyz);

    // project point as usual
    gl_Position = projection * p;
}

