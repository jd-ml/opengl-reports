// ECS610U -- Miles Hansard

precision mediump float;

uniform mat4 projection;

uniform struct {
    vec4 position, ambient, diffuse, specular;  
} light;

// material data
uniform struct {
    vec4 ambient, diffuse, specular;
    float shininess;
} material;

uniform sampler2D texture;

// interpolated attributes
varying vec2 map;
varying vec3 m;
varying vec4 p, q;

void main()
{ 
    // A1 -- CHANGE THIS
    // uniform grey
    // vec4 material_colour = vec4(vec3(0.9),1.0); // Original
    vec4 material_colour = texture2D(texture,map);

    // source and target directions 
    vec3 s = normalize(q.xyz - p.xyz);
    vec3 t = normalize(-p.xyz);
    vec3 n = normalize(m);

    // blinn-phong lighting
    vec4 ambient = material_colour * light.ambient;
    vec4 diffuse = material_colour * max(dot(s,n),0.0) * light.diffuse;

    // halfway vector
    vec3 h = normalize(s + t);
    vec4 specular = pow(max(dot(h,n), 0.0), 4.0) * light.specular;       

    // A1-A2 -- CHANGE THIS
    // combined colour
    gl_FragColor = vec4((0.5*ambient + diffuse + 0.01*specular).rgb, 1.0); // Original
    // gl_FragColor = texture2D(texture,map); // A1
    // gl_FragColor = vec4(map.s, map.t, 0.0, 1.0); // A2
    
}
