import { smokeFragmentShader, smokeVertexShader } from './smokeShaders';
import { defaultSmokeSettings, type SmokeSettings } from './smokeSettings';

export type SmokeTint = readonly [number, number, number];

export function createSmokeRenderer(canvas: HTMLCanvasElement, initialSettings: SmokeSettings = defaultSmokeSettings) {
  const gl = canvas.getContext('webgl', {
    alpha: true, antialias: false, depth: false, stencil: false,
    premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'low-power',
  });
  if (!gl) return null;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let uniforms: { resolution: WebGLUniformLocation | null; time: WebGLUniformLocation | null; density: WebGLUniformLocation | null; finaleColor: WebGLUniformLocation | null; finaleTint: WebGLUniformLocation | null } | null = null;
  let frame = 0;
  let elapsed = 0;
  let previousTime: number | null = null;
  let previousAnimationTime: number | null = null;
  let settings = { ...initialSettings };
  let tint: SmokeTint | null = null;
  let active = false;
  let lost = false;
  let disposed = false;

  function release() {
    gl!.deleteBuffer(buffer);
    gl!.deleteProgram(program);
    buffer = null;
    program = null;
    uniforms = null;
  }

  function compile(type: number, source: string) {
    const shader = gl!.createShader(type);
    if (!shader) throw new Error('Shader indisponível');
    gl!.shaderSource(shader, source);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
      gl!.deleteShader(shader);
      throw new Error('Não foi possível compilar a fumaça');
    }
    return shader;
  }

  function initialize() {
    const shaders: WebGLShader[] = [];
    try {
      release();
      shaders.push(compile(gl!.VERTEX_SHADER, smokeVertexShader));
      shaders.push(compile(gl!.FRAGMENT_SHADER, smokeFragmentShader));
      program = gl!.createProgram();
      if (!program) throw new Error('Programa indisponível');
      shaders.forEach(shader => gl!.attachShader(program!, shader));
      gl!.linkProgram(program);
      if (!gl!.getProgramParameter(program, gl!.LINK_STATUS)) throw new Error('Programa inválido');
      gl!.useProgram(program);
      buffer = gl!.createBuffer();
      if (!buffer) throw new Error('Buffer indisponível');
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
      gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl!.STATIC_DRAW);
      const position = gl!.getAttribLocation(program, 'a_position');
      gl!.enableVertexAttribArray(position);
      gl!.vertexAttribPointer(position, 2, gl!.FLOAT, false, 0, 0);
      uniforms = {
        resolution: gl!.getUniformLocation(program, 'u_resolution'),
        time: gl!.getUniformLocation(program, 'u_time'),
        density: gl!.getUniformLocation(program, 'u_density'),
        finaleColor: gl!.getUniformLocation(program, 'u_finale_color'),
        finaleTint: gl!.getUniformLocation(program, 'u_finale_tint'),
      };
      canvas.style.visibility = settings.enabled ? '' : 'hidden';
    } catch {
      release();
      canvas.style.visibility = 'hidden';
    } finally {
      shaders.forEach(shader => gl!.deleteShader(shader));
    }
  }

  function paint() {
    if (!uniforms || lost || disposed) return;
    gl!.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl!.uniform1f(uniforms.time, elapsed);
    gl!.uniform1f(uniforms.density, settings.strength / 100 * 1.55);
    gl!.uniform1f(uniforms.finaleTint, tint ? 1 : 0);
    // Keep the image's hue, with brightness suitable for subtle smoke over black.
    const tintScale = tint ? .5 / Math.max(1, ...tint) : 0;
    gl!.uniform3f(uniforms.finaleColor, (tint?.[0] ?? 0) * tintScale, (tint?.[1] ?? 0) * tintScale, (tint?.[2] ?? 0) * tintScale);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.drawArrays(gl!.TRIANGLES, 0, 6);
  }

  function running() { return active && settings.enabled && settings.speed > 0 && !motion.matches && !document.hidden && !lost && !disposed && Boolean(uniforms); }

  function draw(now: number) {
    frame = 0;
    if (!running()) return;
    // Advance time independently of the FPS limit so a lower limit doesn't slow the smoke.
    if (previousAnimationTime !== null) elapsed += Math.min((now - previousAnimationTime) / 1000, .1) * (.15 + settings.speed / 100 * 1.7);
    previousAnimationTime = now;
    if (previousTime === null || now - previousTime >= 1000 / settings.fps) {
      previousTime = now;
      paint();
    }
    frame = requestAnimationFrame(draw);
  }

  function refresh() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = null;
    previousAnimationTime = null;
    if (running()) frame = requestAnimationFrame(draw);
  }

  function resize() {
    const mobile = matchMedia('(max-width: 700px), (pointer: coarse)').matches;
    // Soft noise needs little resolution; cap the longest edge to reduce GPU work.
    const scale = Math.min(devicePixelRatio || 1, (mobile ? 720 : 960) * settings.quality / 100 / Math.max(innerWidth, innerHeight));
    canvas.width = Math.max(1, Math.round(innerWidth * scale));
    canvas.height = Math.max(1, Math.round(innerHeight * scale));
    gl!.viewport(0, 0, canvas.width, canvas.height);
    if (!running()) paint();
  }

  function onContextLost(event: Event) {
    event.preventDefault();
    lost = true;
    refresh();
  }

  function onContextRestored() {
    lost = false;
    initialize();
    resize();
    refresh();
  }

  initialize();
  resize(); // Compile and draw the first frame during startup loading.
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', refresh);
  motion.addEventListener('change', refresh);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  return {
    setActive(value: boolean) { active = value; refresh(); },
    setTint(value: SmokeTint | null) { tint = value; paint(); },
    setSettings(value: SmokeSettings) {
      const qualityChanged = settings.quality !== value.quality;
      const timingChanged = settings.fps !== value.fps || settings.speed !== value.speed || settings.enabled !== value.enabled;
      settings = { ...value };
      canvas.style.visibility = settings.enabled && uniforms ? '' : 'hidden';
      if (qualityChanged) resize();
      if (settings.enabled && !lost && !disposed) paint();
      if (timingChanged) refresh();
    },
    destroy() {
      disposed = true;
      refresh();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', refresh);
      motion.removeEventListener('change', refresh);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      release();
    },
  };
}
