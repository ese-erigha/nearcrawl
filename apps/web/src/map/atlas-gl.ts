// Atlas statue from Global Hack Map. MIT License. Copyright (c) 2026 Valyu.
// The marble sphere in the source image is aligned to our globe. Glyphs inside the disc are dropped.

const SPHERE = { x: 0.49, y: 0.183, r: 0.236 }
const RAMP = ' .,:;-=+*xo%#@'
const CELL = { w: 7, h: 11 }

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uImage;
uniform sampler2D uAtlas;
uniform vec2 uRes;
uniform vec2 uCell;
uniform vec4 uImgRect;
uniform vec3 uGlobe;
uniform vec2 uMouse;
uniform float uTime;
uniform float uReveal;
uniform float uOpacity;
uniform float uGlyphs;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 cell = floor(p / uCell);
  vec2 local = (p - cell * uCell) / uCell;
  vec2 center = (cell + 0.5) * uCell;

  float dGlobe = distance(center, uGlobe.xy);
  if (dGlobe < uGlobe.z * 0.995) discard;

  vec2 uv = (center - uImgRect.xy) / uImgRect.zw;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;

  vec3 src = texture(uImage, uv).rgb;
  float lum = dot(src, vec3(0.299, 0.587, 0.114));
  lum = smoothstep(0.06, 0.92, lum);
  lum *= smoothstep(1.0, 0.62, uv.y);

  float t = uTime;
  float mouse = smoothstep(150.0, 0.0, distance(center, uMouse));
  float band = exp(-pow((center.y / uRes.y - fract(t * 0.045) * 1.4 + 0.2) * 9.0, 2.0));
  float rim = smoothstep(uGlobe.z * 1.12, uGlobe.z, dGlobe);

  float level = clamp(lum + band * 0.12 * lum + mouse * 0.25 * lum, 0.0, 1.0);
  float idx = floor(level * (uGlyphs - 1.0) + 0.5);

  float h = hash(cell + floor(t * 7.0));
  if (lum > 0.08 && (h > 0.992 || mouse * h > 0.55 || band * h > 0.93)) {
    idx = floor(hash(cell + floor(t * 24.0)) * (uGlyphs - 1.0)) + 1.0;
  }

  float reveal = step(hash(cell * 1.731), uReveal);
  if (reveal < 0.5 && lum > 0.05 && hash(cell + floor(t * 30.0)) > 0.6) {
    idx = floor(hash(cell + floor(t * 30.0) + 3.1) * (uGlyphs - 1.0)) + 1.0;
    reveal = 0.35;
  }

  float a = texture(uAtlas, vec2((idx + local.x) / uGlyphs, local.y)).a;
  vec3 ink = mix(vec3(0.62, 0.66, 0.72), vec3(0.96, 0.94, 0.91), level);
  ink = mix(ink, vec3(0.55, 0.75, 1.0), rim * 0.35);
  float halo = 1.0 - rim * 0.45;
  float alpha = a * reveal * uOpacity * halo * (0.12 + 0.6 * level + band * 0.22 + mouse * 0.4);
  outColor = vec4(ink * alpha, alpha);
}`

export type AtlasFrame = {
  centerX: number
  centerY: number
  radius: number
  cssWidth: number
  cssHeight: number
  dpr: number
  time: number
  mouseX: number
  mouseY: number
  reduced: boolean
  opacity: number
}

export type AtlasGl = {
  draw: (frame: AtlasFrame) => void
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

function glyphSheet(dpr: number): HTMLCanvasElement {
  const w = Math.round(CELL.w * dpr)
  const h = Math.round(CELL.h * dpr)
  const canvas = document.createElement('canvas')
  canvas.width = w * RAMP.length
  canvas.height = h
  const context = canvas.getContext('2d')
  if (!context) return canvas
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.font = `500 ${Math.round(h * 0.86)}px "Martian Mono", ui-monospace, monospace`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = '#fff'
  ;[...RAMP].forEach((character, index) => {
    context.fillText(character, index * w + w / 2, h / 2 + dpr * 0.5)
  })
  return canvas
}

function upload(gl: WebGL2RenderingContext, unit: number, source: TexImageSource, filter: number) {
  const texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
  return texture
}

export function createAtlasGl(canvas: HTMLCanvasElement, image: HTMLImageElement): AtlasGl | null {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, alpha: true })
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

  const loc = (name: string) => gl.getUniformLocation(program, name)
  upload(gl, 0, image, gl.LINEAR)
  let sheetDpr = 0
  let sheet: WebGLTexture | null = null
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

  const paintSheet = (dpr: number) => {
    sheetDpr = dpr
    gl.activeTexture(gl.TEXTURE1)
    if (sheet) gl.deleteTexture(sheet)
    sheet = upload(gl, 1, glyphSheet(dpr), gl.NEAREST)
  }

  return {
    draw(frame) {
      const dpr = Math.min(frame.dpr, 2)
      if (dpr !== sheetDpr) paintSheet(dpr)
      const elapsed = frame.reduced ? 0 : frame.time
      const width = ((frame.radius * 1.07) / SPHERE.r) * dpr
      const height = width * (image.naturalHeight / image.naturalWidth)
      const left = frame.centerX * dpr - SPHERE.x * width
      const top = frame.centerY * dpr - SPHERE.y * height
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)
      gl.uniform2f(loc('uRes'), canvas.width, canvas.height)
      gl.uniform2f(loc('uCell'), CELL.w * dpr, CELL.h * dpr)
      gl.uniform4f(loc('uImgRect'), left, top, width, height)
      gl.uniform3f(loc('uGlobe'), frame.centerX * dpr, frame.centerY * dpr, frame.radius * dpr)
      gl.uniform2f(loc('uMouse'), frame.mouseX * dpr, frame.mouseY * dpr)
      gl.uniform1f(loc('uTime'), elapsed)
      gl.uniform1f(loc('uReveal'), frame.reduced ? 1 : Math.min(1, elapsed / 2.4))
      gl.uniform1f(loc('uOpacity'), frame.opacity)
      gl.uniform1f(loc('uGlyphs'), RAMP.length)
      gl.uniform1i(loc('uImage'), 0)
      gl.uniform1i(loc('uAtlas'), 1)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },
    dispose() {
      gl.deleteProgram(program)
      gl.deleteBuffer(quad)
      if (sheet) gl.deleteTexture(sheet)
    },
  }
}
