import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import './App.css';

import { movies } from './data/movies';
import { SphereGallery } from './components/SphereGallery';
import { CameraRig } from './components/CameraRig';
import { GalleryOverlay } from './components/GalleryOverlay';
import { ProjectModal } from './components/ProjectModal';
import { LoadingScreen } from './components/LoadingScreen';
import { gothicSpaceMusic } from './components/GothicSpaceAudio';
import { sounds } from './components/AudioEffects';

export default function App() {
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hoveredMovie, setHoveredMovie] = useState(null);
  const [isAutoRotatePaused, setIsAutoRotatePaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Responsive device setup: card count, sphere radius and vertical 2:3 card dimensions
  const [viewportConfig, setViewportConfig] = useState(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    if (width < 640) {
      return { count: 24, radius: 5.2, dimensions: [0.98, 1.47], cameraZ: 13.8 };
    } else if (width < 1024) {
      return { count: 36, radius: 6.2, dimensions: [1.12, 1.68], cameraZ: 14.0 };
    } else {
      return { count: 48, radius: 7.4, dimensions: [1.25, 1.88], cameraZ: 14.2 };
    }
  });

  // Entrance progress ref initialized to 0.0 so cards scale up gracefully
  const entranceProgressRef = useRef({ value: 0.0 });

  // Detect media query for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Responsive window resize listener
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setViewportConfig({ count: 24, radius: 5.2, dimensions: [0.98, 1.47], cameraZ: 13.8 });
      } else if (width < 1024) {
        setViewportConfig({ count: 36, radius: 6.2, dimensions: [1.12, 1.68], cameraZ: 14.0 });
      } else {
        setViewportConfig({ count: 48, radius: 7.4, dimensions: [1.25, 1.88], cameraZ: 14.2 });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Active movie list sliced according to responsive card count
  const activeMovies = useMemo(() => {
    return movies.slice(0, viewportConfig.count);
  }, [viewportConfig.count]);

  // Preload poster textures before displaying the sphere
  useEffect(() => {
    let loadedCount = 0;
    const targetPreload = Math.min(16, activeMovies.length);

    activeMovies.slice(0, targetPreload).forEach((movie) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = movie.poster;
      img.onload = img.onerror = () => {
        loadedCount++;
        if (loadedCount >= targetPreload) {
          setIsAssetsLoaded(true);
        }
      };
    });

    const fallbackTimer = setTimeout(() => {
      setIsAssetsLoaded(true);
    }, 2200);

    return () => clearTimeout(fallbackTimer);
  }, [activeMovies]);

  // Trigger smooth GSAP entrance expansion when loaded
  const handleLoadingComplete = useCallback(() => {
    gsap.fromTo(
      entranceProgressRef.current,
      { value: 0.0 }, // Start from 0 for a small globe
      {
        value: 1.0,
        duration: prefersReducedMotion ? 0.5 : 3.0, // A bit longer to feel the journey
        ease: 'power3.inOut' // Smooth easing
      }
    );
  }, [prefersReducedMotion]);

  // Next / Previous navigation within selected modal
  const handleNextMovie = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev === null) return 0;
      return (prev + 1) % activeMovies.length;
    });
  }, [activeMovies.length]);

  const handlePrevMovie = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev === null) return activeMovies.length - 1;
      return (prev - 1 + activeMovies.length) % activeMovies.length;
    });
  }, [activeMovies.length]);

  const selectedMovie = selectedIndex !== null ? activeMovies[selectedIndex] : null;

  // Handle mouse wheel / trackpad scroll when popup is open to change movies one after another
  const wheelAccumulatorRef = useRef(0);
  const lastWheelStepTimeRef = useRef(0);

  useEffect(() => {
    if (selectedIndex === null) {
      wheelAccumulatorRef.current = 0;
      return;
    }

    const handleWheelPopup = (e) => {
      // Prevent browser native scrolling
      e.preventDefault();

      const now = performance.now();
      wheelAccumulatorRef.current += e.deltaY;

      // Sensitive threshold for trackpads and mouse wheels
      const threshold = 35;
      const cooldownMs = 220; // Snappy stepping one after another

      if (Math.abs(wheelAccumulatorRef.current) >= threshold && now - lastWheelStepTimeRef.current > cooldownMs) {
        lastWheelStepTimeRef.current = now;
        if (wheelAccumulatorRef.current > 0) {
          handleNextMovie();
        } else {
          handlePrevMovie();
        }
        wheelAccumulatorRef.current = 0;
      }
    };

    window.addEventListener('wheel', handleWheelPopup, { passive: false });
    return () => window.removeEventListener('wheel', handleWheelPopup);
  }, [selectedIndex, handleNextMovie, handlePrevMovie]);

  const [layoutMode, setLayoutMode] = useState('globe'); // 'globe' | 'line'
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'

  const handleSelectLayoutMode = useCallback((mode) => {
    try {
      sounds?.playClick?.();
    } catch {}
    setLayoutMode(mode);
  }, []);

  const handleToggleTheme = useCallback(() => {
    try {
      sounds?.playClick?.();
    } catch {}
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Synchronize data-theme on root document element for CSS variables & styling
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Modulate gothic space soundscape when a card is inspected
  useEffect(() => {
    gothicSpaceMusic.onFocus(selectedIndex !== null);
  }, [selectedIndex]);

  return (
    <main className={`gallery-container ${theme === 'light' ? 'light-mode' : ''}`}>
      {/* Cinematic Vignette Overlay */}
      <div className="vignette-overlay" />

      {/* 3D WebGL Canvas */}
      <div className="canvas-wrapper">
        <Canvas
          camera={{
            position: [0, 0, viewportConfig.cameraZ + 2.0],
            fov: 38,
            near: 0.1,
            far: 100
          }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
          }}
        >
          <color attach="background" args={[theme === 'light' ? '#f4f4f6' : '#050505']} />

          {/* Minimal ambient light for scene depth */}
          <ambientLight intensity={theme === 'light' ? 1.45 : 1.2} />

          {/* Camera Dolly & Scroll/Parallax Rig */}
          <CameraRig
            entranceProgress={entranceProgressRef}
            isSelected={selectedIndex !== null}
            baseCameraZ={viewportConfig.cameraZ}
          />

          {/* 3D Gallery of Oscar Movie Cards (Globe or Curved Line) */}
          <SphereGallery
            movies={activeMovies}
            layoutMode={layoutMode}
            theme={theme}
            sphereRadius={viewportConfig.radius}
            cardDimensions={viewportConfig.dimensions}
            selectedIndex={selectedIndex}
            onSelectIndex={setSelectedIndex}
            activeCategory={activeCategory}
            entranceProgress={entranceProgressRef}
            prefersReducedMotion={prefersReducedMotion}
            autoRotateSpeed={0.0012}
            isAutoRotatePaused={isAutoRotatePaused}
            onHoverCard={setHoveredMovie}
            setIsDraggingState={setIsDragging}
          />
        </Canvas>
      </div>

      {/* Editorial Oscar UI & Categories */}
      <GalleryOverlay
        isOpen={selectedIndex !== null}
        layoutMode={layoutMode}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onSelectLayoutMode={handleSelectLayoutMode}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        isAutoRotatePaused={isAutoRotatePaused}
        onToggleAutoRotate={() => setIsAutoRotatePaused((p) => !p)}
        cardCount={activeMovies.length}
        hoveredProject={selectedIndex !== null ? null : hoveredMovie}
        prefersReducedMotion={prefersReducedMotion}
        isDragging={isDragging}
      />

      {/* Detailed Movie Inspection Modal */}
      {selectedMovie && (
        <ProjectModal
          movie={selectedMovie}
          project={selectedMovie}
          theme={theme}
          selectedIndex={selectedIndex}
          totalCount={activeMovies.length}
          onClose={() => setSelectedIndex(null)}
          onNext={handleNextMovie}
          onPrev={handlePrevMovie}
        />
      )}

      {/* Minimalist Editorial Loading Screen */}
      <LoadingScreen
        isLoaded={isAssetsLoaded}
        onLoadedComplete={handleLoadingComplete}
      />
    </main>
  );
}
