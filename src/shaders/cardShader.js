import * as THREE from 'three';

export const CardVertexShader = /* glsl */ `
  uniform float uWaveProgress;
  uniform float uWaveIntensity;
  uniform vec2 uSquashStretch;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vWaveHeight;

  void main() {
    vUv = uv;
    
    vec3 pos = position;

    // Organic squash & stretch deformation to mesh vertices
    pos.x *= uSquashStretch.x;
    pos.y *= uSquashStretch.y;

    // Fluid jelly ripple: wave radiating outward from center
    vec2 centeredUv = uv - vec2(0.5);
    float dist = length(centeredUv);

    // Wave equation: propagates outward with damping
    float wavePhase = dist * 16.0 - uWaveProgress * 15.0;
    float envelope = exp(-uWaveProgress * 3.2) * exp(-dist * 1.4) * uWaveIntensity;
    
    // Primary 3D fluid wave ripple on Z
    float zWave = sin(wavePhase) * envelope * 0.24;
    
    // Gelatinous cross-ripple (jelly wobble)
    float jellyJiggle = sin(uWaveProgress * 20.0) * exp(-uWaveProgress * 4.2) * uWaveIntensity;
    float crossWave = cos(centeredUv.y * 6.28) * sin(centeredUv.x * 6.28) * jellyJiggle * 0.10;
    
    pos.z += zWave + crossWave;
    vWaveHeight = (zWave + crossWave) * 4.0;

    // Perturb normal for fluid specular refraction
    vec3 modifiedNormal = normal;
    if (uWaveIntensity > 0.01) {
      float dWdx = cos(wavePhase) * (centeredUv.x / max(dist, 0.001)) * envelope * 2.2;
      float dWdy = cos(wavePhase) * (centeredUv.y / max(dist, 0.001)) * envelope * 2.2;
      modifiedNormal.x -= dWdx;
      modifiedNormal.y -= dWdy;
      modifiedNormal = normalize(modifiedNormal);
    }

    vNormal = normalize(normalMatrix * modifiedNormal);
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const CardFragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform vec2 uAspect;          // Card plane dimensions e.g. vec2(1.88, 1.25)
  uniform vec2 uTexAspect;       // Texture pixel dimensions e.g. vec2(800.0, 533.0)
  uniform float uRadius;          // Corner radius normalized
  uniform float uOpacity;         // Base opacity
  uniform float uDepthFade;       // 0.45 at rear to 1.0 at front
  uniform float uBrightness;      // Overall brightness multiplier
  uniform float uHover;           // 0.0 to 1.0 hover state
  uniform float uDimmed;          // Dim factor when another card is focused
  uniform vec3 uRimColor;         // Subtle glass rim highlight
  uniform float uWaveProgress;    // Fluid wave progress
  uniform float uWaveIntensity;   // Fluid wave amplitude
  
  // Interactive Liquid Ripple Uniforms
  uniform vec2 uMouseUv;          // Cursor position in UV space
  uniform float uMouseVelocity;   // Cursor movement speed
  uniform float uMouseActive;     // 0.0 to 1.0 active state for fading
  uniform float uTime;            // Global time for wave propagation

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vWaveHeight;

  // Signed distance function for a 2D rounded box
  float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + vec2(r);
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  void main() {
    // Transform UV coordinates to aspect-ratio space centered at origin for SDF borders
    vec2 p = (vUv - 0.5) * uAspect;
    vec2 halfExtents = uAspect * 0.5;
    float cornerR = 0.0; // Sharp edges as requested

    float dist = sdRoundedBox(p, halfExtents, cornerR);

    // Reliable anti-aliased edge cutout across all platforms
    float edgeWidth = 0.007;
    float alphaMask = 1.0 - smoothstep(-edgeWidth, edgeWidth, dist);
    if (alphaMask <= 0.005) {
      discard;
    }

    // Mathematical object-fit: cover mapping to prevent any distortion or stretching
    float planeRatio = uAspect.x / max(uAspect.y, 0.0001);
    float texRatio = (uTexAspect.x > 0.0 && uTexAspect.y > 0.0) ? (uTexAspect.x / uTexAspect.y) : planeRatio;
    vec2 sampleUv = vUv;
    if (planeRatio > texRatio) {
      // Plane is wider than image: crop top and bottom
      float scale = texRatio / planeRatio;
      sampleUv.y = (vUv.y - 0.5) * scale + 0.5;
    } else {
      // Plane is taller than image: crop left and right
      float scale = planeRatio / texRatio;
      sampleUv.x = (vUv.x - 0.5) * scale + 0.5;
    }
    
    // Fluid wave refraction distortion on the poster surface (Modal Entrance)
    if (uWaveIntensity > 0.01) {
      float fluidRefract = sin(length(vUv - 0.5) * 16.0 - uWaveProgress * 15.0) * exp(-uWaveProgress * 3.5) * uWaveIntensity * 0.016;
      sampleUv += normalize(vUv - 0.5 + 0.001) * fluidRefract;
    }

    // Interactive Liquid Water Ripple (Hover / Cursor driven)
    if (uMouseActive > 0.001) {
      vec2 dir = sampleUv - uMouseUv;
      float dist = length(dir);
      
      // Calculate smooth propagation waves from cursor
      float baseWave = sin(dist * 35.0 - uTime * 12.0) * 0.5 + 0.5;
      float velocityWave = sin(dist * 45.0 - uTime * 20.0);
      
      // Smooth falloff expanding from cursor
      float falloff = smoothstep(0.45, 0.0, dist);
      
      // Combine base subtle wave with velocity-driven wave, but significantly reduced intensity
      float strength = (0.0015 + uMouseVelocity * 0.012) * uMouseActive * falloff;
      
      // Distort the UV coordinates gracefully
      sampleUv += normalize(dir + 0.0001) * (baseWave + velocityWave * 0.4) * strength;
    }

    sampleUv = clamp(sampleUv, 0.001, 0.999);

    vec4 texColor = texture2D(map, sampleUv);

    // Depth fade & brightness
    float depthFadeVal = clamp(uDepthFade, 0.45, 1.0);
    float brightness = (uBrightness + uHover * 0.15) * (0.8 + 0.2 * depthFadeVal);
    vec3 color = texColor.rgb * brightness;

    // Glistening fluid specular highlight along wave crests (Modal Entrance)
    if (uWaveIntensity > 0.01) {
      float crestGlint = clamp(vWaveHeight, 0.0, 1.0) * exp(-uWaveProgress * 2.8) * uWaveIntensity * 0.35;
      color += vec3(crestGlint);
    }

    // Dim factor when another item is selected
    float dimMultiplier = mix(1.0, 0.18, clamp(uDimmed, 0.0, 1.0));

    // Final alpha combines edge mask, depth fade, and state opacity
    float depthAlpha = mix(0.48, 1.0, depthFadeVal);
    float safeOpacity = clamp(uOpacity, 0.0, 1.0);
    float finalAlpha = texColor.a * alphaMask * safeOpacity * depthAlpha * dimMultiplier;
    if (finalAlpha <= 0.005) {
      discard;
    }

    gl_FragColor = vec4(color, finalAlpha);
  }
`;

/**
 * Creates an instance of the custom card shader material
 */
export function createCardMaterial(texture, aspect = [1.25, 1.88]) {
  return new THREE.ShaderMaterial({
    vertexShader: CardVertexShader,
    fragmentShader: CardFragmentShader,
    uniforms: {
      map: { value: texture },
      uAspect: { value: new THREE.Vector2(aspect[0], aspect[1]) },
      uTexAspect: { value: new THREE.Vector2(2.0, 3.0) },
      uRadius: { value: 0.075 }, // Elegant subtle rounding
      uOpacity: { value: 1.0 },
      uDepthFade: { value: 1.0 },
      uBrightness: { value: 1.0 },
      uHover: { value: 0.0 },
      uDimmed: { value: 0.0 },
      uRimColor: { value: new THREE.Color('#e0e4ec') },
      uWaveProgress: { value: 0.0 },
      uWaveIntensity: { value: 0.0 },
      uSquashStretch: { value: new THREE.Vector2(1.0, 1.0) },
      uMouseUv: { value: new THREE.Vector2(0.5, 0.5) },
      uMouseVelocity: { value: 0.0 },
      uMouseActive: { value: 0.0 },
      uTime: { value: 0.0 }
    },
    transparent: true,
    depthWrite: true,
    depthTest: true,
    side: THREE.DoubleSide
  });
}
