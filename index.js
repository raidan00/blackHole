function createShader(type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  console.error('Shader Error', gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}
function createProgram(vertexShaderSource, fragmentShaderSource){
	var program = gl.createProgram();
	gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexShaderSource));
	gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentShaderSource));
	gl.linkProgram(program);
	var success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}
	console.error('Program Error:', gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}
var canvas = document.getElementById('webgl');
var gl = canvas.getContext("webgl");
var program = createProgram(
	`attribute vec4 a_Position;
	attribute vec2 a_TexCoord;
	attribute float a_xRatio;
	attribute float a_time;
	varying vec2 v_TexCoord;
	varying float xRatio;
	varying float time;
	void main() {
		gl_Position = a_Position;
		v_TexCoord = a_TexCoord;
		xRatio = a_xRatio;
		time = a_time;
	}`
,
  `#ifdef GL_ES
	precision mediump float;
	#endif
	uniform sampler2D u_Sampler;
	varying vec2 v_TexCoord;
	
	varying float xRatio;
	varying float time;
	void main() {
		float holeSize = 0.5*time;
		float ringSize = 0.15*time;
		gl_FragColor = texture2D(u_Sampler, v_TexCoord);
		vec2 uv = v_TexCoord-0.5;
		uv.x *= xRatio;
		if(length(uv) < holeSize) {
			gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
		}else if(length(uv) < holeSize + ringSize){
			float len = length(uv);
			float angle = atan(uv.y, uv.x);
			angle += (holeSize + ringSize - len)/(ringSize+holeSize)*4. ;
			vec2 newPos = vec2(cos(angle)*len, sin(angle)*len);
			newPos.x /= xRatio;
			newPos += 0.5;
			gl_FragColor = texture2D(u_Sampler, newPos);
		}
	}`
);
gl.useProgram(program);
var a_xRatio = gl.getAttribLocation(program, 'a_xRatio');
var a_time = gl.getAttribLocation(program, 'a_time');

var verticesTexCoords = new Float32Array([
	-1,  1,   0.0, 1.0,
    -1, -1,   0.0, 0.0,
     1,  1,   1.0, 1.0,
     1, -1,   1.0, 0.0,
]);
var n = 4; // The number of vertices
var vertexTexCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);
var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
var a_Position = gl.getAttribLocation(program, 'a_Position');
gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
gl.enableVertexAttribArray(a_Position); 
var a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');
gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
gl.enableVertexAttribArray(a_TexCoord);  // Enable the assignment of the buffer object
gl.clearColor(0.0, 0.0, 0.0, 1.0);

var texture = gl.createTexture();   // Create a texture object
var u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the textures's y axis
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.uniform1i(u_Sampler, 0);
var video = document.getElementsByTagName("video")[0];
video.oncanplay = updateEffect;
function updateEffect(){
  	canvas.width = video.clientWidth;
  	canvas.height = video.clientHeight;
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.vertexAttrib1f(a_xRatio, video.clientWidth/video.clientHeight);
	gl.vertexAttrib1f(a_time, Date.now()%10000/10000);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	requestAnimationFrame(updateEffect)
}
