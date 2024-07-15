// ECS610U -- Miles Hansard

precision highp float;

uniform mat4 modelview, modelview_inv, projection, view_inv;

uniform struct {
    vec4 position, ambient, diffuse, specular;  
} light;

uniform bool render_skybox, render_texture;
uniform samplerCube cubemap;
uniform sampler2D texture;

varying vec2 map;
varying vec3 d, m;
varying vec4 p, q;

void main()
{ 
    vec3 n = normalize(m);

    if(render_skybox) {
        gl_FragColor = textureCube(cubemap,vec3(-d.x,d.y,d.z));
    }
    else {

        // object colour
        vec4 material_colour = texture2D(texture,map);

        // sources and target directions 
        vec3 s = normalize(q.xyz - p.xyz);
        vec3 t = normalize(-p.xyz);

        // reflection vector in world coordinates
        vec3 r = (view_inv * vec4(reflect(-t,n),0.0)).xyz;

        // reflected background colour
        vec4 reflection_colour = textureCube(cubemap,vec3(-r.x,r.y,r.z));

        // blinn-phong lighting

        vec4 ambient = material_colour * light.ambient;
        vec4 diffuse = material_colour * max(dot(s,n),0.0) * light.diffuse;

        // halfway vector
        vec3 h = normalize(s + t);
        vec4 specular = pow(max(dot(h,n), 0.0), 4.0) * light.specular;       

        // combined colour
        if(render_texture) {
            // B2 -- MODIFY
            gl_FragColor = vec4((0.5 * ambient + 
                                 0.5 * diffuse + 
                                 0.01 * specular + 
                                //  0.0 * reflection_colour).rgb, 1.0); // original
                                 0.1 * reflection_colour).rgb, 1.0); // B2

        }
        else {
            // reflection only 
            gl_FragColor = reflection_colour;
        }

    }
}

