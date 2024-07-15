// ECS610U -- Miles Hansard 2020

// rotation/translation and camera matrix
uniform mat4 modelview, projection;

// incoming attributes
attribute vec3 vertex, normal;

precision mediump float;

// light data
uniform struct {
    vec4 position, ambient, diffuse, specular;  
} light;

// material data
uniform struct {
    vec4 ambient, diffuse, specular;
    float shininess;
} material;

// clipping plane depths
uniform float near, far;

// normal, source and target -- interpolated across all triangles
varying vec3 m, s, t;
varying vec4 colour;

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

    // renormalize interpolated normal
    vec3 n = normalize(m);
    vec3 source = normalize(s); // B3
    vec3 target = normalize(t); // B3

    // reflection vector
    vec3 r = -normalize(reflect(s,n));

    // halfway vector
    vec3 halfway = normalize(source+target); // B3

    // phong shading components

    vec4 ambient = material.ambient * light.ambient;

    vec4 diffuse = material.diffuse * 
                   max(dot(s,n),0.0) * 
                   light.diffuse;

    // B3ii -- IMPLEMENT BLINN SPECULAR TERM with added alpha multiplication
    vec4 specular = material.specular * 
                    pow(max(dot(halfway, n), 0.0), material.shininess*4.0) * 
                    light.specular;


    // project point as usual
    gl_Position = projection * p;
    
    // gl_FragColor = vec4((ambient + diffuse + specular).rgb, 1.0);
    colour = vec4((ambient + diffuse + specular).rgb, 1.0); // B1

}

