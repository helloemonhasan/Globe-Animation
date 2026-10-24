import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { generateSpherePositions } from '../utils/mathSphere';
import { movies } from '../data/movies';
import { BIRDMAN_STORY_DATA } from '../data/birdmanStoryData';
import { sounds } from './AudioEffects';

// Dedicated 3D Transition Scene: Small Globe -> Rotation -> Expand -> 16:9 Birdman Full-Bleed
function TransitionScene({ animProgressRef, onTransitionComplete, isPlayingSound = true }) {
  const { camera, viewport } = useThree();
  const groupRef = useRef();
  const birdmanMeshRef = useRef();
  const backgroundMeshesRef = useRef([]);

  // Generate cards on sphere
  const count = 48;
  const radius = 6.8;
  const sphereItems = useMemo(() => generateSpherePositions(count, radius), [count, radius]);

  // Target card: Birdman (index 9 in dataset)
  const birdmanIndex = 9;
  const targetItem = sphereItems[birdmanIndex] || sphereItems[0];

  // Target rotation angles so Birdman faces directly forward (+Z towards camera)
  const targetRotX = Math.PI / 2 - targetItem.phi;
  const targetRotY = targetItem.theta - Math.PI / 2;

  // Textures: Poster & 16:9 Widescreen Backdrop
  const posterTex = useMemo(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const tex = loader.load(BIRDMAN_STORY_DATA.heroPoster);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  const backdropTex = useMemo(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const tex = loader.load(BIRDMAN_STORY_DATA.heroBackdrop);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Shared geometry for background cards
  const bgCardGeo = useMemo(() => new THREE.PlaneGeometry(1.2, 1.8), []);

  useFrame((state, delta) => {
    const p = animProgressRef.current.value; // 0.0 to 1.0

    if (!groupRef.current) return;

    // Phase 1 (0.0 -> 0.45): Small globe (scale 0.16) rotates and grows to standard size (scale 1.0)
    // Phase 2 (0.45 -> 0.75): Sphere rotates to align Birdman, other cards scatter & fade, camera pushes
    // Phase 3 (0.75 -> 1.0): Birdman card expands from 2:3 to 16:9 widescreen and fills viewport

    if (p < 0.45) {
      const t1 = p / 0.45;
      const ease1 = t1 * t1 * (3 - 2 * t1); // smoothstep
      const scale = THREE.MathUtils.lerp(0.18, 1.0, ease1);
      groupRef.current.scale.set(scale, scale, scale);

      // Orbital spin that begins to orient towards target angles
      groupRef.current.rotation.y = THREE.MathUtils.lerp(0.0, targetRotY, ease1);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(0.2, targetRotX, ease1);

      // Camera stays at entrance distance
      camera.position.z = THREE.MathUtils.lerp(15.2, 14.0, ease1);
    } else if (p < 0.75) {
      const t2 = (p - 0.45) / 0.30;
      const ease2 = t2 * t2 * (3 - 2 * t2);

      // Lock orientation exactly on Birdman
      groupRef.current.rotation.y = targetRotY;
      groupRef.current.rotation.x = targetRotX;

      // Sphere expands outwards while camera pushes in
      const groupScale = THREE.MathUtils.lerp(1.0, 1.8, ease2);
      groupRef.current.scale.set(groupScale, groupScale, groupScale);

      // Camera dolly forward
      camera.position.z = THREE.MathUtils.lerp(14.0, 8.2, ease2);

      // Background cards fade out and disperse backwards
      backgroundMeshesRef.current.forEach((mesh) => {
        if (mesh && mesh.material) {
          mesh.material.opacity = Math.max(0, 1.0 - ease2 * 1.4);
        }
      });
    } else {
      // Phase 3: Final surge to 16:9 Full Bleed
      const t3 = (p - 0.75) / 0.25;
      const ease3 = Math.min(1.0, t3 * (2 - t3)); // easeOut

      // Camera moves in close
      camera.position.z = THREE.MathUtils.lerp(8.2, 4.2, ease3);

      // Hide background cards
      backgroundMeshesRef.current.forEach((mesh) => {
        if (mesh && mesh.material) mesh.material.opacity = 0;
      });

      // Transform Birdman card to 16:9 Widescreen aspect and expand to viewport
      if (birdmanMeshRef.current) {
        // Calculate dimensions to fill the 16:9 viewport
        const targetWidth = viewport.width * 1.05;
        const targetHeight = targetWidth * (9 / 16);

        const curWidth = THREE.MathUtils.lerp(1.25, targetWidth, ease3);
        const curHeight = THREE.MathUtils.lerp(1.88, targetHeight, ease3);

        birdmanMeshRef.current.scale.set(curWidth / 1.25, curHeight / 1.88, 1);

        // Crossfade from portrait poster to 16:9 backdrop
        if (birdmanMeshRef.current.material) {
          if (ease3 > 0.4 && birdmanMeshRef.current.material.map !== backdropTex) {
            birdmanMeshRef.current.material.map = backdropTex;
            birdmanMeshRef.current.material.needsUpdate = true;
          }
        }
      }
    }
  });

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 10, 7]} intensity={1.2} />

      <group ref={groupRef}>
        {/* Background Cards in the sphere */}
        {sphereItems.map((item, idx) => {
          if (idx === birdmanIndex) return null; // Rendered separately below
          const movie = movies[idx % movies.length];

          return (
            <mesh
              key={idx}
              ref={(el) => (backgroundMeshesRef.current[idx] = el)}
              position={item.position}
              quaternion={item.radialQuaternion}
              geometry={bgCardGeo}
            >
              <meshBasicMaterial
                color="#2a2e39"
                transparent
                opacity={0.85}
                depthWrite={false}
              />
            </mesh>
          );
        })}

        {/* The Star Card: Birdman */}
        <mesh
          ref={birdmanMeshRef}
          position={targetItem.position}
          quaternion={targetItem.radialQuaternion}
        >
          <planeGeometry args={[1.25, 1.88, 16, 16]} />
          <meshBasicMaterial
            map={posterTex}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </>
  );
}

export function StoryGlobeIntro({ onComplete, onSkip }) {
  const [stageText, setStageText] = useState('INITIALIZING CELESTIAL ARCHIVE');
  const animProgressRef = useRef({ value: 0.0 });
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Play intro swoosh sound
    try {
      sounds?.playClick?.();
    } catch {}

    const tl = gsap.timeline({
      onComplete: () => {
        setIsFinished(true);
        try {
          sounds?.playChime?.();
        } catch {}
        setTimeout(() => {
          onComplete?.();
        }, 300);
      }
    });

    // Cinematic 3-stage timeline (total duration: 3.2s)
    tl.to(animProgressRef.current, {
      value: 0.45,
      duration: 1.2,
      ease: 'power2.inOut',
      onStart: () => setStageText('STAGE 01 // EXPANDING SPHERICAL GALAXY')
    })
      .to(animProgressRef.current, {
        value: 0.75,
        duration: 1.0,
        ease: 'power3.inOut',
        onStart: () => setStageText('STAGE 02 // TARGETING BEST PICTURE: BIRDMAN (2014)')
      })
      .to(animProgressRef.current, {
        value: 1.0,
        duration: 1.0,
        ease: 'power4.out',
        onStart: () => setStageText('STAGE 03 // MORPHING TO 16:9 FULL BLEED HERO')
      });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: '#050608',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        pointerEvents: isFinished ? 'none' : 'auto',
        opacity: isFinished ? 0 : 1,
        transition: 'opacity 0.4s ease'
      }}
    >
      {/* 3D WebGL Canvas */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Canvas
          camera={{ position: [0, 0, 15.2], fov: 42 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        >
          <color attach="background" args={['#050608']} />
          <TransitionScene animProgressRef={animProgressRef} />
        </Canvas>
      </div>

      {/* Top Banner */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '24px 36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '11px',
              letterSpacing: '0.22em',
              color: '#d4af37',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}
          >
            Monolith Ciné-Revue
          </span>
          <span style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }} />
          <span
            style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.65)',
              letterSpacing: '0.08em'
            }}
          >
            Story Mode Presentation
          </span>
        </div>

        {/* Skip Button */}
        <button
          onClick={() => {
            try {
              sounds?.playClick?.();
            } catch {}
            onSkip?.();
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            padding: '7px 18px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#d4af37';
            e.currentTarget.style.color = '#d4af37';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.color = '#ffffff';
          }}
        >
          Skip Intro →
        </button>
      </div>

      {/* Bottom Progress Label */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '24px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: '#d4af37',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}
        >
          {stageText}
        </div>

        <div
          style={{
            width: '180px',
            height: '2px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '999px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              background: '#d4af37',
              width: '100%',
              animation: 'storyProgressPulse 3.2s linear forwards'
            }}
          />
        </div>
      </div>
    </div>
  );
}
