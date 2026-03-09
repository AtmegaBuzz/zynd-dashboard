"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface MonolithProps {
  triggerSelector: string;
  scrollStart?: string;
  scrollEnd?: string;
}

const VERTEX_SHADER = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewDirection;
varying vec3 vLocalPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vLocalPosition = position;

  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vViewDirection = normalize(cameraPosition - worldPos.xyz);

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

// Voronoi crack pattern + fresnel rim + scroll-driven fracture glow
const FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
uniform float uProgress;
uniform float uCrackWidth;
uniform float uGlowIntensity;
uniform float uFresnelPower;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewDirection;
varying vec3 vLocalPosition;

// Hash for Voronoi
vec3 hash3(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 74.7)),
    dot(p, vec3(269.5, 183.3, 246.1)),
    dot(p, vec3(113.5, 271.9, 124.6))
  );
  return fract(sin(p) * 43758.5453123);
}

// 3D Voronoi — returns (distance to nearest edge, distance to nearest cell center)
vec2 voronoi(vec3 p) {
  vec3 n = floor(p);
  vec3 f = fract(p);

  float distToCenter = 8.0;
  float distToEdge = 8.0;

  for (int k = -1; k <= 1; k++)
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++) {
    vec3 g = vec3(float(i), float(j), float(k));
    vec3 o = hash3(n + g);
    vec3 r = g + o - f;
    float d = dot(r, r);
    if (d < distToCenter) {
      distToCenter = d;
    }
  }

  distToCenter = sqrt(distToCenter);

  // Second pass for edges
  for (int k = -1; k <= 1; k++)
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++) {
    vec3 g = vec3(float(i), float(j), float(k));
    vec3 o = hash3(n + g);
    vec3 r = g + o - f;
    float d = dot(r, r);

    for (int kk = -1; kk <= 1; kk++)
    for (int jj = -1; jj <= 1; jj++)
    for (int ii = -1; ii <= 1; ii++) {
      vec3 g2 = vec3(float(ii), float(jj), float(kk));
      if (g2 == g) continue;
      vec3 o2 = hash3(n + g2);
      vec3 r2 = g2 + o2 - f;

      float edgeDist = dot(0.5 * (r + r2), normalize(r2 - r));
      distToEdge = min(distToEdge, edgeDist);
    }
  }

  return vec2(distToEdge, distToCenter);
}

void main() {
  // Base obsidian color — near black with warm undertone
  vec3 obsidian = vec3(0.02, 0.04, 0.03);

  // Fresnel rim light — orange-red edge glow
  vec3 accent = vec3(0.0, 1.0, 0.4);
  float fresnel = pow(1.0 - max(dot(vViewDirection, vNormal), 0.0), uFresnelPower);
  vec3 rimLight = accent * fresnel * 1.2;

  // Voronoi crack pattern at two scales for detail
  vec3 crackCoord = vLocalPosition * 2.5;
  vec2 v1 = voronoi(crackCoord);
  vec2 v2 = voronoi(crackCoord * 1.8 + 3.7);

  // Combine scales
  float crackLine = min(v1.x, v2.x * 0.7);

  // Crack threshold widens with scroll progress
  float crackThreshold = uCrackWidth;
  float crack = 1.0 - smoothstep(0.0, crackThreshold, crackLine);

  // Crack glow — accent energy bleeding through fractures
  float glowFalloff = 1.0 - smoothstep(0.0, crackThreshold * 3.0, crackLine);
  vec3 crackGlow = accent * crack * uGlowIntensity * 2.0;
  vec3 crackAmbient = accent * glowFalloff * uGlowIntensity * 0.3;

  // Subtle pulsing in the cracks
  float pulse = 0.8 + 0.2 * sin(uTime * 2.0 + v1.y * 6.28);
  crackGlow *= pulse;

  // Surface highlight — subtle specular on the obsidian
  vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
  float spec = pow(max(dot(reflect(-lightDir, vNormal), vViewDirection), 0.0), 32.0);
  vec3 specular = vec3(0.08, 0.25, 0.15) * spec;

  // Combine
  vec3 color = obsidian + rimLight + specular + crackGlow + crackAmbient;

  // Alpha: solid surface with glowing edges
  float alpha = 0.95 + fresnel * 0.05;

  gl_FragColor = vec4(color, alpha);
}
`;

function createMonolithGeometry(): THREE.BufferGeometry {
  // Slightly tapered box — wider at base, narrower at top
  const width = 1.6;
  const height = 2.4;
  const depth = 0.5;
  const taper = 0.92;

  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;
  const twHalf = (width * taper) / 2;
  const tdHalf = (depth * taper) / 2;

  // 8 vertices: bottom 4, top 4 (tapered)
  const vertices = new Float32Array([
    // Front face (bottom-left, bottom-right, top-right, top-left)
    -hw, -hh, hd,     hw, -hh, hd,     twHalf, hh, tdHalf,    -twHalf, hh, tdHalf,
    // Back face
    hw, -hh, -hd,     -hw, -hh, -hd,   -twHalf, hh, -tdHalf,  twHalf, hh, -tdHalf,
    // Top face
    -twHalf, hh, tdHalf,  twHalf, hh, tdHalf,  twHalf, hh, -tdHalf,  -twHalf, hh, -tdHalf,
    // Bottom face
    -hw, -hh, -hd,    hw, -hh, -hd,    hw, -hh, hd,           -hw, -hh, hd,
    // Right face
    hw, -hh, hd,      hw, -hh, -hd,    twHalf, hh, -tdHalf,   twHalf, hh, tdHalf,
    // Left face
    -hw, -hh, -hd,    -hw, -hh, hd,    -twHalf, hh, tdHalf,   -twHalf, hh, -tdHalf,
  ]);

  const indices = new Uint16Array([
    0,1,2, 0,2,3,       // front
    4,5,6, 4,6,7,       // back
    8,9,10, 8,10,11,    // top
    12,13,14, 12,14,15, // bottom
    16,17,18, 16,18,19, // right
    20,21,22, 20,22,23, // left
  ]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();

  return geo;
}

export function Monolith({
  triggerSelector,
  scrollStart = "top top",
  scrollEnd = "bottom 75%",
}: MonolithProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const progressRef = useRef(0);

  const geometry = useMemo(() => createMonolithGeometry(), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uCrackWidth: { value: 0.01 },
      uGlowIntensity: { value: 0 },
      uFresnelPower: { value: 3.0 },
    }),
    []
  );

  useEffect(() => {
    const state = { value: 0 };
    const tween = gsap.to(state, {
      value: 1,
      ease: "none",
      scrollTrigger: {
        trigger: triggerSelector,
        start: scrollStart,
        end: scrollEnd,
        scrub: 1.6,
      },
      onUpdate: () => {
        progressRef.current = state.value;
      },
    });

    return () => {
      tween.kill();
    };
  }, [triggerSelector, scrollStart, scrollEnd]);

  useFrame(({ clock }) => {
    if (!groupRef.current || !materialRef.current) return;

    const progress = progressRef.current;
    const t = clock.elapsedTime;
    const mat = materialRef.current;

    mat.uniforms.uTime.value = t;
    mat.uniforms.uProgress.value = progress;

    // Phase 1 (0-0.3): monolith fades in, slight rotation begins
    const fadeIn = Math.min(1, progress / 0.3);

    // Phase 2 (0.2-0.7): cracks appear and widen
    const crackPhase = Math.max(0, Math.min(1, (progress - 0.2) / 0.5));
    mat.uniforms.uCrackWidth.value = 0.005 + crackPhase * 0.08;
    mat.uniforms.uGlowIntensity.value = crackPhase * 1.5;

    // Phase 3 (0.6-1.0): full glow, dramatic rotation
    const dramaticPhase = Math.max(0, Math.min(1, (progress - 0.6) / 0.4));
    mat.uniforms.uFresnelPower.value = 3.0 - dramaticPhase * 1.0;

    // Scale: grow in during fade
    const scale = fadeIn * 1.0;
    groupRef.current.scale.setScalar(scale);

    // Rotation: slow Y rotation + slight X tilt
    groupRef.current.rotation.y = progress * Math.PI * 0.6 + Math.sin(t * 0.3) * 0.05;
    groupRef.current.rotation.x = Math.sin(progress * Math.PI * 0.5) * 0.15;
    groupRef.current.rotation.z = Math.sin(t * 0.2) * 0.02;

    // Opacity via scale (invisible at 0)
    groupRef.current.visible = progress > 0.005;
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={VERTEX_SHADER}
          fragmentShader={FRAGMENT_SHADER}
          uniforms={uniforms}
          transparent
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
