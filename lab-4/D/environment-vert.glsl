// ECS610U -- Miles Hansard

uniform mat4 modelview, view_inv, projection;

uniform struct  {
    vec4 position, ambient, diffuse, specular;
} light;

attribute vec2 texcoord;
attribute vec3 vertex, normal;

varying vec2 map;
varying vec3 d, m;
varying vec4 p, q;

void main()
{
    // vertex, normal, and light position in camera coordinates
    p = modelview * vec4(vertex,1.0);
    m = normalize((modelview * vec4(normal,0.0)).xyz);
    q = light.position;

    // vertex in clip coordinates
    gl_Position = projection * p;

    // un-normalized direction to world vertex
    d = vertex;

    // texture coordinates
    map = texcoord;
}

