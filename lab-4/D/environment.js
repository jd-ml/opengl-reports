// ECS610U -- Miles Hansard 2021
'use strict';
var cube_buf, mesh, canvas, gl, program;
const vs_file = './environment-vert.glsl';
const fs_file = './environment-frag.glsl';

// model parameters
let model_name = 'spot';
let model_path = '../shared/models/';

let light = {
    position: [-10.0, 10.0, 10.0, 1.0],
    ambient:  [1.0, 1.0, 1.0, 1.0],
    diffuse:  [1.0, 1.0, 1.0, 1.0],
    specular: [1.0, 1.0, 1.0, 1.0],
};

// viewing parameters
// pan_offset=pi shows'front.png' face of cubemap in -Z direction
let pan_offset = Math.PI; 
let tilt_offset = 0.0;
let vert_fov_deg = 80.0;
let near = 0.1;
let far = 50.0;
let aspect = 1;
let theta = Math.PI;
let scaling = 1.0;
let translation_x = 0.0;
let translation_y = 0.0;
let translation_z = 4.0;
let projection, animate = false;
let render_texture = true;
let triangles = true;

// uniform locations
let vertex_loc, normal_loc, texcoord_loc, projection_loc, modelview_loc, view_inv_loc;

// controls
let keys = {};
let mouse_down = false;
let last_x = null;
let last_y = null;
let angle_x = 0.0;
let angle_y = 0.0;

let cube_vertices = 
   [[-1, -1, -1],
    [-1,  1, -1],
    [ 1, -1, -1],
    [ 1,  1, -1],
    [-1, -1,  1],
    [-1,  1,  1],
    [ 1, -1,  1],
    [ 1,  1,  1]];

// indices of two triangles per face
let cube_indices =
  [ 0, 1, 2,
    0, 2, 4,
    0, 4, 1,
    1, 3, 2,
    1, 4, 5,
    1, 5, 3,
    2, 3, 6,
    2, 6, 4,
    3, 5, 7,
    3, 7, 6,
    4, 6, 5,
    5, 6, 7 ];

async function setup_texture(image) 
{
    let texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

async function setup_cubemap(images)
{
    let cubemap = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let directions = ['POSITIVE_','NEGATIVE_'], axes = ['X','Y','Z'], k = 0;

    axes.forEach(axis => { 
        directions.forEach(dirn => { 
            gl.texImage2D(eval('gl.TEXTURE_CUBE_MAP_'+dirn+axis), 0, gl.RGBA,
                          gl.RGBA, gl.UNSIGNED_BYTE, images[k++]);
        })
    });
}

// intialization --- called once per page load

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
    program = webgl_make_program(gl, vs, fs);
    gl.useProgram(program);

    mesh = meshes[model_name];
    OBJ.initMeshBuffers(gl,mesh);

    vertex_loc = gl.getAttribLocation(program, 'vertex');
    gl.enableVertexAttribArray(vertex_loc);

    normal_loc = gl.getAttribLocation(program, 'normal');
    gl.enableVertexAttribArray(normal_loc);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
    gl.vertexAttribPointer(normal_loc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normal_loc);

    texcoord_loc = gl.getAttribLocation( program, 'texcoord');
    gl.enableVertexAttribArray(texcoord_loc);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureBuffer);
    gl.vertexAttribPointer(texcoord_loc, mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texcoord_loc);

    // --- lighting ---

    for(let property in light) {
        gl.uniform4fv(gl.getUniformLocation(program,'light.'+property), 
                      light[property]);
    }

    // setup skybox
    let cube = vec_scale(10, cube_indices.map(i => cube_vertices[i]).flat());
    cube_buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cube_buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube), gl.STATIC_DRAW);

    // --- get uniform locations ---
 
    modelview_loc = gl.getUniformLocation(program, 'modelview');
    view_inv_loc = gl.getUniformLocation(program, 'view_inv');
    projection_loc = gl.getUniformLocation(program, 'projection');

    // --- rendering setup ---

    gl.viewport(0, 0, canvas.width, aspect*canvas.height);
    gl.clearColor(0.75, 0.75, 0.75, 1.0);
    gl.lineWidth(1.5);
    gl.depthFunc(gl.LESS);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // projection matrix from common/MV.js
    projection = mat_perspective(vert_fov_deg, aspect, near, far);

    document.onkeydown = handle_key_down;
	document.onkeyup = handle_key_up;
	canvas.onmousedown = handle_mouse_down;
	document.onmouseup = handle_mouse_up;
	document.onmousemove = handle_mouse_move;

    let cubemap_imgs = [];
    for(let k = 0; k < 6; k++) {
        cubemap_imgs.push(document.getElementById('cubemap_img'+k));
        let cube_img = new Image();
        cube_img.crossOrigin = 'anonymous';
        console.log('loaded ' + cube_img.src + cubemap_imgs[k].width + ' x ' + cubemap_imgs[k].height + ' img');
    }
    setup_cubemap(cubemap_imgs);

    gl.uniform1i(gl.getUniformLocation(program,'cubemap'), 0);
    gl.uniform1i(gl.getUniformLocation(program,'texture'), 1);
    gl.uniform1i(gl.getUniformLocation(program,'render_texture'), render_texture);
    gl.uniform1i(gl.getUniformLocation(program,'triangle_mode'), triangles);

    // load the texture, and then trigger render()
    let texture_img = new Image();
    texture_img.crossOrigin = 'anonymous';
    texture_img.src = model_path + model_name + '/texture.png';
    texture_img.onload = function() {
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

function render_skybox()
{
    gl.uniform1i(gl.getUniformLocation(program,'render_skybox'), true);
    gl.bindBuffer(gl.ARRAY_BUFFER, cube_buf);
    gl.vertexAttribPointer(vertex_loc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertex_loc);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function render_object()
{
    gl.uniform1i(gl.getUniformLocation(program,'render_skybox'), false);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
    gl.vertexAttribPointer(vertex_loc, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);

    // D2 MODIFY HERE
    gl.drawElements(gl.LINES, mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

async function render() 
{
    check_keys();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // --- render skybox ---

    // mouse pan-transformation and inverse
    // the 180 deg offset presents the 'front' cubmap view
    let view = mat_hom(mat_prod(mat_rotation(angle_x+tilt_offset, [1,0,0]),
                                mat_rotation(angle_y+pan_offset, [0,1,0])));

    let view_inv = mat_hom(mat_prod(mat_rotation(-angle_y-pan_offset,[0,1,0]),
                                    mat_rotation(-angle_x-tilt_offset,[1,0,0])));                            

    gl.uniformMatrix4fv(projection_loc, false, mat_float_flat_transpose(projection));
    gl.uniformMatrix4fv(modelview_loc, false, mat_float_flat_transpose(view));
    gl.uniformMatrix4fv(view_inv_loc, false, mat_float_flat_transpose(view_inv));

    gl.enable(gl.DEPTH_TEST); // original
    // gl.disable(gl.DEPTH_TEST); // B1
    // B1 -- UNCOMMENT THIS
    render_skybox();

    // --- render object ---

    view = mat_hom(mat_prod(mat_rotation(angle_x,[1,0,0]),
                            mat_rotation(angle_y,[0,1,0])));
    theta += animate * 0.01;

    let model_scale = mat_scaling([scaling,scaling,scaling]);
    let model_rotate = mat_motion(theta, [0,1,0], [0,0,0]);
    let model_translate = mat_translation([translation_x, translation_y, -translation_z]);
 
    // view * model_translate * model_rotate * model_scale
    let modelview = mat_prod(view, mat_prod(model_translate, mat_prod(model_rotate, model_scale)));

    gl.uniformMatrix4fv(modelview_loc, false, mat_float_flat_transpose(modelview));

    gl.enable(gl.DEPTH_TEST);
    render_object();

    // --- don't change this ---
    capture_canvas_check();

    // ask browser to call render() again, after 1/60 second
    window.setTimeout(render, 1000/60);
}

function check_keys()
{
    let delta = 0.005;
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
    if(event.keyCode == 82) // r for rotate
        animate = !animate;

    if(event.keyCode == 84) { // t for texture
        render_texture = !render_texture;
        gl.uniform1i(gl.getUniformLocation(program,'render_texture'), render_texture);
    }

    if(event.keyCode == 76) { // l for lines
        
        if(triangles == triangles) {
            triangles = !triangles;
            gl.drawElements(gl.LINES, mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        } else {
            triangles = !triangles
            gl.drawElements(gl.TRIANGLES, mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        }
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
	angle_x -= (y - last_y) * 0.002;
	angle_y -= (x - last_x) * 0.002;
	angle_x = Math.max(Math.min(angle_x, Math.PI / 2), -Math.PI / 2);
	last_x = x;
	last_y = y;
	event.preventDefault();
}

