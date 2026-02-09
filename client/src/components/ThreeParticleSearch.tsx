import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

// ------------------------------------
// Utilities
// ------------------------------------
const clamp = THREE.MathUtils.clamp;

const useReducedMotion = () => {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const on = () => setReduced(!!mq.matches);
        on();
        mq.addEventListener?.('change', on);
        return () => mq.removeEventListener?.('change', on);
    }, []);
    return reduced;
};

const generateSpherePoints = (count: number, radius: number): Float32Array => {
    const pts = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const u = i / count;
        const v = (i * 1.61803398875) % 1; // golden ratio spread
        const theta = 2 * Math.PI * v;
        const phi = Math.acos(1 - 2 * u);
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        pts[i * 3] = x;
        pts[i * 3 + 1] = y;
        pts[i * 3 + 2] = z;
    }
    return pts;
};

const generateTextPoints = (text: string, count: number, radius: number): Float32Array => {
    const canvas = document.createElement('canvas');
    const size = 1024;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new Float32Array(count * 3);

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = 'white';
    ctx.font = '900 310px "Amiri", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size / 2, size / 2);

    const data = ctx.getImageData(0, 0, size, size).data;
    const pixels: number[] = [];
    const step = 3;

    for (let y = 0; y < size; y += step) {
        for (let x = 0; x < size; x += step) {
            const idx = (y * size + x) * 4;
            if (data[idx] > 155) pixels.push(x, y);
        }
    }

    const out = new Float32Array(count * 3);
    const pc = Math.max(1, pixels.length / 2);

    for (let i = 0; i < count; i++) {
        const p = (i % pc) * 2;
        const px = pixels[p];
        const py = pixels[p + 1];

        const nx = px / size - 0.5;
        const ny = py / size - 0.5;

        out[i * 3] = nx * radius * 4.8;
        out[i * 3 + 1] = -ny * radius * 4.8;
        out[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
    }
    return out;
};

// ------------------------------------
// Premium Point Shader
// ------------------------------------
const vertexShader = `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uPointerPower;
  uniform float uShock;
  uniform vec3 uShockCenter;
  uniform float uMode;
  uniform float uReduced;

  attribute float aSeed;
  attribute float aSize;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vTwinkle;
  varying float vDist;

  void main() {
    vColor = aColor;

    vec3 p = position;

    float t = uTime * (0.7 + aSeed * 0.9);
    float wob = sin(t + aSeed * 6.2831) * 0.05;
    p.z += wob * (1.0 - uReduced);

    vDist = length(p);
    vTwinkle = 0.55 + 0.45 * sin(uTime * (1.8 + aSeed) + aSeed * 12.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);

    float size = aSize;
    size *= (300.0 / -mv.z);
    size *= (0.85 + 0.35 * vTwinkle);
    size *= (0.95 + 0.25 * uMode);

    size = clamp(size, 1.2, 5.5);

    gl_PointSize = size;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uMode;
  uniform float uReduced;

  varying vec3 vColor;
  varying float vTwinkle;
  varying float vDist;

  void main() {
    vec2 uv = gl_PointCoord.xy - 0.5;
    float r = length(uv);

    float core = smoothstep(0.35, 0.0, r);
    float halo = smoothstep(0.5, 0.2, r) * 0.55;
    float a = core + halo;

    float g = (sin((uv.x + uv.y + uTime) * 120.0) * 0.04) * (1.0 - uReduced);

    vec3 c = vColor * (0.45 + 0.35 * vTwinkle);

    float dim = 1.0 - smoothstep(18.0, 38.0, vDist);
    c *= (0.78 + 0.22 * dim);

    float alpha = clamp(a * 0.45 + g * 0.2, 0.0, 0.65);
    if (alpha < 0.02) discard;

    gl_FragColor = vec4(c, alpha);
  }
`;

// ------------------------------------
// Core System
// ------------------------------------
type Phase = 'idle' | 'scatter' | 'gather' | 'lock';

function EpicParticles({ text }: { text: string }) {
    const reduced = useReducedMotion();
    const { camera } = useThree();

    const count = 16000;
    const radius = 22;

    const sphere = useMemo(() => generateSpherePoints(count, radius), []);
    const targets = useMemo(() => {
        const t = (text || '').trim();
        return t ? generateTextPoints(t, count, radius) : sphere;
    }, [text, sphere]);

    const geoRef = useRef<THREE.BufferGeometry>(null);

    const posRef = useRef<Float32Array>(sphere.slice());
    const velRef = useRef<Float32Array>(new Float32Array(count * 3));

    const seeds = useMemo(() => {
        const a = new Float32Array(count);
        for (let i = 0; i < count; i++) a[i] = Math.random();
        return a;
    }, []);

    const sizes = useMemo(() => {
        const a = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const r = Math.random();
            a[i] = r > 0.94 ? 6.0 : r > 0.72 ? 4.8 : 3.9;
        }
        return a;
    }, []);

    const colors = useMemo(() => {
        const a = new Float32Array(count * 3);
        const c1 = new THREE.Color('#22d3ee');
        const c2 = new THREE.Color('#fbbf24');
        const c3 = new THREE.Color('#ffffff');
        for (let i = 0; i < count; i++) {
            const r = Math.random();
            const c = r > 0.93 ? c3 : r > 0.68 ? c2 : c1;
            const v = 0.08 * (Math.random() - 0.5);
            a[i * 3] = clamp(c.r + v, 0, 1);
            a[i * 3 + 1] = clamp(c.g + v, 0, 1);
            a[i * 3 + 2] = clamp(c.b + v, 0, 1);
        }
        return a;
    }, []);

    const phaseRef = useRef<{ phase: Phase; key: string; t0: number }>({
        phase: 'idle',
        key: '',
        t0: 0,
    });

    useEffect(() => {
        const key = (text || '').trim();
        const prev = phaseRef.current.key;
        if (key !== prev) {
            phaseRef.current.key = key;
            phaseRef.current.t0 = performance.now();
            phaseRef.current.phase = key ? 'scatter' : 'idle';
        }
    }, [text]);

    const shockRef = useRef({
        t: -999,
        center: new THREE.Vector3(0, 0, 0),
    });

    useEffect(() => {
        const onDown = (e: PointerEvent) => {
            const ndc = new THREE.Vector2(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1
            );
            const ray = new THREE.Raycaster();
            ray.setFromCamera(ndc, camera);
            const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
            const hit = new THREE.Vector3();
            ray.ray.intersectPlane(plane, hit);

            shockRef.current.center.copy(hit);
            shockRef.current.t = performance.now() / 1000;
        };

        window.addEventListener('pointerdown', onDown);
        return () => window.removeEventListener('pointerdown', onDown);
    }, [camera]);

    const matRef = useRef<THREE.ShaderMaterial>(null);
    const pointerWorld = useRef(new THREE.Vector3(0, 0, 0));

    const material = useMemo(() => {
        const m = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: {
                uTime: { value: 0 },
                uPointer: { value: new THREE.Vector2(0, 0) },
                uPointerPower: { value: 1 },
                uShock: { value: 0 },
                uShockCenter: { value: new THREE.Vector3(0, 0, 0) },
                uMode: { value: 0 },
                uReduced: { value: 0 },
            },
        });
        return m;
    }, []);

    useEffect(() => {
        matRef.current = material;
        return () => material.dispose();
    }, [material]);

    useFrame((state, delta) => {
        const geo = geoRef.current;
        const mat = matRef.current;
        if (!geo || !mat) return;

        const pos = posRef.current;
        const vel = velRef.current;
        const tgt = targets;

        const t = state.clock.getElapsedTime();
        const dt = clamp(delta, 0.0, 0.033);
        const hasText = !!(text || '').trim();

        const ph = phaseRef.current;
        const since = (performance.now() - ph.t0) / 1000;

        if (hasText) {
            if (ph.phase === 'scatter' && since > 0.22) ph.phase = 'gather';
            if (ph.phase === 'gather' && since > 0.95) ph.phase = 'lock';
        } else {
            ph.phase = 'idle';
        }

        // pointer world on z=0 plane
        {
            const ndc = new THREE.Vector2(state.pointer.x || 0, state.pointer.y || 0);
            const ray = new THREE.Raycaster();
            ray.setFromCamera(ndc, camera);
            const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
            ray.ray.intersectPlane(plane, pointerWorld.current);
        }

        const shockAge = t - shockRef.current.t;
        const shock = shockAge >= 0 && shockAge < 0.75 ? (1 - shockAge / 0.75) : 0;

        const gatherK = ph.phase === 'lock' ? 14 : ph.phase === 'gather' ? 10 : 6;
        const damp = ph.phase === 'scatter' ? 0.86 : ph.phase === 'lock' ? 0.88 : 0.90;

        const noiseAmp =
            reduced ? 0 : ph.phase === 'lock' ? 0.05 : hasText ? 0.10 : 0.22;

        const p = pointerWorld.current;
        const pointerRadius = hasText ? 10 : 14;
        const pointerStrength = hasText ? 20 : 26;

        const scatterBurst = (!reduced && ph.phase === 'scatter') ? (1 - clamp(since / 0.22, 0, 1)) : 0;

        for (let i = 0; i < count; i++) {
            const idx = i * 3;

            const x = pos[idx];
            const y = pos[idx + 1];
            const z = pos[idx + 2];

            const tx = tgt[idx];
            const ty = tgt[idx + 1];
            const tz = tgt[idx + 2];

            let ax = (tx - x) * gatherK;
            let ay = (ty - y) * gatherK;
            let az = (tz - z) * gatherK;

            if (!reduced) {
                const s = seeds[i];
                const w = Math.sin(t * (0.9 + s) + x * 0.08 + y * 0.06);
                const w2 = Math.cos(t * (0.7 + s) + x * 0.06 - z * 0.07);
                ax += w * noiseAmp;
                ay += w2 * noiseAmp;
                az += Math.sin(t * (0.6 + s) + y * 0.05) * noiseAmp * 0.55;
            }

            // pointer vortex
            {
                const dx = x - p.x;
                const dy = y - p.y;
                const d2 = dx * dx + dy * dy;

                if (d2 < pointerRadius * pointerRadius) {
                    const d = Math.sqrt(d2) + 1e-6;
                    const fall = 1 - d / pointerRadius;

                    const core = d < pointerRadius * 0.25 ? -1 : 1;

                    ax += (-dx / d) * pointerStrength * fall * core;
                    ay += (-dy / d) * pointerStrength * fall * core;

                    const tang = pointerStrength * 0.75 * fall;
                    ax += (-dy / d) * tang;
                    ay += (dx / d) * tang;

                    az += fall * 8.0;
                }
            }

            // shock ring
            if (shock > 0) {
                const cx = shockRef.current.center.x;
                const cy = shockRef.current.center.y;

                const dx = x - cx;
                const dy = y - cy;
                const d = Math.sqrt(dx * dx + dy * dy) + 1e-6;

                const ring = Math.exp(-Math.pow((d - 10.0 * (0.2 + (1 - shock))) / 4.0, 2.0));
                const impulse = ring * shock * 20.0;

                ax += (dx / d) * impulse;
                ay += (dy / d) * impulse;
                az += impulse * 0.7;
            }

            // scatter burst
            if (scatterBurst > 0) {
                const s = seeds[i];
                const burst = scatterBurst * (14 + 18 * s);
                ax += (x * 0.16 + Math.sin(s * 99.0) * 1.6) * burst;
                ay += (y * 0.16 + Math.cos(s * 77.0) * 1.6) * burst;
                az += (z * 0.16 + Math.sin(s * 55.0) * 1.6) * burst;
            }

            vel[idx] = (vel[idx] + ax * dt) * damp;
            vel[idx + 1] = (vel[idx + 1] + ay * dt) * damp;
            vel[idx + 2] = (vel[idx + 2] + az * dt) * damp;

            pos[idx] = x + vel[idx] * dt;
            pos[idx + 1] = y + vel[idx + 1] * dt;
            pos[idx + 2] = z + vel[idx + 2] * dt;
        }

        // update geometry attribute
        const attr = geo.attributes.position as THREE.BufferAttribute;
        attr.needsUpdate = true;

        // update uniforms
        mat.uniforms.uTime.value = t;
        mat.uniforms.uPointer.value.set(state.pointer.x || 0, state.pointer.y || 0);
        mat.uniforms.uPointerPower.value = hasText ? 1.0 : 0.75;
        mat.uniforms.uShock.value = shock;
        mat.uniforms.uShockCenter.value.copy(shockRef.current.center);
        mat.uniforms.uMode.value = hasText ? 1.0 : 0.0;
        mat.uniforms.uReduced.value = reduced ? 1.0 : 0.0;
    });

    return (
        <points frustumCulled={false}>
            <bufferGeometry ref={geoRef}>
                {/* ✅ FIX TS ERRORS: use args tuple instead of array/itemSize props */}
                <bufferAttribute attach="attributes-position" args={[posRef.current, 3]} />
                <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
                <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
                <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
            </bufferGeometry>
            <primitive object={material} attach="material" />
        </points>
    );
}

// ------------------------------------
// Full-bleed Component (no box / no border)
// ------------------------------------
export default function ThreeParticleSearch({ text }: { text: string }) {
    const reduced = useReducedMotion();
    const activeText = !!(text || '').trim();

    return (
        <section className="relative w-full min-h-[100vh] overflow-hidden bg-[#02040f]">
            {/* Cinematic layers */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_35%,rgba(34,211,238,0.18),transparent_62%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_60%_78%,rgba(251,191,36,0.12),transparent_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.12),rgba(0,0,0,0.62))]" />
                <div className="absolute inset-0 opacity-[0.055] mix-blend-soft-light [background:repeating-linear-gradient(to_bottom,rgba(255,255,255,0.35)_0px,rgba(255,255,255,0.35)_1px,transparent_3px,transparent_7px)]" />
            </div>

            {/* Canvas full-bleed */}
            <div className="absolute inset-0">
                <Canvas
                    dpr={reduced ? 1 : [1, 2]}
                    gl={{
                        antialias: true,
                        alpha: false,
                        powerPreference: 'high-performance',
                        toneMapping: THREE.ACESFilmicToneMapping,
                        toneMappingExposure: 0.55,
                    }}
                >
                    <color attach="background" args={['#02040f']} />
                    <PerspectiveCamera makeDefault position={[0, 0, 72]} fov={50} />
                    <fog attach="fog" args={['#02040f', 42, 170]} />

                    <ambientLight intensity={1.0} />
                    <directionalLight position={[10, 10, 10]} intensity={0.32} />

                    <Stars radius={155} depth={80} count={7200} factor={4} saturation={0} fade speed={0.6} />
                    <Sparkles count={320} size={4} scale={[70, 70, 70]} opacity={0.35} speed={0.55} color="#fbbf24" />

                    <EpicParticles text={text} />

                    <EffectComposer multisampling={0}>
                        <Bloom intensity={0.45} luminanceThreshold={0.65} luminanceSmoothing={0.12} mipmapBlur />
                        <Vignette eskil={false} offset={0.16} darkness={0.94} />
                        <Noise opacity={0.03} />
                    </EffectComposer>
                </Canvas>
            </div>

            {/* Minimal HUD (optional) — no box */}
            <div className="pointer-events-none relative z-10 mx-auto flex min-h-[100vh] max-w-6xl items-end px-6 pb-14 md:px-10">
                <div className="max-w-2xl">
                    <div className="text-white/92 text-3xl md:text-5xl font-semibold tracking-tight">
                        {activeText ? 'انفجار → تجمّع → تثبيت' : 'حرّك المؤشر… وانقر…'}
                    </div>
                    <div className="mt-3 text-white/58 text-sm md:text-base leading-relaxed">
                        المؤشر يصنع دوّامة جذب/طرد. النقر يولد موجة صدمة. تغيير النص يفعل Scatter ثم Gather ثم Lock.
                    </div>
                </div>
            </div>
        </section>
    );
}
