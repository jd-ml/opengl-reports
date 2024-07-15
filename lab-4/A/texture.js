// ECS610U -- Miles Hansard 2020
'use strict';
var mesh, canvas, gl;
const vs_file = './texture-vert.glsl';
const fs_file = './texture-frag.glsl';

// A4 -- MODIFY THIS
// model parameters
// let model_name = 'spot'; // original
let model_name = 'banana-big'; // A4
let model_path = '../shared/models/';

let light = {
    position: [0.0, 5.0, 0.0, 1.0],
    ambient:  [1.0, 1.0, 1.0, 1.0],
    diffuse:  [1.0, 1.0, 1.0, 1.0],
    specular: [1.0, 1.0, 1.0, 1.0],
};

let material = {
    // banana
    ambient:  [0.5, 0.4, 0.2, 1.0],
    diffuse:  [0.5, 0.4, 0.2, 1.0],
    specular: [0, 0, 0, 1.0],
    shininess: 0.0001
};

// viewing parameters
let vert_fov_deg = 30.0;
let near = 1.0;
let far = 10.0;
let aspect = 1;
let theta = Math.PI + 0.75;
let projection, animate = false;

// A4 -- MODIFY THIS
// modelview parameters
// let scaling = 1.0; // original
let scaling = 10.0; // A4
let translation_x = 0.0;
let translation_y = 0.0;
let translation_z = 5.0;

// uniform locations
let vertex_loc, normal_loc, texcoord_loc, projection_loc, modelview_loc;

// controls
let keys = {};
let mouse_down = false;
let last_x = null;
let last_y = null;
let angle_x = 0.0;
let angle_y = 0.0;

function setup_texture(image) 
{
    let texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // texture t coordinate is the the opposite of image y coordinate
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // texture filtering
    gl.generateMipmap(gl.TEXTURE_2D);

    // A3 -- MODIFY THESE
    // interpolation method for shrinking and enlarging the texture, respectively:
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); // original
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); // original
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); // A3
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); // A3

}

async function setup(meshes)
{
    // set button to save the image
    capture_canvas_setup('gl-canvas', 'capture-button', 'capture.png');
    canvas = document.getElementById('gl-canvas');

    // --- general setup ---

    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl', { alpha:false });

    // clear canvas to prevent flicker when texture loads
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // load the shader source code into JS strings
    const vs_src = await fetch(vs_file).then(out => out.text());
    const fs_src = await fetch(fs_file).then(out => out.text());
    // make the shaders and link them together as a program
    let vs = webgl_make_shader(gl, vs_src, gl.VERTEX_SHADER);
    let fs = webgl_make_shader(gl, fs_src, gl.FRAGMENT_SHADER);
    let program = webgl_make_program(gl, vs, fs);
    gl.useProgram(program);

    mesh = meshes[model_name];
    OBJ.initMeshBuffers(gl,mesh);

    vertex_loc = gl.getAttribLocation(program, 'vertex');
    gl.enableVertexAttribArray(vertex_loc);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
    gl.vertexAttribPointer(vertex_loc, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

    normal_loc = gl.getAttribLocation(program, 'normal');
    gl.enableVertexAttribArray(normal_loc);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
    gl.vertexAttribPointer(normal_loc, 3, gl.FLOAT, false, 0, 0);

    texcoord_loc = gl.getAttribLocation(program, 'texcoord');
    gl.enableVertexAttribArray(texcoord_loc);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureBuffer);
    gl.vertexAttribPointer(texcoord_loc, mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);

    // --- lighting ---

    for(let property in light) {
        gl.uniform4fv(gl.getUniformLocation(program,'light.'+property), 
                      light[property]);
    }

    for(let property in material) {
        if(property != 'shininess')
            gl.uniform4fv(gl.getUniformLocation(program, 'material.'+property), 
                          material[property]);
    }

    // --- get uniform locations ---
 
    modelview_loc = gl.getUniformLocation(program, 'modelview');
    projection_loc = gl.getUniformLocation(program, 'projection');

    // --- rendering setup ---

    gl.viewport(0, 0, canvas.width, aspect*canvas.height);
    gl.clearColor(0.75, 0.75, 0.75, 1.0);
    gl.lineWidth(1.5);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // projection matrix from shared/graphics.js
    projection = mat_perspective(vert_fov_deg, aspect, near, far);

    // set shader texture to TEXTURE0
    gl.uniform1i(gl.getUniformLocation(program,'texture'), 0);

	document.onkeydown = handle_key_down;
	document.onkeyup = handle_key_up;
	canvas.onmousedown = handle_mouse_down;
	document.onmouseup = handle_mouse_up;
	document.onmousemove = handle_mouse_move;

    // load the texture, and then trigger render()
    var texture_img = new Image();
    texture_img.crossOrigin = 'anonymous';
    // A3 -- CHANGE THIS
    // set texture file
    // texture_img.src = model_path + model_name + '/texture.png'; // original
    // texture_img.src = '../shared/models/stripes/stripes-1024.png'; // A3
    texture_img.src = model_path + model_name + '/texture_edit.png'; // A4



    texture_img.onload = function() {
        // trigger setup as soon as the image loads
        setup_texture(texture_img);
        render();
    }
}

window.onload = function()
{
    // load the mesh and then trigger setup()
    let objs = {[model_name]: model_path+model_name+'/model.obj'};
    OBJ.downloadMeshes(objs, setup);
}

async function render() 
{
    check_keys();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let view = mat_hom(mat_prod(mat_rotation(angle_x,[1,0,0]),
                                mat_rotation(angle_y,[0,1,0])));

    theta += animate * 0.01;
    let model_scale = mat_scaling([scaling,scaling,scaling]);
    let model_rotate = mat_motion(theta, [0,1,0], [0,0,0]);
    let model_translate = mat_translation([translation_x, translation_y, -translation_z]);
 
    // view * model_translate * model_rotate * model_scale
    let modelview = mat_prod(view, mat_prod(model_translate, mat_prod(model_rotate, model_scale)));

    gl.uniformMatrix4fv(modelview_loc, false, mat_float_flat_transpose(modelview));
    gl.uniformMatrix4fv(projection_loc, false, mat_float_flat_transpose(projection));

    // --- render object ---

    gl.drawElements(gl.TRIANGLES, mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    capture_canvas_check();

    // ask browser to call render() again, after 1/60 second
    window.setTimeout(render, 1000/60);
}

function check_keys()
{
    let delta = 0.01;
    if(keys[37]) {
        if(keys[16])
            scaling -= delta; // shift-leftarrow
        else
            translation_x -= delta; // leftarrow
    } else if(keys[39]) {
        if(keys[16])
            scaling += delta; // shift-rightarrow
        else
            translation_x += delta; // rightarrow
    } else if(keys[38]) {
        if(keys[16])
            translation_z += delta; // shift-uparrow
        else
            translation_y += delta; // uparrow
    } else if(keys[40]) {
        if(keys[16])
            translation_z -= delta; // shift-downarrow
        else
            translation_y -= delta; // downarrow
    }
}

function handle_key_down(event)
{
    if(event.keyCode == 82) {
        // 'r' for rotate
        animate = !animate;
    }
    // log any other keys
	keys[event.keyCode] = true;
}

function handle_key_up(event)
{
	keys[event.keyCode] = false;
}

function handle_mouse_down(event)
{
	mouse_down = true;
	last_x = event.clientX;
	last_y = event.clientY;
}

function handle_mouse_up(event)
{
	mouse_down = false;
}

function handle_mouse_move(event)
{
	if(!mouse_down)
		return;
	let x = event.clientX;
	let y = event.clientY;
	angle_x -= (y - last_y) * 0.0005;
	angle_y -= (x - last_x) * 0.0005;
	last_x = x;
	last_y = y;
	event.preventDefault();
}
