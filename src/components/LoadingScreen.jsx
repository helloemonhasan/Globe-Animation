import React, { useEffect, useState } from 'react';

export function LoadingScreen({ isLoaded, onLoadedComplete }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      // Smooth simulated progress from 0 to near 100
      if (current < 98) {
        current += Math.floor(Math.random() * 8) + 3;
        setProgress(Math.min(current, 98));
      }
    }, 40);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      setProgress(100);
      const timer = setTimeout(() => {
        setFadeOut(true);
        const completeTimer = setTimeout(() => {
          onLoadedComplete?.();
        }, 800);
        return () => clearTimeout(completeTimer);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, onLoadedComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#050505',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: fadeOut ? 'none' : 'all',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: 'none'
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '360px', padding: '24px' }}>
        <div
          style={{
            fontFamily: "Inter, 'San Francisco', sans-serif",
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0em',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '16px'
          }}
        >
          Academy Archive • Oscar Globe
        </div>

        <div className="bold-loading-number" style={{ fontFamily: "Inter, 'San Francisco', sans-serif" }}>
          {progress}
          <span style={{ fontSize: '32px', color: 'rgba(255,255,255,0.45)', marginLeft: '8px', fontWeight: 500, fontFamily: "Inter, 'San Francisco', sans-serif" }}>%</span>
        </div>

        {/* Minimal Progress Line */}
        <div
          style={{
            width: '180px',
            height: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.14)',
            margin: '0 auto 20px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${progress}%`,
              backgroundColor: '#ffffff',
              transition: 'width 0.25s ease-out'
            }}
          />
        </div>

        <div
          style={{
            fontFamily: "Inter, 'San Francisco', sans-serif",
            fontSize: '12px',
            letterSpacing: '0em',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.45)'
          }}
        >
          Initializing Spherical Archive
        </div>
      </div>
    </div>
  );
}
