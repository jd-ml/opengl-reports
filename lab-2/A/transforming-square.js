'use strict';
var canvas, gl;
const vs_file = './transforming-vert.glsl';
const fs_file = './transforming-frag.glsl';

// rotation angle, step, and location in shader
var theta = Math.PI/4.0;
var theta_step = 0.01;
var rotate_loc, pre_rotate_loc, pre_scale_loc, rgb_loc;

// A2-5 ADD NEW DECLARATIONS
var translate_loc;
var shear_loc;
var projective_loc;
var projective_inv_loc;

// buffers and attributes
var vertices, grid, indices;

var vertex_loc, grid_loc;

var vertex_buf, grid_buf;

window.onload = async function()
{
    // --- general setup ---

    // set button to save the image
    capture_canvas_setup('gl-canvas', 'capture-button', 'capture.png');

    // prepare the context
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl');

    // prepare the window
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // load the shader source code into JS strings
    const vs_src = await fetch(vs_file).then(out => out.text());
    const fs_src = await fetch(fs_file).then(out => out.text());
    // make the shaders and link them together as a program
    let vs = webgl_make_shader(gl, vs_src, gl.VERTEX_SHADER);
    let fs = webgl_make_shader(gl, fs_src, gl.FRAGMENT_SHADER);
    let program = webgl_make_program(gl, vs, fs);
    gl.useProgram(program);

    // --- geometry and colour data ---

    // corners (x,y) of the square (diamond)
    vertices = [[ 0,  1],
                [-1,  0],
                [ 1,  0],
                [ 0, -1]];

    let r = Math.sqrt(2.0)/4.0;

    grid = [[-1, r], [ 1, r],
            [-1,-r], [ 1,-r],
            [ r,-1], [ r, 1], 
            [-r,-1], [-r, 1]];

    // --- geometry and colour setup ---

    // create buffer and make it current ('bind' it)
    vertex_buf = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buf);
    // concatenate the vertices and grid into buffer
    gl.bufferData(gl.ARRAY_BUFFER, mat_float_flat(vertices.concat(grid)), gl.STATIC_DRAW);
    vertex_loc = gl.getAttribLocation(program, 'vertex');
    gl.vertexAttribPointer(vertex_loc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertex_loc);

    // get uniform locations
    pre_rotate_loc = gl.getUniformLocation(program, 'pre_rotate');
    pre_scale_loc = gl.getUniformLocation(program, 'pre_scale');
    rotate_loc = gl.getUniformLocation(program, 'rotate');
    rgb_loc = gl.getUniformLocation(program, 'rgb');

    // A2-5 GET NECESSARY UNIFORM LOCATIONS
    translate_loc = gl.getUniformLocation(program, 'translate');
    shear_loc = gl.getUniformLocation(program, 'shear');
    projective_loc = gl.getUniformLocation(program, 'projective');
    projective_inv_loc = gl.getUniformLocation(program, 'projective_inv');

    // start drawing
    render();
};


// --- rendering function --- called once per frame

function render() 
{
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // identity matrix -- this has no effect
    let identity = mat_identity(4);

    // A1 -- DEFINE THESE TWO 4x4 MATRICES PROPERLY
    let pre_scale = [
        [1/2, 0, 0, 0],
        [0, 1/2, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]];

    let pre_rotate = [
        [Math.PI/4, -Math.PI/4, 0, 0],
        [Math.PI/4, Math.PI/4, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]];

    // update the rotation angle
    theta += theta_step;

    let rotate = [
        [Math.cos(theta), -Math.sin(theta), 0, 0],
        [Math.sin(theta),  Math.cos(theta), 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]];

    let side = Math.sqrt(2)/2.0;

    // A2-5 DEFINE NEW MATRICES
    let translate = [
        [1, 0, 0, side/2],
        [0, 1, 0, side/2],
        [0, 0, 1, 0],
        [0, 0, 0, 1]];

    let shear = [
        [1, Math.tan(theta), 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]];

    let projective = [
        [4/(2+side), 0, 0, 0],
        [0, 1, 0, ((side-2)*side)/(2*(side+2))],
        [0, 0, 1, 0],
        [0, (2*(side-2))/(side*(side+2)), 0, 1]];

    let projective_inv = [
        [2+side, 0, 0, 0], 
        [0, Math.pow(2+side,2)/(2*side), 0, 1-Math.pow(side,2)/4],
        [0, 0, 4, 0],
        [0, 4/Math.pow(side,2)-1, 0,  Math.pow(2+side,2)/(2*side)]];
    
    // set all transformations
    gl.uniformMatrix4fv(pre_rotate_loc, false, mat_float_flat_transpose(pre_rotate));
    gl.uniformMatrix4fv(pre_scale_loc, false, mat_float_flat_transpose(pre_scale));
    gl.uniformMatrix4fv(rotate_loc, false, mat_float_flat_transpose(rotate));

    // A2-5 SET NECESSARY TRANSFORMATION UNIFORMS
    gl.uniformMatrix4fv(translate_loc, false, mat_float_flat_transpose(translate));
    gl.uniformMatrix4fv(shear_loc, false, mat_float_flat_transpose(shear));
    gl.uniformMatrix4fv(projective_loc, false, mat_float_flat_transpose(projective));
    gl.uniformMatrix4fv(projective_inv_loc, false, mat_float_flat_transpose(projective_inv));

    // set red colour
    gl.uniform3fv(rgb_loc, [1,0,0]);
    // draw the rotating strip of two triangles
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length);

    // disable transformations before drawing grid, by setting them to the identity matrix

    // A2 DISABLE YOUR TRANSFORMATIONS 
    gl.uniformMatrix4fv(translate_loc, false, mat_float_flat_transpose(identity));
    gl.uniformMatrix4fv(shear_loc, false, mat_float_flat_transpose(identity));
    gl.uniformMatrix4fv(projective_loc, false, mat_float_flat_transpose(identity));
    gl.uniformMatrix4fv(projective_inv_loc, false, mat_float_flat_transpose(identity));

    gl.uniformMatrix4fv(pre_rotate_loc, false, mat_float_flat_transpose(identity));
    gl.uniformMatrix4fv(pre_scale_loc, false, mat_float_flat_transpose(identity));
    gl.uniformMatrix4fv(rotate_loc, false, mat_float_flat_transpose(identity));
    // set black colour
    gl.uniform3fv(rgb_loc, [0,0,0]);

    // draw grid
    gl.drawArrays(gl.LINES, vertices.length, grid.length);

    // check if screen capture requested
    capture_canvas_check();

    // ask browser to call render() again, after 1/60 second
    window.setTimeout(render, 1000/60);
}

