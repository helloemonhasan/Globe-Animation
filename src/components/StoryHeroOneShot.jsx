import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { generateSpherePositions } from '../utils/mathSphere';
import { movies } from '../data/movies';
import { sounds } from './AudioEffects';

// Global texture cache to prevent duplicate texture network loads
const textureCache = new Map();
const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin('anonymous');

function getTexture(url) {
  if (!url) return null;
  if (textureCache.has(url)) return textureCache.get(url);
  const tex = textureLoader.load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  textureCache.set(url, tex);
  return tex;
}

// Background Card Component on the Sphere
function BackgroundGlobeCard({ movie, position, quaternion, opacityRef }) {
  const meshRef = useRef();
  const [tex, setTex] = useState(null);

  useEffect(() => {
    if (!movie?.poster) return;
    let isCancelled = false;
    const loadedTex = getTexture(movie.poster);
    if (loadedTex && !isCancelled) {
      setTex(loadedTex);
    }
    return () => {
      isCancelled = true;
    };
  }, [movie?.poster]);

  useFrame(() => {
    if (!meshRef.current) return;
    const currentOpacity = opacityRef.current;
    if (currentOpacity <= 0.005) {
      meshRef.current.visible = false;
    } else {
      meshRef.current.visible = true;
      if (meshRef.current.material) {
        meshRef.current.material.opacity = currentOpacity;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position} quaternion={quaternion}>
      <planeGeometry args={[1.22, 1.83]} />
      <meshBasicMaterial
        map={tex}
        color={tex ? '#ffffff' : '#1e222d'}
        transparent
        depthWrite={false}
        opacity={0.95}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Root Scene handling camera, rotating globe, and the focal Birdman card
function OneShotScene({
  progressRef,
  birdmanTexture,
  sphereItems,
  birdmanIndex,
  targetItem
}) {
  const { camera, size } = useThree();
  const globeGroupRef = useRef();
  const birdmanMeshRef = useRef();
  const bgOpacityRef = useRef(0.95);

  const sphereRadius = 6.8;

  // Scratch objects to avoid per-frame garbage collection
  const sphereCardWorldPos = useMemo(() => new THREE.Vector3(), []);
  const baseCardQuat = useMemo(() => new THREE.Quaternion(...targetItem.radialQuaternion), [targetItem]);
  const flatQuat = useMemo(() => new THREE.Quaternion(0, 0, 0, 1), []);

  // Compute exact quaternion that rotates targetItem to directly face the camera at (0, 0, radius)
  const { qInitial, qTarget, frontFacingQuat } = useMemo(() => {
    const vNormal = new THREE.Vector3(...targetItem.normal).normalize();
    const targetDir = new THREE.Vector3(0, 0, 1);
    const qT = new THREE.Quaternion().setFromUnitVectors(vNormal, targetDir);
    const qInit = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.22, -0.55, 0));
    const frontQuat = baseCardQuat.clone().premultiply(qT);
    return { qInitial: qInit, qTarget: qT, frontFacingQuat: frontQuat };
  }, [targetItem, baseCardQuat]);

  useFrame(() => {
    const p = Math.max(0, Math.min(1.0, progressRef.current?.value || 0));

    if (!globeGroupRef.current || !birdmanMeshRef.current) return;

    // Camera is steady at (0, 0, 12.0)
    camera.position.set(0, 0, 12.0);
    camera.lookAt(0, 0, 0);

    // Compute exact 16:9 target size in world units at z = 0 (exact object-fit: cover math)
    const vFovRad = (camera.fov * Math.PI) / 180;
    const distToCenter = camera.position.z;
    const visibleHeight = 2 * Math.tan(vFovRad / 2) * distToCenter;
    const screenAspect = size.width / Math.max(size.height, 1);
    const visibleWidth = visibleHeight * screenAspect;
    const imgAspect = 16 / 9;

    let targetHeroW, targetHeroH;
    if (screenAspect > imgAspect) {
      targetHeroW = visibleWidth * 1.015;
      targetHeroH = targetHeroW / imgAspect;
    } else {
      targetHeroH = visibleHeight * 1.015;
      targetHeroW = targetHeroH * imgAspect;
    }

    // =========================================================================
    // PHASE 1: (0.00 -> 0.45) Small Globe expands and rotates to face Birdman
    // =========================================================================
    if (p < 0.45) {
      const t = p / 0.45;
      const ease = t * t * (3 - 2 * t); // Smoothstep curve

      // Scale globe from small 0.32 to standard 1.0
      const curGlobeScale = THREE.MathUtils.lerp(0.32, 1.0, ease);
      globeGroupRef.current.scale.set(curGlobeScale, curGlobeScale, curGlobeScale);

      // Smooth quaternion rotation to align Birdman right in front of camera
      globeGroupRef.current.quaternion.slerpQuaternions(qInitial, qTarget, ease);
      globeGroupRef.current.visible = true;
      bgOpacityRef.current = 0.95;

      // Birdman card rides on the globe surface
      sphereCardWorldPos
        .set(...targetItem.position)
        .applyQuaternion(globeGroupRef.current.quaternion)
        .multiplyScalar(curGlobeScale);

      birdmanMeshRef.current.position.copy(sphereCardWorldPos);
      birdmanMeshRef.current.quaternion
        .copy(baseCardQuat)
        .premultiply(globeGroupRef.current.quaternion);

      // 2:3 card dimensions on the globe
      const cardW = 1.25 * curGlobeScale;
      const cardH = 1.88 * curGlobeScale;
      birdmanMeshRef.current.scale.set(cardW, cardH, 1);
    }
    // =========================================================================
    // PHASE 2 & 3: (0.45 -> 1.00) Continuous Take: Background fades, Birdman blooms
    // =========================================================================
    else {
      const t = (p - 0.45) / 0.55;
      const easeSurge = t * t * (3 - 2 * t); // Smoothstep curve

      // Background cards fade out cleanly between 0.45 and 0.65
      const tFade = Math.min(1.0, (p - 0.45) / 0.20);
      const fadeEase = tFade * tFade * (3 - 2 * tFade);
      bgOpacityRef.current = Math.max(0, 0.95 * (1.0 - fadeEase));

      // As soon as background cards fade out, hide globe completely to prevent any occlusion
      if (bgOpacityRef.current <= 0.01) {
        globeGroupRef.current.visible = false;
      } else {
        globeGroupRef.current.visible = true;
      }

      // Birdman smoothly detaches and glides from z = sphereRadius to z = 0.0
      const curZ = THREE.MathUtils.lerp(sphereRadius, 0.0, easeSurge);
      birdmanMeshRef.current.position.set(0, 0, curZ);

      // Birdman quaternion smoothly straightens to face camera flat
      birdmanMeshRef.current.quaternion.slerpQuaternions(frontFacingQuat, flatQuat, easeSurge);

      // Scale smoothly morphs from 2:3 card dimensions to full-bleed 16:9 hero
      const curW = THREE.MathUtils.lerp(1.25, targetHeroW, easeSurge);
      const curH = THREE.MathUtils.lerp(1.88, targetHeroH, easeSurge);
      birdmanMeshRef.current.scale.set(curW, curH, 1);
    }
  });

  return (
    <>
      <ambientLight intensity={1.5} />

      {/* Rotating Globe containing background movie posters */}
      <group ref={globeGroupRef}>
        {sphereItems.map((item, idx) => {
          if (idx === birdmanIndex) return null; // Birdman rendered as focal mesh below
          const movie = movies[idx % movies.length];
          return (
            <BackgroundGlobeCard
              key={idx}
              movie={movie}
              position={item.position}
              quaternion={item.radialQuaternion}
              opacityRef={bgOpacityRef}
            />
          );
        })}
      </group>

      {/* Focal Birdman Card: Sits in world space, renderOrder 999 so it is never occluded */}
      <mesh ref={birdmanMeshRef} renderOrder={999}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={birdmanTexture}
          color="#ffffff"
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}

export function StoryHeroOneShot({ isReplaying, onAnimationComplete, onSkipIntro }) {
  const progressRef = useRef({ value: 0.0 });
  const [introStage, setIntroStage] = useState('EXPLORING ARCHIVE');
  const [isCompleted, setIsCompleted] = useState(false);
  const tweenRef = useRef(null);

  const count = 48;
  const radius = 6.8;
  const birdmanIndex = 9;

  const sphereItems = useMemo(() => generateSpherePositions(count, radius), [count, radius]);
  const targetItem = sphereItems[birdmanIndex] || sphereItems[0];

  // Load the attached Birdman 16:9 artwork
  const birdmanTexture = useMemo(() => {
    return getTexture('/birdman-hero.png');
  }, []);

  // Preload real movie posters for background cards
  useEffect(() => {
    movies.slice(0, 48).forEach((m) => {
      if (m?.poster) getTexture(m.poster);
    });
  }, []);

  // Unhurried, smooth, majestic GSAP continuous take (~7.0s total duration)
  useEffect(() => {
    progressRef.current.value = 0.0;
    setIsCompleted(false);

    try {
      sounds?.playClick?.();
    } catch {}

    if (tweenRef.current) tweenRef.current.kill();

    const tween = gsap.to(progressRef.current, {
      value: 1.0,
      duration: 7.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        const val = progressRef.current.value;
        if (val < 0.45) {
          setIntroStage('1. EXPANDING CELESTIAL ARCHIVE');
        } else if (val < 0.75) {
          setIntroStage('2. TRACKING BEST PICTURE: BIRDMAN');
        } else {
          setIntroStage('3. FULL-BLEED 16:9 HERO PRESENTATION');
        }
      },
      onComplete: () => {
        setIsCompleted(true);
        try {
          sounds?.playChime?.();
        } catch {}
        onAnimationComplete?.();
      }
    });

    tweenRef.current = tween;

    return () => {
      tween.kill();
    };
  }, [isReplaying, onAnimationComplete]);

  const handleSkip = () => {
    if (tweenRef.current) tweenRef.current.kill();
    progressRef.current.value = 1.0;
    setIsCompleted(true);
    onSkipIntro?.();
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'auto',
        overflow: 'hidden'
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 12.0], fov: 40, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#07080a']} />
        <OneShotScene
          progressRef={progressRef}
          birdmanTexture={birdmanTexture}
          sphereItems={sphereItems}
          birdmanIndex={birdmanIndex}
          targetItem={targetItem}
        />
      </Canvas>

      {/* Flight Stage Pill & Skip button during the continuous take */}
      {!isCompleted && (
        <div
          style={{
            position: 'absolute',
            bottom: '36px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'auto',
            background: 'rgba(7, 8, 10, 0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '10px 24px',
            borderRadius: '999px',
            border: '1px solid rgba(212, 175, 55, 0.3)'
          }}
        >
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '11px',
              letterSpacing: '0.18em',
              color: '#d4af37',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}
          >
            {introStage}
          </div>

          <button
            onClick={handleSkip}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              marginTop: '2px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)')}
          >
            Skip to Story →
          </button>
        </div>
      )}
    </div>
  );
}
