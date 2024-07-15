'use strict';
// HTML5 canvas, WebGL context, and shader filenames
var canvas, gl;
const vs_file = './rotating-shape-vert.glsl';
const fs_file = './rotating-shape-frag.glsl';

// rotation angle, and location in shader

// buffers and attributes
var vertices, indices, colours, vertices_colours;

// scale value
let s = 0;

// C1,C2: MODIFY HERE
//var num_vertices = 8;
var num_vertices = 1000;

function rgba_wheel(t)
{
   // generate a crude colour wheel, for t in [0,2pi]
   
   // 120 degrees to separate R-G-B around the wheel
   let u = 2*Math.PI/3;

   // cosine waves offset by 120 degrees, and mapped to values in [0,1]
   return [ (1 + Math.cos(t))/2, 
            (1 + Math.cos(t-u))/2, 
            (1 + Math.cos(t+u))/2, 1];
}

// C5: ADD FUNCTION HERE
function squircle(t, n)
{
  return [  s*Math.pow(Math.abs(Math.cos(t)),(2/n))*Math.sign(Math.cos(t)),
            s*Math.pow(Math.abs(Math.sin(t)),(2/n))*Math.sign(Math.sin(t))];
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
   gl.lineWidth(10.0);

   // load the shader source code into JS strings
   const vs_src = await fetch(vs_file).then(out => out.text());
   const fs_src = await fetch(fs_file).then(out => out.text());
   // make the shaders and link them together as a program
   let vs = webgl_make_shader(gl, vs_src, gl.VERTEX_SHADER);
   let fs = webgl_make_shader(gl, fs_src, gl.FRAGMENT_SHADER);
   let program = webgl_make_program(gl, vs, fs);
   gl.useProgram(program);

   // --- geometry and colour data ---

   // data for attributes
   vertices = [];
   colours = [];

   // while (!s == 1){ 
   // // C1, C3, C4, C5: ADD CODE HERE
   //    for (let k = 0; k < num_vertices+1 ; k++) {
   //       let t = k/num_vertices * 2.0*Math.PI*16;
   //       vertices[k] = [0.99*Math.cos(t)*s, 0.99*Math.sin(t)*s];
   //       colours.push([1.0, 0.0, 0.0, 1.0]);
   //       s += 0.001;
   //    } // end for
   // } // end while

   while (!s == 1){ 
      for (let k = 0; k < num_vertices+1 ; k++) {
         let t = k/num_vertices * 2.0*Math.PI*16;
         //vertices[k] = [0.99*Math.cos(t)*s, 0.99*Math.sin(t)*s];
         vertices[k] = squircle(t,4);
         colours.push(rgba_wheel(t));
         s += 0.001;
      } // end for
   } // end while

    indices = [
        0, 1, // side 1
        1, 2, // side 2
        2, 3, // side 3
        3, 4, // side 4
        4, 5, // side 5
        5, 6, // side 6
        6, 7, // side 7
        7, 0, // side 8
        0, 1, // duplicate
    ];

    // --- geometry setup ---

    // create and fill vertex buffer
    let vertex_buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buf);
    gl.bufferData(gl.ARRAY_BUFFER, mat_float_flat(vertices), gl.STATIC_DRAW);

    // connect vertex variable in shader to vertex_buf (the current ARRAY_BUFFER)
    let vertex_loc = gl.getAttribLocation(program, 'vertex');
    gl.vertexAttribPointer(vertex_loc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertex_loc);

    // --- colour setup ---

    // create and fill vertex colour buffer
    let colour_buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colour_buf);
    gl.bufferData(gl.ARRAY_BUFFER, mat_float_flat(colours), gl.STATIC_DRAW);

    // connect colour variable in shader to colour_buf (the current ARRAY_BUFFER)
    let colour_loc = gl.getAttribLocation(program, 'colour');
    gl.vertexAttribPointer(colour_loc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colour_loc);

    // start drawing
    render();
};


// --- rendering function --- called once per frame

function render() {

    // clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw strip including the duplicated last vertex 
    gl.drawArrays(gl.LINE_STRIP, 0, num_vertices+1);

    // check if screen capture requested
    capture_canvas_check();

   // ask browser to call render() again, after 1/60 second
   window.setTimeout(render, 1000/60);
}

