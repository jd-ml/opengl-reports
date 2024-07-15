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

// gamma transformation function
vec4 gamma_transform(vec4 colour, float gamma) {
    return vec4(pow(colour.rgb, vec3(gamma)), colour.a);
}

// vignette function
float vignette(vec4 frag_coord) {
    float ret_num;
    // float radius = 1200.0/2.0; // Original vignette
    float radius = 1600.0/2.0; // D3

    float centre_x = 850.0/2.0;
    float centre_y = 850.0/2.0;

    float x = gl_FragCoord.x - centre_x;
    float y = gl_FragCoord.y - centre_y;

    ret_num = 1.0 - sqrt(pow(x,2.0) + pow(y,2.0)) / radius;

    if(ret_num < 0.2){
        return 0.2;
    } else {
        return ret_num;
    }
    
}

void main()
{ 

    vec3 n = normalize(m);

    if(render_skybox) {
        gl_FragColor = textureCube(cubemap,vec3(-d.x,d.y,d.z)); // original

        // debugging statement (white fragment)
        // gl_FragColor = vec4(1.0); // C4

        // scaling final fragment rbg by vignette value
        gl_FragColor.rgb *= vignette(gl_FragCoord); // C4
    }
    else {

        // object colour
        vec4 material_colour = texture2D(texture,map); // original

        // D3 texture gamma modification
        material_colour = gamma_transform(material_colour, 3.0);

        // C3 declaration
        // vec4 material_colour;

        // C3 gamma transformations
        // if(gl_FragCoord.x > 850.0/2.0) {
        //     material_colour = gamma_transform(texture2D(texture,map), 2.0); // C3
        // } else {
        //     material_colour = texture2D(texture,map);
        // }
        
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

        // C1 variables
        vec4 original = vec4((0.5 * ambient + 0.5 * diffuse + 0.01 * specular + 0.1 * reflection_colour).rgb, 1.0);
        vec3 inverted = vec3(1.0) - original.rgb;

        // combined colour
        if(render_texture) {

            // ----------------------------------------------------------------------------- //
            // Original and B2
            // ----------------------------------------------------------------------------- //

            // gl_FragColor = vec4((0.5 * ambient + 
            //                      0.5 * diffuse + 
            //                      0.01 * specular + 
            //                     //  0.0 * reflection_colour).rgb, 1.0); // original
            //                      0.1 * reflection_colour).rgb, 1.0); // B2

            // ----------------------------------------------------------------------------- //
            // C1
            // ----------------------------------------------------------------------------- //

            // gl_FragColor = vec4(inverted, 1.0); // C1
            
            // ----------------------------------------------------------------------------- //
            // C2
            // ----------------------------------------------------------------------------- //

            // gl_FragColor = vec4(vec3(original), 0.0 + length(vec3(original.rgb))); // C2
        
            // ----------------------------------------------------------------------------- //
            // D3
            // ----------------------------------------------------------------------------- //

            gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0); // Set lines to grey

        }
        else {
            // reflection only 
            // gl_FragColor = reflection_colour; // original
            gl_FragColor = gamma_transform(reflection_colour, 1.2); // D2
            
        }

        if(!gl_FrontFacing) {
            // fragment faces away from camera
            discard;
        }


    }
}

