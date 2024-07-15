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
    vec4 specular = material.specular * 
                    pow(max(dot(r,t),0.0), material.shininess) * 
                    light.specular;

    // gl_FragColor = vec4((ambient + diffuse + specular).rgb, 1.0); // B1

    gl_FragColor = material.ambient + material.diffuse;




    if (dot(source,n) > 0.9) {
        gl_FragColor += material.specular;
    } else if (dot(source,n) > 0.75) {
        gl_FragColor += 0.2 * material.specular;
    }

    if (dot(target, n) < 0.4) {
        gl_FragColor.rgb = (0.2 * material.diffuse.rgb);
    }



}

