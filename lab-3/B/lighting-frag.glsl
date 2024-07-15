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

// normal, source and target -- interpolated across all triangles
varying vec3 m, s, t;

void main()
{   
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

    // B1 -- IMPLEMENT SPECULAR TERM
    // vec4 specular = material.specular * 
    //                 pow(max(dot(r,t),0.0), material.shininess) * 
    //                 light.specular;

    // B3i -- IMPLEMENT BLINN SPECULAR TERM
    // vec4 specular = material.specular * 
    //                 pow(max(dot(halfway, n), 0.0), material.shininess) * 
    //                 light.specular;

    // B3ii -- IMPLEMENT BLINN SPECULAR TERM with added alpha multiplication
        vec4 specular = material.specular * 
                        pow(max(dot(halfway, n), 0.0), material.shininess*4.0) * 
                        light.specular;


    // gl_FragColor = vec4((ambient + diffuse + specular).rgb, 1.0);
    gl_FragColor = vec4((ambient + diffuse + specular).rgb, 1.0); // B1

}

