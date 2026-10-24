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
function BackgroundGlobeCard({ movie, position, quaternion, progressRef }) {
  const meshRef = useRef();
  const [tex, setTex] = useState(null);

  useEffect(() => {
    if (!movie?.poster) return;
    let isCancelled = false;
    const loadedTex = getTexture(movie.poster);
    if (loadedTex) {
      if (!isCancelled) setTex(loadedTex);
    }
    return () => {
      isCancelled = true;
    };
  }, [movie?.poster]);

  useFrame(() => {
    if (!meshRef.current) return;
    const p = progressRef.current?.value || 0;

    // Phase 1 (0.0 -> 0.45): Full opacity on the globe
    // Phase 2 (0.45 -> 0.75): Fade out & scatter outward
    // Phase 3 (0.75 -> 1.0): Completely hidden
    if (p < 0.42) {
      meshRef.current.visible = true;
      if (meshRef.current.material) {
        meshRef.current.material.opacity = 0.95;
      }
    } else if (p < 0.75) {
      meshRef.current.visible = true;
      const t = (p - 0.42) / 0.33;
      if (meshRef.current.material) {
        meshRef.current.material.opacity = Math.max(0, (1 - t) * 0.95);
      }
    } else {
      meshRef.current.visible = false;
    }
  });

  return (
    <mesh ref={meshRef} position={position} quaternion={quaternion}>
      <planeGeometry args={[1.22, 1.83]} />
      <meshBasicMaterial
        map={tex}
        color={tex ? '#ffffff' : '#232733'}
        transparent
        opacity={0.95}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Focal Birdman Card: Transitions from Sphere Card -> Surges Forward -> Morphs to 16:9 Full Bleed
function FocalBirdmanCard({ targetItem, progressRef, birdmanTexture }) {
  const { viewport } = useThree();
  const meshRef = useRef();

  const basePos = useMemo(() => new THREE.Vector3(...targetItem.position), [targetItem]);
  const baseQuat = useMemo(() => new THREE.Quaternion(...targetItem.radialQuaternion), [targetItem]);
  const flatQuat = useMemo(() => new THREE.Quaternion(0, 0, 0, 1), []);

  useFrame(() => {
    if (!meshRef.current) return;
    const p = progressRef.current?.value || 0;

    // Viewport-based 16:9 target size in world units at z = 0
    // To ensure full-bleed coverage regardless of screen aspect ratio:
    const targetWidth = Math.max(viewport.width, viewport.height * (16 / 9)) * 1.02;
    const targetHeight = targetWidth * (9 / 16);

    if (p < 0.45) {
      // Anchored to the sphere in initial 2:3 poster frame
      meshRef.current.position.copy(basePos);
      meshRef.current.quaternion.copy(baseQuat);
      meshRef.current.scale.set(1.25, 1.88, 1);

      // Cropped to center portrait on 2:3 card
      if (birdmanTexture) {
        birdmanTexture.repeat.set(0.60, 1.0);
        birdmanTexture.offset.set(0.20, 0.0);
      }
    } else if (p < 0.75) {
      // Detaches from sphere and glides towards center
      const t = (p - 0.45) / 0.30;
      const ease = t * t * (3 - 2 * t); // smoothstep

      meshRef.current.position.lerpVectors(basePos, new THREE.Vector3(0, 0, 0), ease);
      meshRef.current.quaternion.slerpQuaternions(baseQuat, flatQuat, ease);

      const curW = THREE.MathUtils.lerp(1.25, targetWidth * 0.45, ease);
      const curH = THREE.MathUtils.lerp(1.88, targetHeight * 0.45, ease);
      meshRef.current.scale.set(curW, curH, 1);

      // Gradually expand horizontal texture reveal
      if (birdmanTexture) {
        const repX = THREE.MathUtils.lerp(0.60, 0.85, ease);
        const offX = THREE.MathUtils.lerp(0.20, 0.075, ease);
        birdmanTexture.repeat.set(repX, 1.0);
        birdmanTexture.offset.set(offX, 0.0);
      }
    } else {
      // Final surge: Expands into full 16:9 Hero
      const t = (p - 0.75) / 0.25;
      const ease = Math.min(1.0, t * (2 - t)); // easeOut

      meshRef.current.position.set(0, 0, 0);
      meshRef.current.quaternion.set(0, 0, 0, 1);

      const curW = THREE.MathUtils.lerp(targetWidth * 0.45, targetWidth, ease);
      const curH = THREE.MathUtils.lerp(targetHeight * 0.45, targetHeight, ease);
      meshRef.current.scale.set(curW, curH, 1);

      // Fully reveal widescreen 16:9 artwork
      if (birdmanTexture) {
        const repX = THREE.MathUtils.lerp(0.85, 1.0, ease);
        const offX = THREE.MathUtils.lerp(0.075, 0.0, ease);
        birdmanTexture.repeat.set(repX, 1.0);
        birdmanTexture.offset.set(offX, 0.0);
      }
    }
  });

  return (
    <mesh ref={meshRef} position={targetItem.position} quaternion={targetItem.radialQuaternion}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={birdmanTexture}
        color="#ffffff"
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Main 3D Continuous One-Shot Scene
function OneShotCanvasScene({ progressRef, birdmanTexture, targetRotX, targetRotY, targetItem, sphereItems, count, birdmanIndex }) {
  const { camera } = useThree();
  const globeGroupRef = useRef();

  useFrame((state, delta) => {
    if (!globeGroupRef.current) return;
    const p = progressRef.current?.value || 0;

    if (p < 0.45) {
      // Phase 1: Small globe grows and aligns Birdman to front
      const t = p / 0.45;
      const ease = t * t * (3 - 2 * t);

      const curScale = THREE.MathUtils.lerp(0.20, 1.0, ease);
      globeGroupRef.current.scale.set(curScale, curScale, curScale);

      // Rotate group so Birdman faces camera
      globeGroupRef.current.rotation.y = THREE.MathUtils.lerp(0.0, targetRotY, ease);
      globeGroupRef.current.rotation.x = THREE.MathUtils.lerp(0.25, targetRotX, ease);

      camera.position.z = THREE.MathUtils.lerp(15.2, 14.0, ease);
    } else if (p < 0.75) {
      // Phase 2: Camera pushes forward, globe expands past camera
      const t = (p - 0.45) / 0.30;
      const ease = t * t * (3 - 2 * t);

      globeGroupRef.current.rotation.y = targetRotY;
      globeGroupRef.current.rotation.x = targetRotX;

      const curScale = THREE.MathUtils.lerp(1.0, 2.8, ease);
      globeGroupRef.current.scale.set(curScale, curScale, curScale);

      camera.position.z = THREE.MathUtils.lerp(14.0, 7.8, ease);
    } else {
      // Phase 3: Camera settles at final hero vantage
      const t = (p - 0.75) / 0.25;
      const ease = Math.min(1.0, t * (2 - t));

      camera.position.z = THREE.MathUtils.lerp(7.8, 4.8, ease);
    }
  });

  return (
    <>
      <ambientLight intensity={1.4} />

      {/* Sphere Group containing all cards */}
      <group ref={globeGroupRef}>
        {sphereItems.map((item, idx) => {
          if (idx === birdmanIndex) return null;
          const movie = movies[idx % movies.length];
          return (
            <BackgroundGlobeCard
              key={idx}
              movie={movie}
              position={item.position}
              quaternion={item.radialQuaternion}
              progressRef={progressRef}
            />
          );
        })}

        {/* The Birdman Card */}
        <FocalBirdmanCard
          targetItem={targetItem}
          progressRef={progressRef}
          birdmanTexture={birdmanTexture}
        />
      </group>
    </>
  );
}

export function StoryHeroOneShot({ isReplaying, onAnimationComplete, onSkipIntro }) {
  const progressRef = useRef({ value: 0.0 });
  const [introStage, setIntroStage] = useState('INITIALIZING SPHERE');
  const [isCompleted, setIsCompleted] = useState(false);
  const tweenRef = useRef(null);

  // Target item for Birdman (index 9 in dataset)
  const count = 48;
  const radius = 6.8;
  const birdmanIndex = 9;

  const sphereItems = useMemo(() => generateSpherePositions(count, radius), [count, radius]);
  const targetItem = sphereItems[birdmanIndex] || sphereItems[0];

  const targetRotX = Math.PI / 2 - targetItem.phi;
  const targetRotY = targetItem.theta - Math.PI / 2;

  // Load the attached Birdman 16:9 artwork
  const birdmanTexture = useMemo(() => {
    return getTexture('/birdman-hero.png');
  }, []);

  // Preload poster textures for background cards so sphere is never blank
  useEffect(() => {
    movies.slice(0, 36).forEach((m) => {
      if (m?.poster) getTexture(m.poster);
    });
  }, []);

  // GSAP One-Shot Continuous Sequence
  useEffect(() => {
    progressRef.current.value = 0.0;
    setIsCompleted(false);

    try {
      sounds?.playClick?.();
    } catch {}

    if (tweenRef.current) tweenRef.current.kill();

    const tl = gsap.timeline({
      onComplete: () => {
        setIsCompleted(true);
        try {
          sounds?.playChime?.();
        } catch {}
        onAnimationComplete?.();
      }
    });

    tl.to(progressRef.current, {
      value: 0.45,
      duration: 1.3,
      ease: 'power2.inOut',
      onStart: () => setIntroStage('EXPANDING CELESTIAL GLOBE')
    })
      .to(progressRef.current, {
        value: 0.75,
        duration: 1.1,
        ease: 'power3.inOut',
        onStart: () => setIntroStage('ALIGNING BEST PICTURE: BIRDMAN (2014)')
      })
      .to(progressRef.current, {
        value: 1.0,
        duration: 1.2,
        ease: 'power4.out',
        onStart: () => setIntroStage('SETTLING 16:9 FULL BLEED HERO')
      });

    tweenRef.current = tl;

    return () => {
      tl.kill();
    };
  }, [isReplaying, onAnimationComplete]);

  const handleSkip = () => {
    if (tweenRef.current) {
      tweenRef.current.kill();
    }
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
        camera={{ position: [0, 0, 15.2], fov: 40 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#07080a']} />
        <OneShotCanvasScene
          progressRef={progressRef}
          birdmanTexture={birdmanTexture}
          targetRotX={targetRotX}
          targetRotY={targetRotY}
          targetItem={targetItem}
          sphereItems={sphereItems}
          count={count}
          birdmanIndex={birdmanIndex}
        />
      </Canvas>

      {/* Unbroken One-Shot Stage Indicator & Skip Button (active during flight) */}
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
