// Night globe from Global Hack Map: NASA shaded relief, Black Marble lights, fog, and stars.
// Relief and lights are public-domain NASA imagery bundled locally.

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uRelief;
uniform sampler2D uLights;
uniform vec3 uGlobe;
uniform float uRotation;
uniform float uTime;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 p = (gl_FragCoord.xy - uGlobe.xy) / uGlobe.z;
  float r = length(p);
  vec2 cell = floor(gl_FragCoord.xy / 2.6);
  float n = hash(cell);
  float star = step(0.9932, n);
  float twinkle = 0.55 + 0.45 * sin(uTime * (1.1 + hash(cell + 3.0) * 2.4) + n * 30.0);
  float magnitude = star * twinkle * mix(0.28, 1.0, step(0.998, n));
  vec3 sky = vec3(0.0196) + vec3(magnitude);
  float halo = exp(-pow((r - 1.0) * 16.0, 2.0));
  sky += vec3(0.145, 0.145, 0.145) * halo * 0.7;

  if (r > 1.0) {
    outColor = vec4(sky, 1.0);
    return;
  }

  float z = sqrt(max(0.0, 1.0 - r * r));
  float lat = asin(clamp(p.y, -1.0, 1.0));
  float lon = atan(p.x, z) - uRotation;
  vec2 uv = vec2(fract(lon / 6.2831853 + 0.5), lat / 3.14159265 + 0.5);
  float gray = texture(uRelief, uv).r;
  vec3 color = vec3(gray * (0.9 + 0.1 * z));

  float light = texture(uLights, uv).r;
  float glow = smoothstep(0.08, 0.28, light) * 0.28;
  glow += smoothstep(0.28, 0.62, light) * 0.38;
  glow += smoothstep(0.62, 1.0, light) * 0.28;
  color += vec3(0.97, 0.96, 0.93) * glow;

  float limb = smoothstep(0.9, 1.0, r);
  color = mix(color, vec3(0.145, 0.145, 0.145), limb * 0.55);
  color = mix(color, vec3(0.22, 0.22, 0.22), smoothstep(0.985, 1.0, r));
  outColor = vec4(color, 1.0);
}`

export type SkyFrame = {
  centerX: number
  centerY: number
  radius: number
  cssHeight: number
  dpr: number
  rotation: number
  time: number
}

export type GlobeSky = {
  draw: (frame: SkyFrame) => void
  dispose: () => void
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function upload(gl: WebGL2RenderingContext, unit: number, source: TexImageSource, wrapS: number) {
  const texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
}

export function createGlobeSky(
  canvas: HTMLCanvasElement,
  relief: TexImageSource,
  lights: TexImageSource,
): GlobeSky | null {
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false })
  if (!gl) return null
  const program = gl.createProgram()
  const vertex = compile(gl, gl.VERTEX_SHADER, VERT)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAG)
  if (!program || !vertex || !fragment) return null
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program))
    return null
  }
  gl.useProgram(program)

  const quad = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
  upload(gl, 0, relief, gl.REPEAT)
  upload(gl, 1, lights, gl.REPEAT)
  gl.uniform1i(gl.getUniformLocation(program, 'uRelief'), 0)
  gl.uniform1i(gl.getUniformLocation(program, 'uLights'), 1)
  const globe = gl.getUniformLocation(program, 'uGlobe')
  const rotation = gl.getUniformLocation(program, 'uRotation')
  const time = gl.getUniformLocation(program, 'uTime')

  return {
    draw(frame) {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(program)
      const y = (frame.cssHeight - frame.centerY) * frame.dpr
      gl.uniform3f(globe, frame.centerX * frame.dpr, y, frame.radius * frame.dpr)
      gl.uniform1f(rotation, (frame.rotation * Math.PI) / 180)
      gl.uniform1f(time, frame.time)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },
    dispose() {
      gl.deleteProgram(program)
      gl.deleteBuffer(quad)
    },
  }
}
