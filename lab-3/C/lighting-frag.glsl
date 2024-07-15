// ECS610U -- Miles Hansard 2020

#define PI 3.1415926538
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

// function from lecture 6
float scene_depth(float frag_z)
{
    float ndc_z = 2.0*frag_z - 1.0;
    return (2.0*near*far) / (far + near - ndc_z*(far-near));
}

// C4
vec3 hsv_to_rgb(vec3 c) {
        vec4 k = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
        vec3 p = abs(fract(c.xxx + k.xyz) * 6.0 - k.www);
        return c.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), c.y);
    }

void main()
{

    // // C3
    // if(gl_FragCoord.z < 0.5) {
    //     // don't render close fragments
    //     discard;
    // }

    // renormalize interpolated normal
    vec3 n = normalize(m);

    // reflection vector
    vec3 r = -normalize(reflect(s,n));


    float hue = atan(n.y, n.x) / (2.0 * PI) + 0.5;
    float saturation = acos(n.z) / PI;
    float modified_saturation = pow(saturation, 0.5);

    vec3 hsv = vec3(hue, modified_saturation, 1.0);

    // phong shading components

    vec4 ambient = material.ambient * light.ambient;

    vec4 diffuse = material.diffuse * 
                   max(dot(s,n),0.0) * 
                   light.diffuse;

    // original specular term
    vec4 specular = material.specular * 
                    pow(max(dot(r,t),0.0), material.shininess) * 
                    light.specular;
                    
    // // C3-iii specular term
    // vec4 specular = material.specular * 
    //                 pow(max(dot(r,t),0.0), material.shininess) * 
    //                 light.specular;

    // // C3-iv specular term
    // vec4 specular = material.specular * 
    //                 pow(abs(dot(r,t)), material.shininess) * 
    //                 light.specular;

    // gl_FragColor = vec4((ambient + diffuse + specular).rgb, 1.0); // original
    // gl_FragColor = vec4((ambient + diffuse + specular).rgb, 1.0); // B1

    // scaled depth + linear transformation    
    // float scaled_depth = (far - scene_depth(gl_FragCoord.z)) / (far - near);
    // gl_FragColor = vec4(vec3(scaled_depth), 1.0); // C2

    // gl_FragColor = vec4(((ambient*0.0) + diffuse + specular).rgb, 1.0); // C3-i
    gl_FragColor = vec4(hsv_to_rgb(hsv), 1.0); // C4


}

