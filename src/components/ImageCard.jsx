import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createCardMaterial } from '../shaders/cardShader';
import { createFallbackCardTexture } from '../utils/placeholderTexture';
import { getEntranceProgress } from '../utils/mathSphere';
import { sounds } from './AudioEffects';

const scratchVec3 = new THREE.Vector3();
const scratchCamPos = new THREE.Vector3();
const scratchTargetPos = new THREE.Vector3();
const scratchGlobePos = new THREE.Vector3();
const scratchLinePos = new THREE.Vector3();
const scratchQuat = new THREE.Quaternion();
const scratchCamQuat = new THREE.Quaternion();
const scratchGlobeQuat = new THREE.Quaternion();
const scratchLineQuat = new THREE.Quaternion();
const scratchTargetQuat = new THREE.Quaternion();
const scratchTwistQuat = new THREE.Quaternion();
const scratchEuler = new THREE.Euler(0, 0, 0, 'YXZ');

export const ImageCard = React.memo(function ImageCard({
  movie,
  project, // fallback alias
  initialData,
  totalCards = 48,
  layoutProgressRef,
  lineScrollRef,
  layoutMode = 'globe',
  theme = 'dark',
  sphereRadius,
  cardDimensions, // [width, height] in 2:3 vertical
  isHovered,
  isSelected,
  isAnySelected,
  activeCategory,
  entranceProgress, // 0 to 1
  onHover,
  onUnhover,
  onClick,
  geometry
}) {
  const currentMovie = movie || project;
  const meshRef = useRef();
  const groupRef = useRef();
  const basePosition = useMemo(() => new THREE.Vector3(...initialData.position), [initialData.position]);
  const normal = useMemo(() => new THREE.Vector3(...initialData.normal), [initialData.normal]);
  const radialQuat = useMemo(() => new THREE.Quaternion(...initialData.radialQuaternion), [initialData.radialQuaternion]);
  
  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false;
  }, []);

  // Initial neutral dark card texture (2:3 aspect)
  const blankTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 6;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, 4, 6);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  const material = useMemo(() => {
    return createCardMaterial(blankTexture, cardDimensions);
  }, [blankTexture, cardDimensions]);

  // Use the movie's poster field directly as the Three.js texture source
  useEffect(() => {
    let isCancelled = false;
    const posterUrl = currentMovie?.poster || currentMovie?.imageUrl;
    if (!posterUrl) {
      const fallbackTex = createFallbackCardTexture(currentMovie);
      material.uniforms.uTexAspect.value.set(500, 750);
      material.uniforms.map.value = fallbackTex;
      material.needsUpdate = true;
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    loader.load(
      posterUrl,
      (loadedTexture) => {
        if (!isCancelled && meshRef.current) {
          loadedTexture.colorSpace = THREE.SRGBColorSpace;
          loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
          loadedTexture.generateMipmaps = true;

          // Dynamically detect natural poster dimensions (2:3 vertical)
          const img = loadedTexture.image;
          if (img && img.width && img.height) {
            material.uniforms.uTexAspect.value.set(img.width, img.height);
          }

          material.uniforms.map.value = loadedTexture;
          material.needsUpdate = true;
        }
      },
      undefined,
      (err) => {
        // "If a poster fails to load, display a dark fallback card containing the movie title and year rather than a broken image icon."
        if (!isCancelled && meshRef.current) {
          console.warn(`Poster load failed for ${currentMovie?.title}:`, err?.message || 'Network');
          const fallbackTex = createFallbackCardTexture(currentMovie);
          material.uniforms.uTexAspect.value.set(500, 750);
          material.uniforms.map.value = fallbackTex;
          material.needsUpdate = true;
        }
      }
    );

    return () => {
      isCancelled = true;
    };
  }, [currentMovie, material]);

  // Clean up materials & textures on unmount
  useEffect(() => {
    return () => {
      if (material) {
        if (material.uniforms?.map?.value) {
          material.uniforms.map.value.dispose?.();
        }
        material.dispose?.();
      }
      blankTexture.dispose?.();
    };
  }, [material, blankTexture]);

  // Keep plane aspect uniform in sync with responsive card dimensions
  useEffect(() => {
    if (material?.uniforms?.uAspect) {
      material.uniforms.uAspect.value.set(cardDimensions[0], cardDimensions[1]);
    }
  }, [cardDimensions, material]);

  // Sync rim highlight with light/dark theme in real time
  useEffect(() => {
    if (material?.uniforms?.uRimColor) {
      material.uniforms.uRimColor.value.set(theme === 'light' ? '#222226' : '#e0e4ec');
    }
  }, [theme, material]);

  // Category filter matching by Oscar era / decade
  const isCategoryMatch = useMemo(() => {
    if (!activeCategory || activeCategory === 'ALL') return true;
    const y = currentMovie?.year;
    if (activeCategory === '2020s') return y >= 2020;
    if (activeCategory === '2010s') return y >= 2010 && y < 2020;
    if (activeCategory === '2000s') return y >= 2000 && y < 2010;
    if (activeCategory === '1990s') return y >= 1990 && y < 2000;
    if (activeCategory === 'CLASSICS') return y < 1990;
    return true;
  }, [activeCategory, currentMovie?.year]);

  // Staggered entrance offset per card (0 to 0.4)
  const staggerDelay = useMemo(() => (initialData.index / 50) * 0.35, [initialData.index]);

  // Fluid Jelly Spring Animation State
  const wasSelectedRef = useRef(false);
  const jellySpringRef = useRef({
    startTime: 0,
    active: false,
    startPos: new THREE.Vector3(),
    startQuat: new THREE.Quaternion(),
    hasCapturedStart: false
  });

  // Interactive Cursor Ripple State
  const pointerState = useRef({
    uv: new THREE.Vector2(0.5, 0.5),
    targetUv: new THREE.Vector2(0.5, 0.5),
    velocity: 0.0,
    active: 0.0,
    targetActive: 0.0
  });

  // Trigger fluid jelly pop when card is selected or switched in modal
  useEffect(() => {
    if (isSelected) {
      if (!wasSelectedRef.current || !jellySpringRef.current.active) {
        jellySpringRef.current.active = true;
        jellySpringRef.current.startTime = performance.now();
        jellySpringRef.current.hasCapturedStart = false;
        try {
          sounds?.playFluidPop?.();
        } catch {}
      }
    } else {
      jellySpringRef.current.active = false;
      jellySpringRef.current.hasCapturedStart = false;
    }
    wasSelectedRef.current = isSelected;
  }, [isSelected, currentMovie]);

  // Per-frame physics, orientation, and depth updates
  useFrame((state, delta) => {
    if (!meshRef.current || !groupRef.current) return;

    const lerpSpeed = (isSelected || isAnySelected ? 9.5 : 7.0) * Math.min(delta, 0.05);

    // 1. Scene Entrance Expansion Math:
    const currentProgress = getEntranceProgress(entranceProgress);
    const rawT = THREE.MathUtils.clamp((currentProgress - staggerDelay) / Math.max(1 - staggerDelay, 0.01), 0, 1);
    const entranceEase = 1 - Math.pow(1 - rawT, 3); // cubic out
    const currentRadiusFactor = 0.85 + 0.15 * entranceEase;

    // 2. Position, Orientation, and Scale Calculation
    let wrapX = 0;
    let cardT = 0;

    if (isSelected) {
      const now = performance.now();
      if (!jellySpringRef.current.hasCapturedStart && groupRef.current) {
        jellySpringRef.current.startPos.copy(groupRef.current.position);
        jellySpringRef.current.startQuat.copy(groupRef.current.quaternion);
        jellySpringRef.current.hasCapturedStart = true;
      }

      const elapsed = Math.max(0, (now - (jellySpringRef.current.startTime || now)) / 1000);

      // In focus mode: card moves in front towards camera center, slightly elevated to clear bottom details
      const worldCamTarget = new THREE.Vector3(0, 0.05, 8.4);
      scratchTargetPos.copy(worldCamTarget);
      if (groupRef.current.parent) {
        groupRef.current.parent.worldToLocal(scratchTargetPos);
      }

      // Look straight at camera in sphere local coordinates
      state.camera.getWorldPosition(scratchCamPos);
      if (groupRef.current.parent) {
        groupRef.current.parent.worldToLocal(scratchCamPos);
      }

      const lookDir = new THREE.Vector3().subVectors(scratchCamPos, scratchTargetPos);
      if (lookDir.lengthSq() > 0.0001) lookDir.normalize();
      else lookDir.set(0, 0, 1);

      const upDir = new THREE.Vector3(0, 1, 0);
      let rightDir = new THREE.Vector3().crossVectors(upDir, lookDir);
      if (rightDir.lengthSq() > 0.0001) rightDir.normalize();
      else rightDir.set(1, 0, 0);

      const realUp = new THREE.Vector3().crossVectors(lookDir, rightDir).normalize();
      const lookMat = new THREE.Matrix4().makeBasis(rightDir, realUp, lookDir);
      scratchTargetQuat.setFromRotationMatrix(lookMat);

      // --- ELASTIC FLUID JELLY DYNAMICS ---
      // Damped harmonic oscillator for the fluid wave flight:
      // Overshoots forward at t ~ 0.38s, rebounds softly, settles at 1.0
      const omega = 6.8;
      const zeta = 3.2;
      const springDecay = Math.exp(-zeta * elapsed);
      let fluidProgress = 1.0 - springDecay * Math.cos(omega * elapsed);
      fluidProgress = THREE.MathUtils.clamp(fluidProgress, 0.0, 1.25);

      // Fluid parabolic wave lift (surges outward into 3D space during travel)
      const liftArc = Math.sin(Math.min(elapsed / 0.85, 1.0) * Math.PI) * 1.1;

      // Interpolate from start position to focal target using fluid spring
      scratchVec3.lerpVectors(jellySpringRef.current.startPos, scratchTargetPos, Math.min(fluidProgress, 1.0));
      // Apply forward wave surge & parabolic lift
      scratchVec3.z += (fluidProgress - 1.0) * 1.2 + liftArc * 0.45;
      scratchVec3.y += liftArc * 0.25;

      // Gentle buoyant liquid breathing when suspended in focus
      const idleTime = state.clock.getElapsedTime();
      const idleFloatY = Math.sin(idleTime * 1.6) * 0.038;
      const idleFloatZ = Math.cos(idleTime * 1.3) * 0.022;
      scratchVec3.y += idleFloatY;
      scratchVec3.z += idleFloatZ;

      groupRef.current.position.lerp(scratchVec3, lerpSpeed * 1.4);

      // Organic fluid tilt & jelly wobble roll
      const wobbleZ = Math.sin(elapsed * 13.0) * 0.09 * springDecay;
      const wobbleX = Math.cos(elapsed * 10.0) * 0.05 * springDecay;
      const idleRoll = Math.sin(idleTime * 1.2) * 0.008;

      scratchEuler.set(wobbleX, 0, wobbleZ + idleRoll, 'YXZ');
      scratchTwistQuat.setFromEuler(scratchEuler);
      scratchTargetQuat.multiply(scratchTwistQuat);

      groupRef.current.quaternion.slerp(scratchTargetQuat, lerpSpeed * 1.6);

      // Squash and stretch scale bounce:
      const baseFinalScale = 1.78 * (0.8 + 0.2 * entranceEase);
      const scaleBounce = 1.0 + Math.sin(elapsed * 8.5) * 0.18 * springDecay;
      const curTargetScale = baseFinalScale * scaleBounce;
      groupRef.current.scale.lerp(scratchVec3.set(curTargetScale, curTargetScale, curTargetScale), lerpSpeed * 1.3);

      // Vertex squash & stretch: stretch vertically while traveling, squash horizontally upon impact
      let sqX = 1.0;
      let sqY = 1.0;
      if (elapsed < 0.35) {
        const stretchT = Math.sin((elapsed / 0.35) * Math.PI);
        sqY += stretchT * 0.16;
        sqX -= stretchT * 0.08;
      } else if (elapsed < 0.78) {
        const squashT = Math.sin(((elapsed - 0.35) / 0.43) * Math.PI);
        sqY -= squashT * 0.13;
        sqX += squashT * 0.09;
      }
      // Damped harmonic jelly jiggle
      const jiggle = Math.sin(elapsed * 17.0) * 0.065 * springDecay;
      sqY += jiggle;
      sqX -= jiggle * 0.7;

      if (material?.uniforms?.uSquashStretch) {
        material.uniforms.uSquashStretch.value.set(sqX, sqY);
      }

      // Propagate 3D fluid wave ripple across poster surface in shader
      if (material?.uniforms?.uWaveProgress) {
        material.uniforms.uWaveProgress.value = Math.min(elapsed / 1.2, 1.0);
      }
      if (material?.uniforms?.uWaveIntensity) {
        material.uniforms.uWaveIntensity.value = Math.max(0.0, (1.0 - elapsed / 1.35) * Math.exp(-elapsed * 1.5));
      }
    } else if (isAnySelected) {
      // Push background cards inward towards center of sphere and away from focal card
      scratchTargetPos.copy(basePosition).multiplyScalar(currentRadiusFactor * 0.65);
      groupRef.current.position.lerp(scratchTargetPos, lerpSpeed);

      const targetScale = 0.55 * (0.8 + 0.2 * entranceEase);
      groupRef.current.scale.lerp(scratchVec3.set(targetScale, targetScale, targetScale), lerpSpeed);

      if (material?.uniforms?.uSquashStretch) {
        material.uniforms.uSquashStretch.value.set(1.0, 1.0);
      }
      if (material?.uniforms?.uWaveIntensity) {
        material.uniforms.uWaveIntensity.value = 0.0;
      }
    } else {
      // --- Normal Browsing: Blend between Globe and Curved Horizontal Line Ribbon ---

      // A. Curved Horizontal Ribbon Coordinates (Line mode)
      const lineScroll = lineScrollRef?.current ?? 0;
      const spacing = 2.05;
      const totalWidth = totalCards * spacing;

      const rawX = initialData.index * spacing - lineScroll;
      wrapX = ((((rawX + totalWidth / 2) % totalWidth) + totalWidth) % totalWidth) - totalWidth / 2;

      // Concave cylindrical panoramic arch (exactly matching attached reference image)
      const arcRadius = 11.2;
      const theta = wrapX / arcRadius;
      const lineX = arcRadius * Math.sin(theta);
      const lineZ = arcRadius * Math.cos(theta) - arcRadius + 7.85;

      // Downward parabolic curvature on wings for the dynamic ribbon effect
      const lineY = -0.0135 * (wrapX * wrapX);

      scratchLinePos.set(lineX, lineY, lineZ);
      if (isHovered && isCategoryMatch) {
        scratchLinePos.z += 0.35;
        scratchLinePos.y += 0.08;
      }

      // Line mode scale: center card is big (~1.48), wings shrink smoothly (~0.58)
      let lineScale = 0.58 + 0.90 * Math.exp(-Math.pow(wrapX / 4.6, 2));
      if (isHovered && isCategoryMatch) {
        lineScale *= 1.10;
      }
      if (!isCategoryMatch) {
        lineScale *= 0.82;
      }

      // Line mode orientation: tangents to the curved cylinder with subtle bank angle
      const rotY = -theta * 0.85;
      const rotZ = -wrapX * 0.018;
      const rotX = 0.03;
      scratchEuler.set(rotX, rotY, rotZ, 'YXZ');
      scratchLineQuat.setFromEuler(scratchEuler);

      // B. 3D Globe Coordinates
      scratchGlobePos.copy(basePosition).multiplyScalar(currentRadiusFactor);
      if (isHovered && isCategoryMatch) {
        scratchGlobePos.addScaledVector(normal, 0.55);
      }

      // Globe radial orientation with 22% camera billboard blend
      state.camera.getWorldPosition(scratchCamPos);
      if (groupRef.current.parent) {
        groupRef.current.parent.worldToLocal(scratchCamPos);
      }
      const toCam = new THREE.Vector3().subVectors(scratchCamPos, groupRef.current.position);
      if (toCam.lengthSq() > 0.0001) toCam.normalize();
      else toCam.set(0, 0, 1);

      const upVec = new THREE.Vector3(0, 1, 0);
      let camRight = new THREE.Vector3().crossVectors(upVec, toCam);
      if (camRight.lengthSq() > 0.0001) camRight.normalize();
      else camRight.set(1, 0, 0);

      const camUp = new THREE.Vector3().crossVectors(toCam, camRight).normalize();
      scratchCamQuat.setFromRotationMatrix(new THREE.Matrix4().makeBasis(camRight, camUp, toCam));
      scratchGlobeQuat.copy(radialQuat).slerp(scratchCamQuat, 0.22);

      let globeScale = 1.0;
      if (isHovered && isCategoryMatch) globeScale = 1.12;
      else if (!isCategoryMatch) globeScale = 0.88;

      // C. Beautiful Staggered Flight Transition ("one after another")
      const layoutProgress = layoutProgressRef?.current?.value ?? 0.0;
      const staggerRatio = 0.38;
      const cardStagger = (initialData.index / Math.max(totalCards, 1)) * staggerRatio;
      cardT = THREE.MathUtils.clamp(
        (layoutProgress - cardStagger) / Math.max(1 - staggerRatio, 0.01),
        0,
        1
      );

      // Smooth cubic ease for individual flight
      const easeT = cardT * cardT * (3 - 2 * cardT);

      // Parabolic 3D lift during flight (lifts outward into 3D space)
      const flightArc = Math.sin(easeT * Math.PI);

      // Blend position with outward flight arc
      scratchTargetPos.lerpVectors(scratchGlobePos, scratchLinePos, easeT);
      if (flightArc > 0.001) {
        scratchTargetPos.addScaledVector(normal, flightArc * 1.55);
      }

      // Blend orientation with subtle flight bank
      scratchQuat.copy(scratchGlobeQuat).slerp(scratchLineQuat, easeT);
      if (flightArc > 0.001) {
        const twistAngle = flightArc * 0.22 * (initialData.index % 2 === 0 ? 1 : -1);
        scratchTwistQuat.setFromAxisAngle(normal, twistAngle);
        scratchQuat.multiply(scratchTwistQuat);
      }

      // Blend scale
      let targetScale = THREE.MathUtils.lerp(globeScale, lineScale, easeT);
      targetScale *= (0.8 + 0.2 * entranceEase);

      groupRef.current.position.lerp(scratchTargetPos, lerpSpeed);
      groupRef.current.quaternion.slerp(scratchQuat, lerpSpeed);
      groupRef.current.scale.lerp(scratchVec3.set(targetScale, targetScale, targetScale), lerpSpeed);

      if (material?.uniforms?.uSquashStretch) {
        material.uniforms.uSquashStretch.value.set(1.0, 1.0);
      }
      if (material?.uniforms?.uWaveIntensity) {
        material.uniforms.uWaveIntensity.value = 0.0;
      }
    }

    // 3. World Depth Calculation for Material Depth Modulation
    groupRef.current.getWorldPosition(scratchVec3);
    const globeDepth = THREE.MathUtils.clamp(
      (scratchVec3.z + sphereRadius * 0.9) / (sphereRadius * 1.8),
      0.0,
      1.0
    );
    const lineDepth = THREE.MathUtils.clamp(
      (scratchVec3.z - 1.2) / 6.8,
      0.15,
      1.0
    );
    const depthRatio = THREE.MathUtils.lerp(globeDepth, lineDepth, cardT);
    material.uniforms.uDepthFade.value = depthRatio;

    // Hover uniform lerp
    const targetHover = (isHovered && isCategoryMatch && !isSelected) ? 1.0 : 0.0;
    material.uniforms.uHover.value = THREE.MathUtils.lerp(
      material.uniforms.uHover.value,
      targetHover,
      lerpSpeed
    );

    // Dimmed uniform when another item is selected
    const targetDim = (isAnySelected && !isSelected) ? 1.0 : (!isCategoryMatch ? 0.75 : 0.0);
    material.uniforms.uDimmed.value = THREE.MathUtils.lerp(
      material.uniforms.uDimmed.value,
      targetDim,
      lerpSpeed
    );

    // 4. Opacity & Line Mode Edge Fade
    // In Line mode, seamlessly fade cards wrapping around the edges
    const lineEdgeFade = 1.0 - THREE.MathUtils.smoothstep(Math.abs(wrapX), 9.2, 12.6);
    const currentEdgeFade = THREE.MathUtils.lerp(1.0, lineEdgeFade, cardT);

    const targetOpacity = isSelected
      ? 1.0
      : (isAnySelected ? 0.0 : currentEdgeFade * Math.max(entranceEase, 0.95));

    material.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      material.uniforms.uOpacity.value,
      targetOpacity,
      lerpSpeed * 1.5
    );

    // Visibility and renderOrder
    if (meshRef.current) {
      meshRef.current.visible = isSelected || !isAnySelected || material.uniforms.uOpacity.value > 0.01;
      const curScale = groupRef.current.scale.x;
      meshRef.current.renderOrder = isSelected ? 100 : Math.round(10 + curScale * 10);
    }

    // 5. Interactive Cursor Ripple Update
    if (!prefersReducedMotion && material.uniforms.uMouseUv) {
      const stateDelta = Math.min(delta, 0.1);
      
      // Smooth fade in/out of the liquid effect
      pointerState.current.active = THREE.MathUtils.lerp(
        pointerState.current.active,
        pointerState.current.targetActive,
        stateDelta * 3.0
      );
      
      if (pointerState.current.active > 0.001) {
        // Compute velocity from distance moved
        const distMoved = pointerState.current.uv.distanceTo(pointerState.current.targetUv);
        const rawVel = distMoved / Math.max(stateDelta, 0.001);
        
        // Smoothly decay velocity so ripples have natural inertia
        pointerState.current.velocity = THREE.MathUtils.lerp(
          pointerState.current.velocity,
          rawVel,
          stateDelta * 6.0
        );
        
        // Follow cursor smoothly
        pointerState.current.uv.lerp(pointerState.current.targetUv, stateDelta * 10.0);
        
        material.uniforms.uMouseUv.value.copy(pointerState.current.uv);
        material.uniforms.uMouseVelocity.value = Math.min(pointerState.current.velocity, 15.0);
        material.uniforms.uMouseActive.value = pointerState.current.active;
      } else {
        material.uniforms.uMouseActive.value = 0.0;
        pointerState.current.velocity = 0.0;
      }
      
      // Global time for wave propagation
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group ref={groupRef} position={initialData.position}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        onPointerMove={(e) => {
          if (isAnySelected) return;
          if (!prefersReducedMotion && e.uv) {
            pointerState.current.targetUv.set(e.uv.x, e.uv.y);
            pointerState.current.targetActive = 1.0;
          }
        }}
        onPointerOver={(e) => {
          if (isAnySelected) return;
          e.stopPropagation();
          sounds.playHover();
          onHover?.(initialData.index);
          
          if (!prefersReducedMotion && e.uv) {
             pointerState.current.targetActive = 1.0;
             pointerState.current.uv.set(e.uv.x, e.uv.y);
             pointerState.current.targetUv.set(e.uv.x, e.uv.y);
          }
        }}
        onPointerOut={(e) => {
          if (isAnySelected) return;
          e.stopPropagation();
          onUnhover?.(initialData.index);
          
          pointerState.current.targetActive = 0.0;
        }}
        onClick={(e) => {
          e.stopPropagation();
          sounds.playClick();
          onClick?.(initialData.index);
        }}
        cursor={isSelected ? 'default' : 'pointer'}
      />
    </group>
  );
});
