// ECS610U -- Miles Hansard 2020

'use strict';
// type sizes in bytes
const FLOAT_size = 4;
const UNSIGNED_SHORT_size = 2;

// set this to console.log for verbose debugging
var console_log = function() {};

// B4 MODIFY SCENE PARAMETERS
var num_triangles = 30;
var tri_radius = 50;
var max_depth = 100;

// B5 MODIFY CAMERA PARAMETERS
let vert_fov = Math.PI/2;
let near = 50;
let far = 100;
let aspect = 1;

// these heights follow from the above
let near_top = near * Math.tan(vert_fov/2);
let far_top = far * Math.tan(vert_fov/2);

var theta = 0.0;
var theta_step = 0.05;

// canvases and contexts
var canvas, gl, cnv, ctx;
const vs_file = './projection-vert.glsl';
const fs_file = './projection-frag.glsl';

// buffers and attributes
var vertices, projection, modelview, rotation, translation;

// uniform locations
var vertex_loc, colour_loc, projection_loc, modelview_loc, rotation_loc, translation_loc;

// C1: DECLARE translation_inv and translation_inv_loc here
var translation_inv, translation_inv_loc;

// control flags
var use_colour_loc, alpha_loc;

// gl buffers
// this program pushes everything into a single attribute array
var attrib_buf, attribs = [];
var index_buf, indices = [];

// rendering control
var render_triangles, 
    render_near_plane, render_far_plane, render_side_planes, 
    render_near_edges, render_far_edges, render_side_edges;

// intialization --- called once per page load
window.onload = async function()
{
    // --- general setup ---

    // set button to save the image
    capture_canvas_setup('gl-canvas', 'capture-button', 'capture.png');

    // 2D canvas
    cnv = document.getElementById('canvas');
    ctx = cnv.getContext('2d');

    // 3D canvas
    canvas = document.getElementById('gl-canvas');
    gl = canvas.getContext('webgl', { alpha:false });

    // prepare the window
    gl.viewport(0, 0, canvas.width, aspect*canvas.height);
    gl.clearColor(0.9, 0.9, 0.9, 1.0);

    // load the shader source code into JS strings
    const vs_src = await fetch(vs_file).then(out => out.text());
    const fs_src = await fetch(fs_file).then(out => out.text());
    // make the shaders and link them together as a program
    let vs = webgl_make_shader(gl, vs_src, gl.VERTEX_SHADER);
    let fs = webgl_make_shader(gl, fs_src, gl.FRAGMENT_SHADER);
    let program = webgl_make_program(gl, vs, fs);
    gl.useProgram(program);

    console_log('--- INITIALIZATION ---');

    // --- geometry and colour ---

    // num_triangles primitives each with:
    // vertices in the range [0, +/-tri_radius]
    // constant random colour

    // triangles 
    for(let i = 0; i < num_triangles; i++) {

        // overall centre of triangle
        let xyz = [random(-max_depth/2,max_depth/2), 
                   random(-max_depth/2,max_depth/2), 
                   random(-max_depth,0)];

        // overall colour of triangle
        let rgba = [random(0,1), random(0,1), random(0,1), 1.0];

        // vertex of triangle
        for(let j = 0; j < 3; j++) {

            // xyz coordinate of vertex
            for(let k = 0; k < 3; k++)
                attribs.push(xyz[k] + random(-tri_radius, tri_radius));

            // rgba colour channel of vertex
            for(let k = 0; k < 4; k++)
                attribs.push(rgba[k]);
        }
    }

    // --- define clipping planes: vertices anticlockwise from bottom left ---

    // opacity of planes
    let alpha = 0.25;
    
    // near corners, looking from camera:
    //
    // 3---2
    // |   |
    // 0---1

    attribs.push(-near_top*aspect, -near_top, -near);
    attribs.push(0, 1, 0, alpha);

    attribs.push(near_top*aspect, -near_top, -near);
    attribs.push(0, 1, 0, alpha);

    attribs.push(near_top*aspect, near_top, -near);
    attribs.push(0, 1, 0, alpha);

    attribs.push(-near_top*aspect, near_top, -near);
    attribs.push(0, 1, 0, alpha);

    // far corners, looking from camera:
    //
    // 7---6
    // |   |
    // 4---5

    attribs.push(-far_top*aspect, -far_top, -far);
    attribs.push(1, 0, 0, alpha);

    attribs.push(far_top*aspect, -far_top, -far);
    attribs.push(1, 0, 0, alpha);

    attribs.push(far_top*aspect, far_top, -far);
    attribs.push(1, 0, 0, alpha);

    attribs.push(-far_top*aspect, far_top, -far);
    attribs.push(1, 0, 0, alpha);

    // camera centre at origin in black
    attribs.push(0,0,0);
    attribs.push(0, 0, 0, alpha);

    // --- define plan for indexed drawing of frustum ---

    // indices of the above vertices, for drawing each primitive in the scene
    // @N is the index offset (current position in this array) for each primitive
    // @N == preceding offset + preceding number of vertices
    // number of vertices must match the GL primitive type
    // TRIANGLE_STRIP is used to draw quadrilaterals as pairs of triangles

    indices = [ 5, 4, 6, 7, //  @0 far plane TRIANGLE_STRIP 
                1, 0, 2, 3, //  @4 near plane TRIANGLE_STRIP 
                0, 1, 4, 5, //  @8 bottom side TRIANGLE_STRIP 
                5, 1, 6, 2, // @12 right side TRIANGLE_STRIP 
                2, 3, 6, 7, // @16 top side TRIANGLE_STRIP
                4, 0, 7, 3, // @20 left side TRIANGLE_STRIP 
                0, 1, 2, 3, // @24 near plane LINE_LOOP 
                4, 5, 6, 7, // @28 far plane LINE_LOOP 
                8, 4,       // @32 bottom left LINE 
                8, 5,       // @34 bottom right LINE 
                8, 7,       // @36 top left LINE 
                8, 6 ];     // @38 top right LINE 

    // offset all indices by number of preceding triangle vertices (num_triangles*3)
    // as these were already loaded in the front of the attribs array
    indices = indices.map(i => num_triangles*3 + i);

    // --- define vertex attribute layout ---

    // current_attrib_start = attribs[ offset + index * stride ]
    let stride, xyz_offset, xyz_num, rgba_offset, rgba_num;

    //       indices    0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  ...
    // FLOAT attribs   v0x v0y v0z v0r v0g v0b v0a v1x v1y v1z v1r v1g v1b v1a v2x v2y v2z v2r ...
    //                  |           |               |           |               |           |
    // COORDINATE DATA
    xyz_offset = 0; //  |
        stride = 7; //  |---------------------------|---------------------------|------------- ...
    xyz_num    = 3; //  x---y---z                   x---y---z                   x---y---z 

    // COLOUR DATA 
    rgba_offset = 3; // |-----------|
    //   stride = 7  //             |---------------------------|---------------------------|- ...
    rgba_num    = 4; //             r---g---b---a               r---g---b---a               r- ...

    // CREATE XYZRGBA BUFFER ON GPU
    attrib_buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, attrib_buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attribs), gl.STATIC_DRAW);

    // attribs have now been copied to attrib_buf, which has been 'bound' to gl.ARRAY_BUFFER
    // this means that the following pointers will refer to the data in attrib_buf
    // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer

    // DEFINE COORDINATE POINTER FOR SHADERS
    vertex_loc = gl.getAttribLocation(program, 'vertex');
    gl.vertexAttribPointer(vertex_loc, xyz_num, gl.FLOAT, false, stride*FLOAT_size, xyz_offset*FLOAT_size);
    gl.enableVertexAttribArray(vertex_loc);

    // DEFINE COLOUR POINTER FOR SHADERS
    colour_loc = gl.getAttribLocation(program, 'colour');
    gl.vertexAttribPointer(colour_loc, rgba_num, gl.FLOAT, false, stride*FLOAT_size, rgba_offset*FLOAT_size);
    gl.enableVertexAttribArray(colour_loc);

    // CREATE INDEX BUFFER FOR SHADERS
    index_buf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // --- get uniform locations ---
    modelview_loc = gl.getUniformLocation(program, 'modelview');
    projection_loc = gl.getUniformLocation(program, 'projection');
    use_colour_loc = gl.getUniformLocation(program, 'use_colour');
    alpha_loc = gl.getUniformLocation(program, 'alpha');

    // C1: GET ROTATION AND TRANSLATION LOCATIONS HERE
    rotation_loc = gl.getUniformLocation(program, 'rotation');
    translation_loc = gl.getUniformLocation(program, 'translation');
    translation_inv_loc = gl.getUniformLocation(program, 'translation_inv');

    // --- rendering options ---

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.lineWidth(3.0);

    render_control();
}


function render_control()
{
    // --- render scene from default viewpoint ---

    let vert_fov_deg = vert_fov*180/Math.PI;
    projection = mat_perspective(vert_fov_deg, aspect, near, far);
    modelview = mat_identity(4);

    // C1: DEFINE ROTATION AND TRANSLATION HERE
    rotation = [
        [Math.cos(theta), 0, Math.sin(theta), 0],
        [0, 1, 0, 0],
        [-Math.sin(theta), 0, Math.cos(theta), 0],
        [0, 0, 0, 1]
    ];

    translation = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, max_depth/2],
        [0, 0, 0, 1]
    ];

    translation_inv = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, -max_depth/2],
        [0, 0, 0, 1]
    ];

    // HIDE FRUSTUM ON FIRST RENDER
    render_triangles = true;
    render_near_plane = false;
    render_far_plane = false;
    render_side_planes = false;
    render_near_edges = false;
    render_far_edges = false;
    render_side_edges = false;
    render();

    // B1: INSERT CODE HERE
    // copy the webgl rendered image to other canvas
    ctx.drawImage(gl.canvas, 0, 0);

    // B2: INSERT CODE HERE
    // --- re-render from an external viewpoint ---

    // camera position for backed-off view (remember +z is behind camera)
    // let eye = [0.0, 0.0, 50.0];

    // camera position for overhead view 
    let eye = [110.0, 140.0, 70.0]; // B4

    // target point and up direction of camera 
    let at = [0.0, 0.0, -max_depth];
    let up = [0.0, 1.0, 0.0];

    // transformation to apply to scene
    modelview = mat_lookat(eye,at,up);

    // camera matrix with adjusted clipping planes (so that we see everything)
    projection = mat_perspective(70, aspect, 1, 500);

    // B2, B3, B4 -- MODIFY RENDERING CONTROL
    // render_triangles = false; // B4
    // render_near_plane = false; // original
    // render_far_plane = false; // original
    // render_side_planes = false; // original
    
    render_triangles = true;
    render_near_plane = true; // B3
    render_far_plane = true; // B3
    render_side_planes = true; // B3
    render_near_edges = true;
    render_far_edges = true;
    render_side_edges = true;
    render();

    // check if screen capture requested
    capture_canvas_check();

    // C1: UPDATE ROTATION ANGLE AND SET ANIMATION CALLBACK
    theta += theta_step;
    
    // B1: INSERT CALLBACK CODE HERE
    // ask browser to call render() again, after 1/60 second
    window.setTimeout(render_control, 1000/60);
}


function render() 
{
    console_log('--- RENDERING ---');

    // clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // set matrices in shader
    gl.uniformMatrix4fv(modelview_loc, false, mat_float_flat_transpose(modelview));
    gl.uniformMatrix4fv(projection_loc, false, mat_float_flat_transpose(projection));
    
    // C1: SET ROTATION AND TRANSLATION HERE
    gl.uniformMatrix4fv(rotation_loc, false, mat_float_flat_transpose(rotation));
    gl.uniformMatrix4fv(translation_loc, false, mat_float_flat_transpose(translation));
    gl.uniformMatrix4fv(translation_inv_loc, false, mat_float_flat_transpose(translation_inv));

    // enable colour in shader
    gl.uniform1i(use_colour_loc, true);

    console_log('Drawing ' + num_triangles + ' triangles');
    if(render_triangles) {
        // draw all triangles directly from attribute array
        gl.drawArrays(gl.TRIANGLES, 0, num_triangles*3);
    }

    // C1: DISABLE ROTATION AND TRANSLATION HERE
    gl.uniformMatrix4fv(rotation_loc, false, mat_float_flat_transpose(mat_identity(4)));
    gl.uniformMatrix4fv(translation_loc, false, mat_float_flat_transpose(mat_identity(4)));
    gl.uniformMatrix4fv(translation_inv_loc, false, mat_float_flat_transpose(mat_identity(4)));

    if(render_near_plane || render_far_plane || render_side_edges)
        console_log('Drawing frustum...');

    let offset = 0;

    if(render_far_plane) {
        gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_SHORT, offset*UNSIGNED_SHORT_size);
        console_log('  far plane @' + offset);
    }
    offset += 4;

    if(render_near_plane) {
        gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_SHORT, offset*UNSIGNED_SHORT_size);
        console_log(' near plane @' + offset);
    }
    offset += 4;

    // turn off vertex colouring in shader
    gl.uniform1i(use_colour_loc, false);

    // make planes translucent
    gl.uniform1f(alpha_loc, 0.5);

    for(let k = 0; k < 4; k++) {
        if(render_side_planes) {
            gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_SHORT, offset*UNSIGNED_SHORT_size);
            console_log('  side plane @' + offset);
        }
        offset += 4;
    }

    // make edges darker
    gl.uniform1f(alpha_loc, 0.5);

    if(render_near_edges) {
        gl.drawElements(gl.LINE_LOOP, 4, gl.UNSIGNED_SHORT, offset*UNSIGNED_SHORT_size);
        console_log(' near edges @' + offset);
    }
    offset += 4;

    if(render_far_edges) {
        gl.drawElements(gl.LINE_LOOP, 4, gl.UNSIGNED_SHORT, offset*UNSIGNED_SHORT_size);
        console_log('  far edges @' + offset);
    }
    offset += 4;

    for(let k = 0; k < 4; k++) {
        if(render_side_edges) {
            gl.drawElements(gl.LINES, 2, gl.UNSIGNED_SHORT, offset*UNSIGNED_SHORT_size);
            console_log('  side edge @' + offset);
        }
        offset += 2;
    }
}

