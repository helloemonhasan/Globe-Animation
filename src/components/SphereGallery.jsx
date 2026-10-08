import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { ImageCard } from './ImageCard';
import { generateSpherePositions, getEntranceProgress } from '../utils/mathSphere';
import { sounds } from './AudioEffects';
import { gothicSpaceMusic } from './GothicSpaceAudio';

export function SphereGallery({
  movies,
  projects, // fallback alias
  layoutMode = 'globe', // 'globe' | 'line'
  theme = 'dark', // 'dark' | 'light'
  sphereRadius = 7.4,
  cardDimensions = [1.25, 1.88], // Vertical 2:3 theatrical poster ratio
  selectedIndex,
  onSelectIndex,
  activeCategory,
  entranceProgress = 1.0,
  prefersReducedMotion = false,
  autoRotateSpeed = 0.0013,
  isAutoRotatePaused = false,
  onHoverCard,
  setIsDraggingState
}) {
  const activeList = movies || projects || [];
  const groupRef = useRef();
  const { gl } = useThree();

  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Generate mathematical positions across sphere
  const sphereItems = useMemo(() => {
    return generateSpherePositions(activeList.length, sphereRadius);
  }, [activeList.length, sphereRadius]);

  // Single shared geometry for all cards with smooth subdivisions for 3D fluid wave ripples
  const sharedCardGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(cardDimensions[0], cardDimensions[1], 24, 32);
  }, [cardDimensions]);

  useEffect(() => {
    return () => {
      sharedCardGeometry.dispose();
    };
  }, [sharedCardGeometry]);

  // Smooth rotation & drag physics state stored in refs (no React rerenders per frame!)
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const startRotRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastPointerRef = useRef({ x: 0, y: 0, time: 0 });

  // Mouse tilt target
  const mouseTiltTargetRef = useRef({ x: 0, y: 0 });
  const mouseTiltCurrentRef = useRef({ x: 0, y: 0 });

  // Base cumulative sphere rotation
  const sphereRotRef = useRef({ x: 0, y: 0 });

  // Scroll offset rotation for Globe mode
  const scrollOffsetRef = useRef(0);

  // Line ribbon mode scroll & velocity refs
  const layoutProgressRef = useRef({ value: layoutMode === 'line' ? 1.0 : 0.0 });
  const lineScrollRef = useRef(0);
  const lineVelocityRef = useRef(0);
  const lineDragStartRef = useRef(0);
  const lineStartScrollRef = useRef(0);

  // Smooth layout mode transition with GSAP
  useEffect(() => {
    const targetVal = layoutMode === 'line' ? 1.0 : 0.0;
    gsap.killTweensOf(layoutProgressRef.current);
    gsap.to(layoutProgressRef.current, {
      value: targetVal,
      duration: prefersReducedMotion ? 0.4 : 1.8,
      ease: 'power3.inOut'
    });

    if (layoutMode === 'line') {
      // Smoothly level the sphere rotation so the ribbon is horizontal
      gsap.killTweensOf(sphereRotRef.current);
      gsap.to(sphereRotRef.current, {
        x: 0,
        y: 0,
        duration: 1.4,
        ease: 'power2.out'
      });
      velocityRef.current = { x: 0, y: 0 };
    }
  }, [layoutMode, prefersReducedMotion]);

  // Keep selectedIndex in ref to avoid stale event listener closures
  const selectedIndexRef = useRef(selectedIndex);
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
    if (selectedIndex !== null) {
      velocityRef.current = { x: 0, y: 0 };
      lineVelocityRef.current = 0;
      scrollOffsetRef.current = 0;
      mouseTiltTargetRef.current = { x: 0, y: 0 };
    }
  }, [selectedIndex]);

  // Scroll to category when selected
  useEffect(() => {
    if (!activeCategory || activeCategory === 'ALL' || !sphereItems || !sphereItems.length) return;

    // Find the first movie matching the category
    const targetIdx = activeList.findIndex((movie) => {
      const y = movie.year;
      if (activeCategory === '2020s') return y >= 2020;
      if (activeCategory === '2010s') return y >= 2010 && y < 2020;
      if (activeCategory === '2000s') return y >= 2000 && y < 2010;
      if (activeCategory === '1990s') return y >= 1990 && y < 2000;
      if (activeCategory === 'CLASSICS') return y < 1990;
      return false;
    });

    if (targetIdx !== -1) {
      if (layoutMode === 'globe') {
        const item = sphereItems[targetIdx];
        const targetX = Math.PI / 2 - item.phi;
        const targetY = item.theta - Math.PI / 2;

        const currentY = sphereRotRef.current.y;
        const TWO_PI = Math.PI * 2;
        let normalizedTargetY = targetY % TWO_PI;
        if (normalizedTargetY < 0) normalizedTargetY += TWO_PI;
        
        let currentMod = currentY % TWO_PI;
        if (currentMod < 0) currentMod += TWO_PI;
        
        let diff = normalizedTargetY - currentMod;
        if (diff > Math.PI) diff -= TWO_PI;
        if (diff < -Math.PI) diff += TWO_PI;
        
        gsap.to(sphereRotRef.current, {
          x: targetX,
          y: currentY + diff,
          duration: 1.5,
          ease: 'power3.out'
        });
      } else if (layoutMode === 'line') {
        const spacing = 2.05;
        const targetScroll = targetIdx * spacing;
        
        const totalCards = activeList.length;
        const totalWidth = totalCards * spacing;
        
        const currentScroll = lineScrollRef.current;
        let diff = (targetScroll - currentScroll) % totalWidth;
        if (diff > totalWidth / 2) diff -= totalWidth;
        if (diff < -totalWidth / 2) diff += totalWidth;
        
        gsap.to(lineScrollRef, {
          current: currentScroll + diff,
          duration: 1.5,
          ease: 'power3.out'
        });
      }
    }
  }, [activeCategory, activeList, sphereItems, layoutMode]);

  // Drag & pointer listeners on the Three.js canvas element
  useEffect(() => {
    const dom = gl.domElement;
    if (!dom) return;

    const handlePointerDown = (e) => {
      // Primary button or touch
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (selectedIndexRef.current !== null) return;

      isDraggingRef.current = true;
      setIsDraggingState?.(true);

      const isLine = layoutProgressRef.current.value > 0.5;
      if (isLine) {
        lineDragStartRef.current = e.clientX;
        lineStartScrollRef.current = lineScrollRef.current;
        lineVelocityRef.current = 0;
      } else {
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        startRotRef.current = { x: sphereRotRef.current.x, y: sphereRotRef.current.y };
        velocityRef.current = { x: 0, y: 0 };
      }

      lastPointerRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
      dom.style.cursor = 'grabbing';
      dom.setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e) => {
      if (selectedIndexRef.current !== null) return;
      const now = performance.now();
      const dt = Math.max(now - lastPointerRef.current.time, 16);
      const isLine = layoutProgressRef.current.value > 0.5;

      if (isDraggingRef.current) {
        if (isLine) {
          // Horizontal ribbon drag scrolling
          const deltaX = e.clientX - lineDragStartRef.current;
          const lineDragSensitivity = 0.015;
          lineScrollRef.current = lineStartScrollRef.current - deltaX * lineDragSensitivity;

          // Drag release velocity calculation
          const instVelX = ((e.clientX - lastPointerRef.current.x) / dt) * 0.022;
          lineVelocityRef.current = -instVelX;
          lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now };

          gothicSpaceMusic.onDrag({ x: 0, y: instVelX * 2.5 });
          if (Math.abs(deltaX) > 28) {
            sounds.playDragTick();
          }
        } else {
          // 3D Globe spherical rotation drag
          const deltaX = e.clientX - dragStartRef.current.x;
          const deltaY = e.clientY - dragStartRef.current.y;

          // Sensitivity tuned for a massive, floating cinematic globe feel
          const rotSensitivity = 0.0042;
          sphereRotRef.current.y = startRotRef.current.y + deltaX * rotSensitivity;
          sphereRotRef.current.x = THREE.MathUtils.clamp(
            startRotRef.current.x + deltaY * rotSensitivity,
            -Math.PI * 0.42,
            Math.PI * 0.42
          );

          // Calculate release velocity for momentum with soft clamping
          const instVelX = ((e.clientX - lastPointerRef.current.x) / dt) * 0.06;
          const instVelY = ((e.clientY - lastPointerRef.current.y) / dt) * 0.06;
          velocityRef.current.x = instVelY;
          velocityRef.current.y = instVelX;

          lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now };

          // Modulate Gothic Space Music filter & cosmic wind on rotation
          gothicSpaceMusic.onDrag(velocityRef.current);

          if (Math.abs(deltaX) > 40 || Math.abs(deltaY) > 40) {
            sounds.playDragTick();
          }
        }
      } else {
        // Pointer hovering over background: calculate gentle mouse tilt
        const normX = (e.clientX / window.innerWidth) * 2 - 1;
        const normY = -(e.clientY / window.innerHeight) * 2 + 1;
        mouseTiltTargetRef.current = {
          x: normY * (isLine ? 0.05 : 0.16),
          y: normX * (isLine ? 0.09 : 0.28)
        };
      }
    };

    const handlePointerUp = (e) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDraggingState?.(false);
      dom.style.cursor = 'grab';
      try {
        dom.releasePointerCapture?.(e.pointerId);
      } catch {}
    };

    const handleWheel = (e) => {
      // If modal/popup is open, DO NOT rotate or scroll background
      if (selectedIndexRef.current !== null) return;

      const isLine = layoutProgressRef.current.value > 0.5;
      if (isLine) {
        // Horizontal ribbon wheel / trackpad scroll
        const scrollDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        lineVelocityRef.current += scrollDelta * 0.0028;
      } else {
        // Subtle scroll influence on sphere rotation without jarring spins
        scrollOffsetRef.current += e.deltaY * 0.00045;
      }
    };

    dom.style.cursor = 'grab';
    dom.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    dom.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      dom.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      dom.removeEventListener('wheel', handleWheel);
    };
  }, [gl.domElement, setIsDraggingState]);

  // Handle card selection & callbacks
  const handleCardHover = useCallback((idx) => {
    if (selectedIndexRef.current !== null) return;
    setHoveredIndex(idx);
    onHoverCard?.(activeList[idx]);
  }, [activeList, onHoverCard]);

  const handleCardUnhover = useCallback((idx) => {
    if (selectedIndexRef.current !== null) return;
    setHoveredIndex((prev) => (prev === idx ? null : prev));
    onHoverCard?.(null);
  }, [onHoverCard]);

  const handleCardClick = useCallback((idx) => {
    if (selectedIndex === idx) {
      onSelectIndex(null);
    } else {
      onSelectIndex(idx);
    }
  }, [selectedIndex, onSelectIndex]);

  // Main animation loop: inertia, continuous rotation, tilt & scroll
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const dt = Math.min(delta, 0.05);
    const lineBlend = layoutProgressRef.current.value;
    const isGlobeActive = lineBlend < 0.98;

    // 1. Line Ribbon Momentum Decay
    if (!isDraggingRef.current && lineBlend > 0.05) {
      lineScrollRef.current += lineVelocityRef.current;
      const lineDamping = Math.pow(0.91, dt * 60);
      lineVelocityRef.current *= lineDamping;
      if (Math.abs(lineVelocityRef.current) < 0.00001) lineVelocityRef.current = 0;
    }

    // 2. Continuous Slow Rotation (Globe Mode only) & Fast Entrance Spin
    const curEntrance = getEntranceProgress(entranceProgress);
    const isPaused = isAutoRotatePaused || selectedIndex !== null || prefersReducedMotion;
    if (isGlobeActive && !isPaused && !isDraggingRef.current) {
      // Add a dramatic entrance spin that decays as curEntrance approaches 1
      const entranceSpin = Math.max(0, 1.0 - curEntrance) * 0.035;
      sphereRotRef.current.y += (autoRotateSpeed + entranceSpin) * (1.0 - lineBlend);
      
      // Extremely subtle sinusoidal X-axis breathing
      const breathX = Math.sin(state.clock.elapsedTime * 0.4) * 0.00025 * (1.0 - lineBlend);
      sphereRotRef.current.x += breathX;
    }

    // 3. Globe Momentum & Velocity Decay when not dragging
    if (isGlobeActive && !isDraggingRef.current) {
      sphereRotRef.current.y += velocityRef.current.y;
      sphereRotRef.current.x += velocityRef.current.x;

      // Premium exponential damping
      const damping = Math.pow(0.92, dt * 60);
      velocityRef.current.x *= damping;
      velocityRef.current.y *= damping;

      if (Math.abs(velocityRef.current.x) < 0.00001) velocityRef.current.x = 0;
      if (Math.abs(velocityRef.current.y) < 0.00001) velocityRef.current.y = 0;
    }

    // 4. Pointer tilt easing
    const tiltEasing = 3.5 * dt;
    mouseTiltCurrentRef.current.x = THREE.MathUtils.lerp(
      mouseTiltCurrentRef.current.x,
      mouseTiltTargetRef.current.x,
      tiltEasing
    );
    mouseTiltCurrentRef.current.y = THREE.MathUtils.lerp(
      mouseTiltCurrentRef.current.y,
      mouseTiltTargetRef.current.y,
      tiltEasing
    );

    // 5. Scroll offset decay (Globe mode)
    if (isGlobeActive) {
      scrollOffsetRef.current = THREE.MathUtils.lerp(scrollOffsetRef.current, 0, 4.0 * dt);
      sphereRotRef.current.y += scrollOffsetRef.current;

      // Clamp vertical tilt to prevent unnatural pole flips
      sphereRotRef.current.x = THREE.MathUtils.clamp(
        sphereRotRef.current.x,
        -Math.PI * 0.44,
        Math.PI * 0.44
      );
    }

    // 6. Apply combined rotation to the sphere group (smoothly leveled in Line mode)
    const targetGroupRotX = (sphereRotRef.current.x + mouseTiltCurrentRef.current.x) * (1.0 - lineBlend);
    const targetGroupRotY = (sphereRotRef.current.y + mouseTiltCurrentRef.current.y) * (1.0 - lineBlend);

    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetGroupRotX,
      0.15
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetGroupRotY,
      0.15
    );

    // Entrance scale: sphere starts tiny (0.1) and scales up to 1.0
    // Using a non-linear curve (Math.pow) to make the zoom feel more cinematic
    const scaleCurve = Math.pow(curEntrance, 2.5);
    const currentSphereScale = 0.1 + 0.9 * scaleCurve;
    groupRef.current.scale.set(currentSphereScale, currentSphereScale, currentSphereScale);
  });

  // Timeline Ruler component for Line mode
  const TimelineRuler = useCallback(({ layoutProgressRef, lineScrollRef, totalCards }) => {
    const meshRef = useRef();
    const count = totalCards * 4; // 4 lines per card
    const spacing = 2.05 / 4; 
    
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame(() => {
      if (!meshRef.current) return;
      const progress = layoutProgressRef.current?.value || 0;
      
      if (progress < 0.01) {
        meshRef.current.visible = false;
        return;
      }
      meshRef.current.visible = true;
      
      const scroll = lineScrollRef.current;
      const totalWidth = totalCards * 2.05;
      
      for (let i = 0; i < count; i++) {
        let rawX = i * spacing - scroll;
        
        // Wrap logic (same as cards)
        while (rawX > totalWidth / 2) rawX -= totalWidth;
        while (rawX < -totalWidth / 2) rawX += totalWidth;
        
        const angle = rawX / 16.0;
        
        // Dynamic height scaling: Center is tall, edges are short
        const dist = Math.abs(rawX);
        const scaleY = Math.max(0.1, Math.exp(-dist * dist * 0.04)) * 0.8;
        
        const currentScaleY = scaleY * progress;
        
        // Position below cards (-2.5) and further back on the radius
        dummy.position.set(Math.sin(angle) * 16.0, -2.5, Math.cos(angle) * 16.0 - 16.0);
        dummy.rotation.y = angle;
        
        // Mark every 4th line as taller and slightly wider
        const isMajor = i % 4 === 0;
        dummy.scale.set(isMajor ? 0.02 : 0.012, currentScaleY * (isMajor ? 1.5 : 1.0), 1);
        
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
      <instancedMesh ref={meshRef} args={[null, null, count]} renderOrder={80}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.65} depthWrite={false} />
      </instancedMesh>
    );
  }, []);

  return (
    <group ref={groupRef}>
      {activeList.map((movie, idx) => {
        const item = sphereItems[idx];
        if (!item) return null;
        return (
          <ImageCard
            key={movie.title + '_' + movie.year}
            movie={movie}
            initialData={item}
            totalCards={activeList.length}
            layoutProgressRef={layoutProgressRef}
            lineScrollRef={lineScrollRef}
            layoutMode={layoutMode}
            theme={theme}
            sphereRadius={sphereRadius}
            cardDimensions={cardDimensions}
            isHovered={hoveredIndex === idx}
            isSelected={selectedIndex === idx}
            isAnySelected={selectedIndex !== null}
            activeCategory={activeCategory}
            entranceProgress={entranceProgress}
            onHover={handleCardHover}
            onUnhover={handleCardUnhover}
            onClick={handleCardClick}
            geometry={sharedCardGeometry}
          />
        );
      })}
      <TimelineRuler 
        layoutProgressRef={layoutProgressRef} 
        lineScrollRef={lineScrollRef} 
        totalCards={activeList.length} 
      />
    </group>
  );
}
