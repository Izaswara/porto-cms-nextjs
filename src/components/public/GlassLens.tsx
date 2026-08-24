'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

/**
 * GlassLens — Interactive Glass Lens / Chromatic Glass Distortion,
 * versi reusable untuk semua foto & background portofolio.
 *
 * Shader WebGL (raw, tanpa library):
 *  - LENS REFRACTION       : kursor menjadi lensa kaca virtual — piksel
 *                            di sekitar kursor ditarik/membengkok.
 *  - LIQUID RIPPLE         : gerakan kursor meninggalkan gelombang air.
 *  - CHROMATIC ABERRATION  : kanal R/G/B dibelokkan beda skala — tepi
 *                            lensa memecah warna seperti pembiasan.
 *  - MICRO WAVES           : gelombang cair halus agar foto terasa hidup.
 *
 * Manajemen konteks WebGL (browser membatasi ~16 konteks aktif):
 *  - Konteks dibuat LAZY saat pertama kali terlihat di viewport.
 *  - Maksimal MAX_LENSES konteks hidup; sisanya otomatis fallback ke
 *    gambar statis — halaman tetap utuh tanpa efek.
 *  - Render hanya berjalan saat elemen terlihat & tab aktif.
 *  - Touch device / reduced-motion / WebGL gagal -> gambar statis.
 *
 * Pemakaian: pengganti langsung <Image fill> di dalam parent positioned.
 * Filter B&W dsb. cukup diberikan ke elemen PENDAMING (filter mewarisi
 * secara visual ke canvas maupun image).
 */

let liveLenses = 0;
const MAX_LENSES = 8;

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform vec2 u_img;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_active;
uniform float u_amp;
uniform vec4 u_r[6];

// cover-fit: gambar mengisi canvas tanpa distorsi (crop terpusat)
vec2 coverUv(vec2 uv) {
  float ca = u_res.x / u_res.y;
  float ia = u_img.x / u_img.y;
  vec2 s = ca > ia ? vec2(1.0, ia / ca) : vec2(ca / ia, 1.0);
  return 0.5 + (uv - 0.5) * s;
}

void main() {
  vec2 uv = v_uv;
  float ca = max(u_res.x / u_res.y, 0.0001);
  vec2 asp = vec2(ca, 1.0);

  // micro waves: cairan halus seluruh permukaan
  uv += vec2(sin(uv.y * 9.0 + u_time * 0.6), cos(uv.x * 9.0 - u_time * 0.5)) * 0.0018;

  // glass lens refraction di sekitar kursor
  vec2 d = (uv - u_mouse) * asp;
  float dist = length(d);
  vec2 dir = dist > 1e-4 ? d / dist : vec2(0.0);
  float lens = smoothstep(0.30, 0.0, dist) * 0.055 * u_active;

  // liquid ripple dari lintasan kursor
  float rip = 0.0;
  for (int i = 0; i < 6; i++) {
    vec4 r = u_r[i];
    if (r.w <= 0.0) continue;
    vec2 rd = (uv - r.xy) * asp;
    float rdist = length(rd);
    float rr = r.z * 0.45;
    float band = exp(-pow((rdist - rr) * 13.0, 2.0));
    rip += sin((rdist - rr) * 30.0) * band * exp(-r.z * 1.8) * r.w * 0.03;
  }

  vec2 off = dir * (lens + rip) * u_amp / asp;

  // chromatic aberration - pembiasan per kanal warna
  vec3 col;
  col.r = texture2D(u_tex, coverUv(uv + off * 1.14)).r;
  col.g = texture2D(u_tex, coverUv(uv + off * 1.00)).g;
  col.b = texture2D(u_tex, coverUv(uv + off * 0.88)).b;

  col = pow(col, vec3(1.05));
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export default function GlassLens({
  src,
  alt = '',
  sizes = '100vw',
  priority = false,
  intensity = 1,
}: {
  src: string;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  /** Skala kekuatan efek (1 = standar). */
  intensity?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !window.matchMedia('(pointer: fine)').matches ||
      liveLenses >= MAX_LENSES
    ) {
      setFallback(true);
      return;
    }

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) {
      setFallback(true);
      return;
    }
    // Konteks yang sudah lost (mis. sisa hot-reload) tak bisa dipakai —
    // fallback ke gambar statis supaya tidak muncul kotak kosong.
    if (gl.isContextLost()) {
      setFallback(true);
      return;
    }
    liveLenses++;

    // Browser membuang kontes tertua saat limit tercapai — degradasi
    // anggun ke gambar statis, jangan sampai kanvas hitam.
    const onCtxLost = (e: Event) => {
      e.preventDefault();
      setFallback(true);
      stopLoop();
    };
    canvas.addEventListener('webglcontextlost', onCtxLost);

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      setFallback(true);
      release();
      return;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFallback(true);
      release();
      return;
    }
    gl.useProgram(prog);

    // Quad fullscreen
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const U = {
      res: gl.getUniformLocation(prog, 'u_res'),
      img: gl.getUniformLocation(prog, 'u_img'),
      time: gl.getUniformLocation(prog, 'u_time'),
      mouse: gl.getUniformLocation(prog, 'u_mouse'),
      active: gl.getUniformLocation(prog, 'u_active'),
      amp: gl.getUniformLocation(prog, 'u_amp'),
      r: gl.getUniformLocation(prog, 'u_r'),
    };

    // Tekstur foto (Supabase storage public = CORS terbuka)
    const tex = gl.createTexture();
    let texReady = false;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      texReady = true;
      start();
    };
    img.onerror = () => {
      setFallback(true);
      stopLoop();
    };
    img.src = src;

    // State mouse / ripple / render-gate
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let visible = false;
    let raf = 0;
    let running = false;

    const mouse = { x: 0.5, y: 0.5 };
    const sm = { x: 0.5, y: 0.5 };
    let activeTarget = 0;
    let active = 0;
    let lastRipple = 0;
    const ripples = Array.from({ length: 6 }, () => ({ x: 0.5, y: 0.5, age: 99, str: 0 }));
    let rippleIdx = 0;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width * dpr));
      h = Math.max(1, Math.floor(rect.height * dpr));
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    };

    // Deteksi kursor secara GEOMETRIS via window listener — bukan listener
    // pada elemen. Penting untuk background berlapis (scrim/veil/konten
    // menutupi lensa di atasnya, event tidak pernah menyentuh host).
    const contains = (x: number, y: number) => {
      const r = host.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };

    const onMove = (e: PointerEvent) => {
      if (!contains(e.clientX, e.clientY)) {
        activeTarget = 0;
        return;
      }
      const r = host.getBoundingClientRect();
      activeTarget = 1;
      mouse.x = (e.clientX - r.left) / Math.max(1, r.width);
      mouse.y = 1 - (e.clientY - r.top) / Math.max(1, r.height);

      const now = performance.now();
      const speed = Math.abs(mouse.x - sm.x) + Math.abs(mouse.y - sm.y);
      if (now - lastRipple > 130 && speed > 0.012) {
        const rp = ripples[rippleIdx % 6];
        rp.x = mouse.x;
        rp.y = mouse.y;
        rp.age = 0;
        rp.str = Math.min(1.4, 0.5 + speed * 8);
        rippleIdx++;
        lastRipple = now;
      }
      start();
    };

    const onDown = (e: PointerEvent) => {
      if (!contains(e.clientX, e.clientY)) return;
      const r = host.getBoundingClientRect();
      const rp = ripples[rippleIdx % 6];
      rp.x = (e.clientX - r.left) / Math.max(1, r.width);
      rp.y = 1 - (e.clientY - r.top) / Math.max(1, r.height);
      rp.age = 0;
      rp.str = 1.5;
      rippleIdx++;
      start();
    };
    const onVisibility = () => {
      if (document.hidden) stopLoop();
      else start();
    };

    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(host);

    let prev = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;

      sm.x += (mouse.x - sm.x) * 0.09;
      sm.y += (mouse.y - sm.y) * 0.09;
      active += (activeTarget - active) * 0.07;

      if (texReady) {
        const flat = new Float32Array(24);
        for (let i = 0; i < 6; i++) {
          const r = ripples[i];
          r.age += dt;
          if (r.age > 2.6) r.str = 0;
          flat[i * 4] = r.x;
          flat[i * 4 + 1] = r.y;
          flat[i * 4 + 2] = r.age;
          flat[i * 4 + 3] = r.str;
        }
        gl.uniform2f(U.res, w, h);
        gl.uniform2f(U.img, img.naturalWidth || 1, img.naturalHeight || 1);
        gl.uniform1f(U.time, now / 1000);
        gl.uniform2f(U.mouse, sm.x, sm.y);
        gl.uniform1f(U.active, active);
        gl.uniform1f(U.amp, intensity);
        gl.uniform4fv(U.r, flat);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      if (visible && !document.hidden) raf = requestAnimationFrame(frame);
      else running = false;
    };

    const start = () => {
      if (!running && visible && !document.hidden) {
        running = true;
        prev = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const startLoop = start;
    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    function release() {
      liveLenses--;
    }

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        resize();
        if (visible) start();
        else stopLoop();
      },
      { threshold: 0.05 }
    );
    io.observe(host);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      io.disconnect();
      ro.disconnect();
      stopLoop();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onCtxLost);
      // TIDAK memanggil loseContext di sini: React StrictMode (dev) menjalankan
      // effect dua kali pada CANVAS YANG SAMA — kehilangan konteks membuat
      // render berikutnya kosong selamanya. Biarkan GC browser yang mendaur.
      release();
    };
  }, [src, intensity]);

  if (fallback) {
    return (
      <div ref={hostRef} className="absolute inset-0">
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover object-center" />
      </div>
    );
  }

  return (
    <div ref={hostRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" role="img" aria-label={alt} />
    </div>
  );
}
