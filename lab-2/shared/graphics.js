// WebGL graphics utilities
// Miles Hansard 2021
// No need to understand the implementation details

function random(min, max) 
{
   // uniform random number between min and max
   return min + Math.random() * (max - min);
}

function radians(degrees) 
{
   // convert degrees to radians
   return degrees * Math.PI / 180;
}

function degrees(radians) 
{
   // convert radians to degrees
   return radians/Math.PI * 180;
}

function vec_zero(n)
{
   // make a 1D array of n zeros
   return Array(n).fill(0);
}

function vec_sum(u,v)
{
   // elementwise addition of 1D arrays
   return u.map((ui,i) => ui+v[i]);
}

function vec_dif(u,v)
{
   // elementwise difference of 1D arrays
   return u.map((ui,i) => ui-v[i]);
}

function vec_scale(s,u)
{
   // multiply all elements of array by s
   return u.map(ui => s*ui);
}

function vec_dot(u,v)
{
   // dot product of 1D arrays
   return u.map((ui,i) => ui*v[i]).reduce((uv,uvi) => uv+uvi, 0);
}

function vec_neg(u)
{
   // elementwise negation of 1D array
   return vec_scale(-1,u);
}

function vec_norm(u)
{
   // euclidean length of vector
   return Math.sqrt(vec_dot(u,u));
}

function vec_unit(u)
{
   // make unit vector from 1D array
   return vec_scale(1/vec_norm(u), u);
}

function mat_asym(u)
{
   // make antisymmetric cross product matrix U where U*v = u x v
   return [[  0,  -u[2], u[1]],
           [ u[2],  0,  -u[0]],
           [-u[1], u[0],  0  ]];
}

function mat_sym(u)
{
   // make symmetric matrix [u]^T * [u]
   return mat_prod(mat_transpose([u]), [u]);
}

function mat_scale(s,m)
{
   // elementwise scaling of matrix entries
   return m.map(mi => vec_scale(s,mi));
}

function mat_add(m,n)
{
   // elementwise addition of matrices
   return m.map((mi,i) => vec_sum(mi,n[i])); 
}

function mat_rotation(t,v)
{
   //  3D rotation matrix for angle t and axis v
   let u = vec_unit(v);
   let diag = mat_scale(Math.cos(t), mat_identity(3));
   let asym = mat_scale(Math.sin(t), mat_asym(u));
   let  sym = mat_scale(1-Math.cos(t), mat_sym(u));
   return mat_add(diag, mat_add(asym,sym));
}

function vec_cross(u,v)
{
   // cross product of vectors
   return mat_asym(u).map(ai => vec_dot(ai,v));
}

function mat_zero(m,n)
{
   // make m*n matrix of zeros
   return Array(m).fill('').map(row => Array(n).fill(0));
}

function mat_identity(n)
{
   // make n*n identity matrix
   return mat_zero(n,n).map((row,i) => row.fill(1,i,i+1));
}

function mat_hom(m)
{
   // append column of zeros and bottom row [0,...,0,1] to matrix m
   return [...m.map(mi => [...mi,0]),  [...vec_zero(m.length),1]];
}

function mat_diag(u)
{
   // make diagonal matrix from entries of 1D array
   let n = u.length;
   return mat_zero(n,n).map((row,i) => row.fill(u[i],i,i+1));
}

function mat_scaling(u)
{
   // make homogeneous scaling matrix
   return mat_diag([...u,1]);
}

function mat_translation(v)
{
   // homogeneous translation matrix from n-1 vector v
   let n = v.length;
   let aff = mat_identity(n).map((mi,i) => [...mi, v[i]]);
   return [...aff, [...vec_zero(n), 1]];
}

function mat_motion(t,u,v)
{
   // rotation by angle t around axis u, plus translation by v 
   return mat_prod(mat_translation(v), mat_hom(mat_rotation(t,u)));
}

function mat_float_flat(data)
{
   // flatten the data to a 1D array, and return a Float32 copy
   return new Float32Array(data.flat());
}

function mat_uint_flat(data)
{
   // flatten the data to a 1D array, and return a Uint16 copy
   return new Uint16Array(data.flat());
}

function mat_transpose(m)
{
   // jth entry of top row m0 maps to jth column of matrix
   return m[0].map((m0,j) => m.map(mi => mi[j]));
}

function mat_float_flat_transpose(m)
{
   // transpose and then flatten, e.g. [[a,b],[c,d]] --> [a,c,b,d]
   return mat_float_flat(mat_transpose(m));
}

function mat_prod(m,n)
{
   // product of matrices
   // mn_ij is dot product of row mi and column nj 
   return m.map(mi => mat_transpose(n).map(nj => vec_dot(mi,nj)));
}

function mat_perspective(fovy, aspect, near, far)
{
   let f = 1/Math.tan(radians(fovy)/2);
   let d = far - near;
   let cam = mat_zero(4,4);
   cam[0][0] = f / aspect;
   cam[1][1] = f;
   cam[2][2] = -(near+far) / d;
   cam[2][3] = -2*near*far / d;
   cam[3][2] = -1;
   cam[3][3] = 0;
   return cam;
}

function mat_lookat(eye, at, up)
{
   let v = vec_unit(vec_dif(at,eye));
   let n = vec_unit(vec_cross(v,up));
   let u = vec_unit(vec_cross(n,v));
   v = vec_neg(v);
   n.push(-vec_dot(n,eye));
   u.push(-vec_dot(u,eye));
   v.push(-vec_dot(v,eye));
   let w = [0,0,0,1];
   return [ n, u, v, w ];
}

function mat_console_log(m)
{
   // print matrix to console as 2D array
   let str = '';
   for(let i = 0; i < m.length; i++) {
      for(let j = 0; j < m[i].length; j++)
         str += m[i][j].toFixed(3) + '\t';
      str += '\n';
   }
   console.log(str);
}

// -- Colour functions ---

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

// --- WebGL setup ---

function webgl_make_shader(gl, source, shader_type) 
{
    let shader = gl.createShader(shader_type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw 'could not compile shader:' + gl.getShaderInfoLog(shader);
    }
    return shader;
}

function webgl_make_program(gl, vs, fs) 
{
    let program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw 'could not link program:' + gl.getProgramInfoLog(program);
    }
    return program;
};

// --- Capture the WebGL canvas ---

// Example HTML: <button type='button' id='capture-button'>Capture image</button>

var capture_canvas = false;
var capture_canvas_id;
var capture_canvas_name;

function capture_canvas_setup(canvas_id, button_id, image_name)
{
   // set canvas id and output image name
   capture_canvas_id = canvas_id;
   capture_canvas_name = image_name;

   // attach the button to the global flag
   document.getElementById(button_id).onclick = function() {
      capture_canvas = true;
   };
}

// call this function in the rendering loop
function capture_canvas_check()
{
    if(capture_canvas) {
        // capture the canvas to data url and simulate clicking it
        let link = document.createElement('a');
        link.href = document.getElementById(capture_canvas_id).toDataURL('image/png');
        link.download = capture_canvas_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // unset the flag
        capture_canvas = false;
    }
}

