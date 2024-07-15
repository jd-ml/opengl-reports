// ECS610U -- Miles Hansard 2020

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

// normal, source and taget -- interpolated across all triangles
varying vec3 m, s, t;

void main()
{   
    // renormalize interpolated normal
    vec3 n = normalize(m);

    // reflection vector
    vec3 r = -normalize(reflect(s,n));

    // phong shading components

    vec4 ambient = material.ambient * 
                   light.ambient;

    vec4 diffuse = material.diffuse * 
                   max(dot(s,n),0.0) * 
                   light.diffuse;

    // B1 -- IMPLEMENT SPECULAR TERM

    // B3 -- IMPLEMENT BLINN SPECULAR TERM

    gl_FragColor = vec4((ambient + diffuse).rgb, 1.0);
}

