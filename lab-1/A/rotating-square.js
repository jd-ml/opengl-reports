'use strict';
// HTML5 canvas, WebGL context, and shader filenames
var canvas, gl;
const vs_file = './rotating-shape-vert.glsl';
const fs_file = './rotating-shape-frag.glsl';

// rotation angle, step, and location in shader
var theta = 0.0;
// A0: CHANGE THE DEFAULT STEP VALUE
var theta_step = 0.0;
var theta_loc;

// buffers and attributes
var vertices, indices, colours;
var index_buf, colour_buf;
var colour_loc;


// callback of HTML speed selection menu
function set_speed(obj)
{
    // get value of selection (see HTML)
    let selection = obj.options[obj.selectedIndex].value;
    console.log('Selection is ' + selection);

    switch(selection) {
        
        // A0: ADD CODE HERE
        case 'slow':
            theta_step = 0.005;
            break;
        case 'medium':
            theta_step = 0.01;
            break;
        case 'fast':
            theta_step = 0.02;
            break;
        default:
            theta_step = 0.0;
            break;

    }
    console.log('Angle step is ' + theta_step);
}


// intialization --- called once per page load
window.onload = async function()
{
   // --- general setup ---

   // configure button to save the image
   capture_canvas_setup('gl-canvas', 'capture-button', 'capture.png');

   // prepare the GL context
   canvas = document.getElementById('gl-canvas');
   gl = canvas.getContext('webgl');
   
   // global window settings
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

   // -- geometry data --

   // corners (x,y) of the square (as a diamond)
   // top, left, right, bottom
    vertices = [[0,1], [-1,0], [1,0], [0,-1]];

    // A5: MODIFY BELOW
    indices = [
        0, 1,
        0, 2,
        0, 3,
        1, 2,
        1, 3,
        2, 3,
    ];

    // vertex indices for line drawing
    // indices = [0, 1];

    // RGBA values
    colours = [
        [1.0,  0.0,  0.0,  1.0], // red
        [0.0,  1.0,  0.0,  1.0], // green
        [0.0,  0.0,  1.0,  1.0], // blue
        [1.0,  1.0,  1.0,  1.0], // white
        // A6: APPEND SIX BLACK VERTICES
        [0.0,  0.0,  0.0,  1.0], // black
        [0.0,  0.0,  0.0,  1.0], // black
        [0.0,  0.0,  0.0,  1.0], // black
        [0.0,  0.0,  0.0,  1.0], // black
        [0.0,  0.0,  0.0,  1.0], // black
        [0.0,  0.0,  0.0,  1.0]  // black
    ];

    // --- geometry and colour setup ---

    // setup vertex array
    let vertex_buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buf);
    gl.bufferData(gl.ARRAY_BUFFER, mat_float_flat(vertices), gl.STATIC_DRAW);
    // find vertex variable in shader and connect to bound ARRAY_BUFFER
    let vertex_loc = gl.getAttribLocation(program, 'vertex');
    gl.vertexAttribPointer(vertex_loc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertex_loc);

    // setup vertex colours
    let colour_buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colour_buf);
    gl.bufferData(gl.ARRAY_BUFFER, mat_float_flat(colours), gl.STATIC_DRAW);
    // find vertex variable in shader
    colour_loc = gl.getAttribLocation(program, 'colour');

    // note that colour_buf will remain the current ARRAY_BUFFER

    // setup edge indices
    index_buf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mat_uint_flat(indices), gl.STATIC_DRAW);

    // get locations of uniform angle variable from the shader
    theta_loc = gl.getUniformLocation(program, 'theta');

    // drawing style
    gl.lineWidth(5.0);

    // print vertices
    // console.log(vertices);

    // start drawing
    render();
};


// --- rendering function --- called once per frame

function render() {

    // clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    // update the rotation angle
    theta += theta_step;
    gl.uniform1f(theta_loc, theta);

    // A4 & A5: MODIFY BELOW

    // A6: ADD CODE HERE
    let black_offset = vertices.length * 4 * 4;

    // draw triangle strip
    let num_strip_vertices = vertices.length;
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, num_strip_vertices);

    // A5 Code
    gl.vertexAttribPointer(colour_loc, 4, gl.FLOAT, false, 0, black_offset);
    gl.enableVertexAttribArray(colour_loc);
    let num_line_vertices = indices.length;
    gl.drawElements(gl.LINES, num_line_vertices, gl.UNSIGNED_SHORT, 0);

    // A1 - change number_strip_vertices to 3
    //gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);

    // connect vertex_colour attribute in shader to colour_buf
    gl.vertexAttribPointer(colour_loc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colour_loc);
    
    // check if screen capture requested
    capture_canvas_check();

   // ask browser to call render() again, after 1/60 second
   window.setTimeout(render, 1000/60);
}

