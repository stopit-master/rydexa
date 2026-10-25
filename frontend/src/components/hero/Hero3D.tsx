'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCcw } from 'lucide-react';
import { useAppMotion } from '@/lib/motionPreference';
import { LAND_RINGS } from '@/data/worldLand';

/**
 * Illustrative mobility hubs. Coordinates are real city centres, but the
 * demand values are deliberately synthetic and the globe is labelled
 * "illustrative" everywhere. No live fleet telemetry, no fabricated
 * model predictions.
 */
interface Hub {
  id: string;
  name: string;
  region: string;
  district: string;
  lat: number;
  lon: number;
  demand: number; // 0..1, illustrative intensity only
}

const HUBS: Hub[] = [
  { id: 'nyc', name: 'New York', region: 'North America', district: 'Hudson Yards', lat: 40.71, lon: -74.01, demand: 0.94 },
  { id: 'lon', name: 'London', region: 'Europe', district: 'South Bank', lat: 51.5, lon: -0.12, demand: 0.86 },
  { id: 'par', name: 'Paris', region: 'Europe', district: 'Seine Corridor', lat: 48.86, lon: 2.35, demand: 0.72 },
  { id: 'ber', name: 'Berlin', region: 'Europe', district: 'Mitte', lat: 52.52, lon: 13.4, demand: 0.61 },
  { id: 'tok', name: 'Tokyo', region: 'Asia-Pacific', district: 'Shibuya', lat: 35.68, lon: 139.69, demand: 0.89 },
  { id: 'sin', name: 'Singapore', region: 'Asia-Pacific', district: 'Marina Bay', lat: 1.35, lon: 103.82, demand: 0.8 },
  { id: 'sfo', name: 'San Francisco', region: 'North America', district: 'Embarcadero', lat: 37.77, lon: -122.42, demand: 0.68 },
  { id: 'sao', name: 'São Paulo', region: 'South America', district: 'Paulista', lat: -23.55, lon: -46.63, demand: 0.57 },
  { id: 'syd', name: 'Sydney', region: 'Asia-Pacific', district: 'Circular Quay', lat: -33.87, lon: 151.21, demand: 0.54 },
];

const CORRIDORS: Array<[string, string]> = [
  ['nyc', 'lon'],
  ['lon', 'par'],
  ['par', 'ber'],
  ['nyc', 'sfo'],
  ['sfo', 'tok'],
  ['tok', 'sin'],
  ['sin', 'syd'],
  ['sao', 'nyc'],
];

const GLOBE_RADIUS = 2.15;

function latLonToVector(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

interface GlobePalette {
  ocean: [number, number, number];
  land: [number, number, number];
  coast: [number, number, number];
  rim: [number, number, number];
  rimStrength: number;
  exposure: number;
  graticule: number;
  graticuleOpacity: number;
  equator: number;
  equatorOpacity: number;
  atmosphere: [number, number, number];
  atmosphereStrength: number;
  arcs: number;
  nodes: number;
}

const GLOBE_PALETTES: Record<'dark' | 'light', GlobePalette> = {
  dark: {
    ocean: [0.012, 0.014, 0.018],
    land: [0.165, 0.175, 0.195],
    coast: [0.43, 0.45, 0.48],
    rim: [0.34, 0.58, 0.12],
    rimStrength: 0.62,
    exposure: 1.18,
    graticule: 0x4c4c56,
    graticuleOpacity: 0.24,
    equator: 0xc2f84f,
    equatorOpacity: 0.2,
    atmosphere: [0.76, 0.97, 0.31],
    atmosphereStrength: 0.5,
    arcs: 0xc2f84f,
    nodes: 0xd6ff7a,
  },
  light: {
    ocean: [0.925, 0.928, 0.905],
    land: [0.155, 0.162, 0.178],
    coast: [0.52, 0.53, 0.51],
    rim: [0.28, 0.36, 0.14],
    rimStrength: 0.22,
    exposure: 1.0,
    graticule: 0x9a9a94,
    graticuleOpacity: 0.34,
    equator: 0x6f9410,
    equatorOpacity: 0.3,
    atmosphere: [0.36, 0.45, 0.16],
    atmosphereStrength: 0.22,
    arcs: 0x6f9410,
    nodes: 0x6f9410,
  },
};

/**
 * Rasterises the Natural Earth rings into a monochrome equirectangular mask.
 * White = land, black = ocean, grey = coastline. Colours are mixed in the
 * globe shader so the same mask serves both themes.
 */
function makeEarthTexture(size: number): THREE.CanvasTexture {
  const width = size;
  const height = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgb(158,158,158)';
  ctx.lineWidth = Math.max(1, width / 1100);
  ctx.lineJoin = 'round';

  for (const ring of LAND_RINGS) {
    ctx.beginPath();
    for (let i = 0; i < ring.length; i += 2) {
      const x = ((ring[i] + 180) / 360) * width;
      const y = ((90 - ring[i + 1]) / 180) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** Orthographic projection used by the no-WebGL fallback globe. */
const STATIC_CENTER = { lon: -35, lat: 22, radius: 150, cx: 200, cy: 200 };

function projectOrtho(lat: number, lon: number) {
  const rad = Math.PI / 180;
  const phi = lat * rad;
  const lambda = (lon - STATIC_CENTER.lon) * rad;
  const phi0 = STATIC_CENTER.lat * rad;
  const cosPhi = Math.cos(phi);
  const visibility =
    Math.cos(phi0) * cosPhi * Math.cos(lambda) + Math.sin(phi0) * Math.sin(phi);
  return {
    x: STATIC_CENTER.cx + STATIC_CENTER.radius * cosPhi * Math.sin(lambda),
    y:
      STATIC_CENTER.cy -
      STATIC_CENTER.radius *
        (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * cosPhi * Math.cos(lambda)),
    visible: visibility > 0.02,
  };
}

const STATIC_LAND_PATHS: string[] = (() => {
  const paths: string[] = [];
  for (const ring of LAND_RINGS) {
    let open = false;
    let d = '';
    for (let i = 0; i < ring.length; i += 2) {
      const p = projectOrtho(ring[i + 1], ring[i]);
      if (!p.visible) {
        open = false;
        continue;
      }
      d += `${open ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      open = true;
    }
    if (d) paths.push(`${d}Z`);
  }
  return paths;
})();


function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!window.WebGLRenderingContext || !gl) return false;
    // Release the probe context immediately; the renderer creates its own.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function makeGlowTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(226, 255, 168, 1)');
  gradient.addColorStop(0.22, 'rgba(194, 248, 79, 0.85)');
  gradient.addColorStop(0.55, 'rgba(194, 248, 79, 0.22)');
  gradient.addColorStop(1, 'rgba(194, 248, 79, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function makeRingTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.strokeStyle = 'rgba(194, 248, 79, 0.95)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(194, 248, 79, 0.25)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 12, 0, Math.PI * 2);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const Hero3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const resetViewRef = useRef<() => void>(() => {});
  const selectHubRef = useRef<(hubId: string | null) => void>(() => {});
  const fullMotion = useAppMotion();
  const [webglAvailable] = useState<boolean>(() =>
    typeof document === 'undefined' ? false : supportsWebGL()
  );
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<Hub | null>(null);

  useEffect(() => {
    if (!webglAvailable || !containerRef.current) return;
    const container = containerRef.current;

    const lowPower =
      (navigator.hardwareConcurrency || 8) <= 4 ||
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined &&
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
    camera.position.set(0, 0.55, 6.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !lowPower,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(lowPower ? 1 : Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'pan-y';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    globeGroup.rotation.set(0.16, -0.7, 0);
    scene.add(globeGroup);

    // ---------- Globe body ----------
    // Real Natural Earth coastlines rasterised into an equirectangular mask,
    // then shaded with a cheap key-light + fresnel shader (no post-processing).
    const palette = GLOBE_PALETTES[
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    ];
    const earthTexture = makeEarthTexture(lowPower ? 1024 : 2048);
    earthTexture.anisotropy = Math.min(
      lowPower ? 2 : 4,
      renderer.capabilities.getMaxAnisotropy()
    );

    const sphereGeometry = new THREE.SphereGeometry(
      GLOBE_RADIUS,
      lowPower ? 48 : 72,
      lowPower ? 32 : 48
    );
    const sphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: earthTexture },
        uOcean: { value: new THREE.Color(...palette.ocean) },
        uLand: { value: new THREE.Color(...palette.land) },
        uCoast: { value: new THREE.Color(...palette.coast) },
        uRim: { value: new THREE.Color(...palette.rim) },
        uRimStrength: { value: palette.rimStrength },
        uExposure: { value: palette.exposure },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        uniform sampler2D map;
        uniform vec3 uOcean;
        uniform vec3 uLand;
        uniform vec3 uCoast;
        uniform vec3 uRim;
        uniform float uRimStrength;
        uniform float uExposure;
        void main() {
          float mask = texture2D(map, vUv).r;
          float landMask = smoothstep(0.30, 0.62, mask);
          float coast = smoothstep(0.30, 0.55, mask) * (1.0 - smoothstep(0.55, 0.82, mask));
          vec3 surface = mix(uOcean, uLand, landMask);
          surface = mix(surface, uCoast, coast * 0.45);

          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float key = clamp(dot(normal, normalize(vec3(-0.5, 0.55, 0.7))), 0.0, 1.0);
          float shade = 0.6 + key * 0.52;
          float fresnel = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), 3.0);
          vec3 color = surface * shade * uExposure + uRim * fresnel * uRimStrength;
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    globeGroup.add(sphere);

    // ---------- Latitude / longitude graticule ----------
    const graticulePoints: number[] = [];
    const pushSegment = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const a = latLonToVector(lat1, lon1, GLOBE_RADIUS * 1.001);
      const b = latLonToVector(lat2, lon2, GLOBE_RADIUS * 1.001);
      graticulePoints.push(a.x, a.y, a.z, b.x, b.y, b.z);
    };
    const ringSegments = lowPower ? 64 : 96;
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let i = 0; i < ringSegments; i++) {
        const lon1 = (i / ringSegments) * 360 - 180;
        const lon2 = ((i + 1) / ringSegments) * 360 - 180;
        pushSegment(lat, lon1, lat, lon2);
      }
    }
    for (let lon = -180; lon < 180; lon += 30) {
      for (let i = 0; i < ringSegments; i++) {
        const lat1 = (i / ringSegments) * 180 - 90;
        const lat2 = ((i + 1) / ringSegments) * 180 - 90;
        pushSegment(lat1, lon, lat2, lon);
      }
    }
    const graticuleGeometry = new THREE.BufferGeometry();
    graticuleGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(graticulePoints, 3)
    );
    const graticuleMaterial = new THREE.LineBasicMaterial({
      color: palette.graticule,
      transparent: true,
      opacity: palette.graticuleOpacity,
    });
    const graticule = new THREE.LineSegments(graticuleGeometry, graticuleMaterial);
    globeGroup.add(graticule);

    // Equator accent.
    const equatorPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      equatorPoints.push(latLonToVector(0, (i / 128) * 360 - 180, GLOBE_RADIUS * 1.002));
    }
    const equatorGeometry = new THREE.BufferGeometry().setFromPoints(equatorPoints);
    const equatorMaterial = new THREE.LineBasicMaterial({
      color: palette.equator,
      transparent: true,
      opacity: palette.equatorOpacity,
    });
    globeGroup.add(new THREE.Line(equatorGeometry, equatorMaterial));

    // ---------- Atmosphere rim ----------
    const atmosphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.055, 48, 32);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uAtmosphere: { value: new THREE.Color(...palette.atmosphere) },
        uAtmosphereStrength: { value: palette.atmosphereStrength },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 uAtmosphere;
        uniform float uAtmosphereStrength;
        void main() {
          float intensity = pow(max(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.4);
          gl_FragColor = vec4(uAtmosphere, 1.0) * intensity * uAtmosphereStrength;
        }
      `,
    });
    globeGroup.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));

    // ---------- Hubs ----------
    const glowTexture = makeGlowTexture();
    const ringTexture = makeRingTexture();
    const nodeMeshes: THREE.Mesh[] = [];
    const hitMeshes: THREE.Mesh[] = [];
    const hubVectors = new Map<string, THREE.Vector3>();
    const hubById = new Map(HUBS.map((h) => [h.id, h]));

    HUBS.forEach((hub) => {
      const position = latLonToVector(hub.lat, hub.lon, GLOBE_RADIUS * 1.008);
      hubVectors.set(hub.id, position);

      const nodeRadius = 0.03 + hub.demand * 0.03;
      const nodeGeometry = new THREE.SphereGeometry(nodeRadius, 16, 16);
      const nodeMaterial = new THREE.MeshBasicMaterial({
        color: palette.nodes,
        transparent: true,
        opacity: 0.78 + hub.demand * 0.22,
      });
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.copy(position);
      node.userData.hubId = hub.id;
      globeGroup.add(node);
      nodeMeshes.push(node);

      // Invisible, generous hit target so mouse and touch selection is easy.
      const hitGeometry = new THREE.SphereGeometry(0.09, 10, 10);
      const hitMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const hitMesh = new THREE.Mesh(hitGeometry, hitMaterial);
      hitMesh.position.copy(position);
      hitMesh.userData.hubId = hub.id;
      globeGroup.add(hitMesh);
      hitMeshes.push(hitMesh);

      const glowMaterial = new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 0.5 + hub.demand * 0.4,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const glowSprite = new THREE.Sprite(glowMaterial);
      glowSprite.position.copy(position);
      const glowScale = 0.16 + hub.demand * 0.14;
      glowSprite.scale.set(glowScale, glowScale, 1);
      globeGroup.add(glowSprite);
    });

    // Selection ring (hidden until a hub is picked).
    const selectionRing = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: ringTexture,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      })
    );
    selectionRing.scale.set(0.24, 0.24, 1);
    selectionRing.visible = false;
    globeGroup.add(selectionRing);

    // ---------- Curved corridors + travelling demand pulses ----------
    const arcItems: Array<{
      line: THREE.Line;
      material: THREE.LineBasicMaterial;
      curve: THREE.QuadraticBezierCurve3;
      from: string;
      to: string;
    }> = [];
    const pulses: Array<{ sprite: THREE.Sprite; curve: THREE.QuadraticBezierCurve3; offset: number; speed: number }> = [];

    CORRIDORS.forEach(([fromId, toId], index) => {
      const start = hubVectors.get(fromId);
      const end = hubVectors.get(toId);
      if (!start || !end) return;

      const mid = start.clone().add(end).multiplyScalar(0.5).normalize();
      const distance = start.distanceTo(end);
      mid.multiplyScalar(GLOBE_RADIUS + 0.18 + distance * 0.16);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);

      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(lowPower ? 28 : 48));
      const material = new THREE.LineBasicMaterial({
        color: palette.arcs,
        transparent: true,
        opacity: 0.3,
      });
      const line = new THREE.Line(geometry, material);
      globeGroup.add(line);
      arcItems.push({ line, material, curve, from: fromId, to: toId });

      const pulseMaterial = new THREE.SpriteMaterial({
        map: glowTexture,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const pulse = new THREE.Sprite(pulseMaterial);
      pulse.scale.set(0.075, 0.075, 1);
      const pulseOffset = (index / CORRIDORS.length) * 0.8;
      // Place pulses on their curves immediately, so the static reduced-motion
      // frame never shows them stacked at the globe's centre.
      pulse.position.copy(curve.getPoint(pulseOffset));
      globeGroup.add(pulse);
      pulses.push({
        sprite: pulse,
        curve,
        offset: pulseOffset,
        speed: lowPower ? 0.055 : 0.075,
      });
    });

    // ---------- Sizing ----------
    const baseCameraZ = 6.5;
    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      const aspect = width / height;
      camera.aspect = aspect;
      // Portrait screens would crop the sphere horizontally: back the camera
      // off just enough for the globe body to fit.
      const vFov = (camera.fov * Math.PI) / 180;
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
      const fitZ = (GLOBE_RADIUS * 1.03) / Math.sin(Math.min(vFov, hFov) / 2);
      camera.position.z = Math.max(baseCameraZ, fitZ);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
    };
    resize();

    // ---------- Pointer interaction ----------
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const parallaxTarget = { x: 0, y: 0 };
    const parallax = { x: 0, y: 0 };
    let selectedId: string | null = null;
    let focusYaw = -0.7;
    let isDragging = false;
    let dragMoved = false;
    let dragStart = { x: 0, y: 0 };

    const renderOnce = () => renderer.render(scene, camera);

    const applyTheme = () => {
      const nextPalette = GLOBE_PALETTES[
        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      ];
      (sphereMaterial.uniforms.uOcean.value as THREE.Color).setRGB(...nextPalette.ocean);
      (sphereMaterial.uniforms.uLand.value as THREE.Color).setRGB(...nextPalette.land);
      (sphereMaterial.uniforms.uCoast.value as THREE.Color).setRGB(...nextPalette.coast);
      (sphereMaterial.uniforms.uRim.value as THREE.Color).setRGB(...nextPalette.rim);
      sphereMaterial.uniforms.uRimStrength.value = nextPalette.rimStrength;
      sphereMaterial.uniforms.uExposure.value = nextPalette.exposure;

      (atmosphereMaterial.uniforms.uAtmosphere.value as THREE.Color).setRGB(
        ...nextPalette.atmosphere
      );
      atmosphereMaterial.uniforms.uAtmosphereStrength.value = nextPalette.atmosphereStrength;

      graticuleMaterial.color.setHex(nextPalette.graticule);
      graticuleMaterial.opacity = nextPalette.graticuleOpacity;
      equatorMaterial.color.setHex(nextPalette.equator);
      equatorMaterial.opacity = nextPalette.equatorOpacity;
      arcItems.forEach((arc) => arc.material.color.setHex(nextPalette.arcs));
      nodeMeshes.forEach((node) => {
        (node.material as THREE.MeshBasicMaterial).color.setHex(nextPalette.nodes);
      });

      if (!running) renderOnce();
    };

    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    window.addEventListener('rydexa-theme-change', applyTheme);

    /** Wrap-aware shortest angular distance, so selection never spins the long way. */
    const yawDelta = (from: number, to: number) => {
      let d = (to - from) % (Math.PI * 2);
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      return d;
    };

    const applySelection = (hubId: string | null) => {
      selectedId = hubId;
      const hub = hubId ? hubById.get(hubId) : undefined;
      setSelected(hub ?? null);

      nodeMeshes.forEach((node) => {
        const nodeHub = hubById.get(node.userData.hubId);
        const isSelected = nodeHub?.id === hubId;
        node.scale.setScalar(isSelected ? 1.85 : 1);
        (node.material as THREE.MeshBasicMaterial).opacity = isSelected
          ? 1
          : 0.78 + (nodeHub?.demand ?? 0.5) * 0.22;
      });

      arcItems.forEach((arc) => {
        const connected = !hubId || arc.from === hubId || arc.to === hubId;
        arc.material.opacity = !hubId ? 0.3 : connected ? 0.62 : 0.07;
      });

      if (hub && hubVectors.has(hub.id)) {
        const hubPosition = hubVectors.get(hub.id)!;
        selectionRing.position.copy(hubPosition);
        selectionRing.visible = true;
        // Bring the selected hub to the front of the globe.
        focusYaw = Math.atan2(-hubPosition.x, hubPosition.z);
        if (!running) {
          globeGroup.rotation.y += yawDelta(globeGroup.rotation.y, focusYaw);
        }
      } else {
        selectionRing.visible = false;
        focusYaw = globeGroup.rotation.y;
      }

      // Always paint immediately so selection feedback is visible even when
      // the animation loop is paused (reduced motion / off-screen).
      renderOnce();
    };

    const resetView = () => {
      globeGroup.rotation.set(0.16, -0.7, 0);
      parallaxTarget.x = 0;
      parallaxTarget.y = 0;
      parallax.x = 0;
      parallax.y = 0;
      applySelection(null);
    };
    resetViewRef.current = resetView;
    selectHubRef.current = (hubId) => applySelection(hubId);

    const pointerFromEvent = (event: PointerEvent | MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      parallaxTarget.x = pointerNdc.x * 0.16;
      parallaxTarget.y = pointerNdc.y * 0.1;
    };

    const pick = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      globeGroup.updateMatrixWorld(true);
      const hits = raycaster.intersectObjects(hitMeshes, false);
      const cameraDirection = camera.position.clone().normalize();

      const visibleHit = hits.find((hit) => {
        const world = new THREE.Vector3();
        hit.object.getWorldPosition(world);
        // Front hemisphere only: skip nodes hidden behind the globe.
        return world.normalize().dot(cameraDirection) > 0.12;
      });

      if (visibleHit) {
        const hubId = visibleHit.object.userData.hubId as string;
        applySelection(hubId === selectedId ? null : hubId);
      } else {
        applySelection(null);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerFromEvent(event);
      if (isDragging) {
        const dx = event.clientX - dragStart.x;
        const dy = event.clientY - dragStart.y;
        if (Math.abs(dx) + Math.abs(dy) > 5) dragMoved = true;
        if (dragMoved) {
          globeGroup.rotation.y += dx * 0.0045;
          focusYaw = globeGroup.rotation.y;
          globeGroup.rotation.x = Math.max(
            -0.55,
            Math.min(0.55, globeGroup.rotation.x + dy * 0.003)
          );
          dragStart = { x: event.clientX, y: event.clientY };
          if (!running) renderOnce();
        }      }
    };

    const onPointerDown = (event: PointerEvent) => {
      isDragging = true;
      dragMoved = false;
      dragStart = { x: event.clientX, y: event.clientY };
      (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (isDragging && !dragMoved) pick(event);
      isDragging = false;
      (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
    };

    const onPointerLeave = () => {
      isDragging = false;
      parallaxTarget.x = 0;
      parallaxTarget.y = 0;
    };

    // ---------- Animation lifecycle ----------
    let rafId = 0;
    let running = false;
    let lastFrame = 0;
    const startTime = performance.now();
    const minFrameMs = lowPower ? 1000 / 30 : 1000 / 60;

    const tick = (now: number) => {
      if (!running) return;
      rafId = requestAnimationFrame(tick);

      const delta = Math.min((now - lastFrame) / 1000, 0.05);
      if (now - lastFrame < minFrameMs) return;
      lastFrame = now;

      // Auto rotation with pointer parallax; pause while a hub is selected so
      // the focused hub stays in view.
      if (!isDragging) {
        if (selectedId) {
          const d = yawDelta(globeGroup.rotation.y, focusYaw);
          if (Math.abs(d) > 0.0015) {
            globeGroup.rotation.y += d * Math.min(1, delta * 3.5);
          }
        } else {
          globeGroup.rotation.y += delta * 0.075;
        }
      }
      parallax.x += (parallaxTarget.x - parallax.x) * 0.045;
      parallax.y += (parallaxTarget.y - parallax.y) * 0.045;
      camera.position.x = parallax.x;
      camera.position.y = 0.55 + parallax.y;
      camera.lookAt(0, 0, 0);

      // Travelling demand pulses.
      const elapsed = (now - startTime) / 1000;
      pulses.forEach((pulse) => {
        const t = (pulse.offset + elapsed * pulse.speed) % 1;
        pulse.sprite.position.copy(pulse.curve.getPoint(t));
        pulse.sprite.material.opacity = 0.35 + Math.sin(t * Math.PI) * 0.65;
      });

      // Gentle breathing on the selected hub.
      if (selectedId) {
        selectionRing.scale.setScalar(0.24 + Math.sin(elapsed * 2.4) * 0.012);
      }

      renderer.render(scene, camera);
    };

    const start = () => {
      if (running || !fullMotion) return;
      running = true;
      lastFrame = performance.now();
      rafId = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(rafId);
    };

    let inView = true;
    const onVisibility = () => {
      if (document.hidden || !inView) stop();
      else start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        if (!inView) stop();
        else start();
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const handleResize = () => {
      resize();
      if (!running) renderOnce();
    };
    window.addEventListener('resize', handleResize);

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);

    if (fullMotion) {
      start();
    } else {
      // Respect reduced motion: a single static frame, interaction still works.
      renderOnce();
    }
    setReady(true);

    return () => {
      stop();
      observer.disconnect();
      themeObserver.disconnect();
      window.removeEventListener('rydexa-theme-change', applyTheme);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);

      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose();
      });
      glowTexture.dispose();
      ringTexture.dispose();
      earthTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [fullMotion, webglAvailable]);

  const activeHub = selected;

  return (
    <div className="relative w-full h-[420px] sm:h-[440px] lg:h-[clamp(300px,40vh,400px)] xl:h-[clamp(340px,44vh,440px)]">
      {/* Soft atmosphere behind the canvas — tinted per theme */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 55% at 50% 48%, var(--globe-glow) 0%, transparent 70%)',
        }}
      />

      {/* three.js canvas mount */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Top meta row */}
      <div className="absolute top-2 left-0 right-0 z-10 flex items-center justify-between gap-3 px-1 pointer-events-none">
        <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C2F84F] shadow-[0_0_8px_rgba(194,248,79,0.9)]" />
          Natural Earth · illustrative demand
        </div>
        <div className="hidden sm:block text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--muted)]/70 whitespace-nowrap">
          {HUBS.length} hubs · {CORRIDORS.length} corridors
        </div>
      </div>

      {/* Loading state */}
      {webglAvailable && !ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--muted)]">
            Initialising globe…
          </span>
        </div>
      )}

      {/* WebGL fallback — static SVG globe */}
      {webglAvailable === false && <StaticGlobeFallback />}

      {/* Reset — always top-right so it never collides with the inspector */}
      <button
        type="button"
        onClick={() => resetViewRef.current()}
        className="absolute top-8 right-0 z-20 inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-card)] backdrop-blur-xl px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.12em] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)] active:scale-95 transition-all"
        aria-label="Reset globe view and clear hub selection"
      >
        <RotateCcw className="w-3 h-3" />
        Reset
      </button>

      {/* Inspector overlay: compact bottom sheet on phones, card on larger screens */}
      <div className="absolute bottom-1 sm:bottom-auto sm:top-9 left-0 z-20 w-full sm:max-w-[290px] pointer-events-none">
        <div className="pointer-events-auto w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] backdrop-blur-xl p-2.5 sm:p-3.5 shadow-xl text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C2F84F]/12 border border-[#C2F84F]/30 px-2 py-0.5 text-[8.5px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--electric-lime-dark)]">
              <span className="w-1 h-1 rounded-full bg-[#C2F84F]" />
              Illustrative
            </span>
            <span className="hidden sm:inline text-[8.5px] font-mono uppercase tracking-[0.12em] text-[var(--muted)]/80">
              demo topology
            </span>
          </div>

          <label className="sr-only" htmlFor="hub-select">
            Inspect a mobility hub
          </label>
          <select
            id="hub-select"
            value={activeHub?.id ?? ''}
            onChange={(event) => selectHubRef.current(event.target.value || null)}
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[11px] text-[var(--foreground)] hover:border-[var(--border-strong)] focus:border-[#C2F84F]/60 transition-colors"
          >
            <option value="">Select a hub…</option>
            {HUBS.map((hub) => (
              <option key={hub.id} value={hub.id}>
                {hub.name}
              </option>
            ))}
          </select>

          {activeHub ? (
            <>
              <div className="mt-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--foreground)] truncate">{activeHub.name}</div>
                  <div className="text-[9.5px] text-[var(--muted)] truncate">
                    {activeHub.district} · {activeHub.region}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-mono font-semibold text-[var(--electric-lime-dark)] leading-none">
                    {Math.round(activeHub.demand * 100)}
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-[0.1em] text-[var(--muted)] mt-0.5">
                    demand index
                  </div>
                </div>
              </div>
              <div className="mt-2.5 h-1 w-full rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#C2F84F] transition-all duration-500"
                  style={{ width: `${Math.round(activeHub.demand * 100)}%` }}
                />
              </div>
              <p className="hidden sm:block mt-2 text-[8.5px] leading-relaxed text-[var(--muted)]">
                Illustrative hub intensity — not live fleet telemetry or a model prediction.
              </p>
            </>
          ) : (
            <p className="hidden sm:block mt-2 text-[9.5px] leading-relaxed text-[var(--muted)]">
              Select a hub to inspect its illustrative profile. Hub positions are illustrative — not
              live fleet telemetry or model output.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/** Polished static fallback when WebGL is unavailable — real coastlines, no shader. */
const StaticGlobeFallback: React.FC = () => {
  const hubs = HUBS.map((hub) => ({ ...hub, ...projectOrtho(hub.lat, hub.lon) }));
  const visible = new Map(hubs.map((hub) => [hub.id, hub]));
  const arcs = CORRIDORS.flatMap(([from, to]) => {
    const a = visible.get(from);
    const b = visible.get(to);
    if (!a?.visible || !b?.visible) return [];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 - Math.hypot(b.x - a.x, b.y - a.y) * 0.22;
    return [`M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`];
  });

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <svg
        viewBox="0 0 400 400"
        className="w-[300px] h-[300px] sm:w-[380px] sm:h-[380px]"
        role="img"
        aria-label="Static globe showing real Natural Earth coastlines with illustrative mobility hubs"
      >
        <defs>
          <clipPath id="globeClip">
            <circle cx="200" cy="200" r="149" />
          </clipPath>
          <radialGradient id="globeShade" cx="36%" cy="30%" r="78%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.10" />
            <stop offset="62%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.28" />
          </radialGradient>
        </defs>

        <circle
          cx="200"
          cy="200"
          r="150"
          fill="var(--surface-alt)"
          stroke="var(--border-strong)"
          strokeWidth="1"
        />
        <g clipPath="url(#globeClip)">
          {[120, 80, 40].map((rx) => (
            <ellipse
              key={`lat-${rx}`}
              cx="200"
              cy="200"
              rx={rx * 1.25}
              ry={rx * 0.32}
              fill="none"
              stroke="var(--border)"
              strokeWidth="0.8"
            />
          ))}
          {[150, 95, 42].map((rx) => (
            <ellipse
              key={`lon-${rx}`}
              cx="200"
              cy="200"
              rx={rx}
              ry="150"
              fill="none"
              stroke="var(--border)"
              strokeWidth="0.8"
            />
          ))}

          <g
            fill="#3A3C42"
            stroke="var(--muted)"
            strokeWidth="0.55"
            strokeLinejoin="round"
            opacity="0.96"
          >
            {STATIC_LAND_PATHS.map((d, index) => (
              <path key={index} d={d} />
            ))}
          </g>

          <circle cx="200" cy="200" r="150" fill="url(#globeShade)" pointerEvents="none" />

          {arcs.map((d, index) => (
            <path
              key={`arc-${index}`}
              d={d}
              fill="none"
              stroke="#C2F84F"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />
          ))}

          {hubs
            .filter((hub) => hub.visible)
            .map((hub) => (
              <g key={hub.id}>
                <circle cx={hub.x} cy={hub.y} r={5.5} fill="#C2F84F" opacity="0.16" />
                <circle cx={hub.x} cy={hub.y} r={2.4} fill="#C2F84F" opacity="0.95" />
              </g>
            ))}
        </g>

        <circle
          cx="200"
          cy="200"
          r="150"
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth="1"
        />
        <text
          x="200"
          y="388"
          textAnchor="middle"
          fill="var(--muted)"
          fontSize="8"
          fontFamily="monospace"
          letterSpacing="1.6"
        >
          STATIC PREVIEW · WEBGL UNAVAILABLE
        </text>
      </svg>
    </div>
  );
};
