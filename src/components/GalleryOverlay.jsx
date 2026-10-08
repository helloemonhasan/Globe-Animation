import React, { useState } from 'react';
import { Volume2, VolumeX, Play, Pause, Radio, Sun, Moon } from 'lucide-react';
import { CATEGORIES } from '../data/movies';
import { sounds } from './AudioEffects';
import { gothicSpaceMusic } from './GothicSpaceAudio';

export function GalleryOverlay({
  isOpen = false,
  layoutMode = 'globe',
  theme = 'dark',
  onToggleTheme,
  onSelectLayoutMode,
  activeCategory,
  onSelectCategory,
  isAutoRotatePaused,
  onToggleAutoRotate,
  cardCount,
  hoveredProject,
  isDragging
}) {
  const [audioEnabled, setAudioEnabled] = useState(false);

  const handleToggleSound = () => {
    sounds.init();
    const isPlaying = gothicSpaceMusic.toggle();
    sounds.enabled = isPlaying;
    setAudioEnabled(isPlaying);
  };

  const isLight = theme === 'light';
  const textPrimary = isLight ? '#111113' : '#ffffff';
  const textSecondary = isLight ? 'rgba(0, 0, 0, 0.55)' : 'rgba(255, 255, 255, 0.65)';
  const textMuted = isLight ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.45)';
  const borderPill = isLight ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.22)';
  const bgPill = isLight ? 'rgba(255, 255, 255, 0.88)' : 'rgba(12, 12, 16, 0.85)';
  const activeBtnBg = isLight ? '#111113' : '#ffffff';
  const activeBtnColor = isLight ? '#ffffff' : '#050505';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: isOpen ? 'none' : 'none',
        opacity: isOpen ? 0 : 1,
        transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(18px, 3.5vw, 40px)',
        zIndex: 10,
        boxSizing: 'border-box',
        userSelect: 'none'
      }}
    >
      {/* Top Header Row */}
      <header
        className="overlay-header"
        style={{
          pointerEvents: isOpen ? 'none' : 'auto'
        }}
      >
        {/* Top Left: Oscar Studio Branding */}
        <div className="header-left">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isDragging ? '#ff5252' : textPrimary,
                boxShadow: isDragging ? '0 0 10px #ff5252' : isLight ? '0 0 8px rgba(0,0,0,0.3)' : '0 0 8px rgba(255,255,255,0.7)',
                transition: 'all 0.3s ease'
              }}
            />
            <span
              style={{
                fontFamily: "Inter, 'San Francisco', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0em',
                color: textPrimary
              }}
            >
              Academy Archive
            </span>
          </div>
          <div
            style={{
              fontFamily: "Inter, 'San Francisco', sans-serif",
              fontSize: '12px',
              letterSpacing: '0em',
              fontWeight: 500,
              color: textSecondary
            }}
          >
            {layoutMode === 'line' ? 'Oscar Best Picture Ribbon • 1972–2023' : 'Oscar Best Picture Globe • 1972–2023'}
          </div>
        </div>

        {/* Top Center: Globe / Line Mode Toggle + Live Hovered Movie Preview pill */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
          {/* Segmented [ GLOBE | LINE ] Text Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: isLight ? '#f2f2f7' : '#1c1c1e',
              border: isLight ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid #2c2c2e',
              padding: '3px',
              borderRadius: '999px',
              gap: '2px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease'
            }}
            className="layout-mode-toggle"
          >
            <button
              onClick={() => onSelectLayoutMode?.('globe')}
              style={{
                background: layoutMode === 'globe' ? (isLight ? '#ffffff' : '#3a3a3c') : 'transparent',
                color: layoutMode === 'globe' ? (isLight ? '#111113' : '#ffffff') : (isLight ? '#8e8e93' : '#98989d'),
                border: 'none',
                borderRadius: '999px',
                padding: '5px 14px',
                fontFamily: "Inter, 'San Francisco', sans-serif",
                fontSize: '12px',
                fontWeight: layoutMode === 'globe' ? 600 : 500,
                letterSpacing: '0em',
                cursor: 'pointer',
                boxShadow: layoutMode === 'globe' ? (isLight ? '0 1px 4px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.3)') : 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => {
                if (layoutMode !== 'globe') e.currentTarget.style.color = isLight ? '#111113' : '#ffffff';
              }}
              onMouseLeave={(e) => {
                if (layoutMode !== 'globe') e.currentTarget.style.color = isLight ? '#8e8e93' : '#98989d';
              }}
            >
              Globe
            </button>
            <button
              onClick={() => onSelectLayoutMode?.('line')}
              style={{
                background: layoutMode === 'line' ? (isLight ? '#ffffff' : '#3a3a3c') : 'transparent',
                color: layoutMode === 'line' ? (isLight ? '#111113' : '#ffffff') : (isLight ? '#8e8e93' : '#98989d'),
                border: 'none',
                borderRadius: '999px',
                padding: '5px 14px',
                fontFamily: "Inter, 'San Francisco', sans-serif",
                fontSize: '12px',
                fontWeight: layoutMode === 'line' ? 600 : 500,
                letterSpacing: '0em',
                cursor: 'pointer',
                boxShadow: layoutMode === 'line' ? (isLight ? '0 1px 4px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.3)') : 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => {
                if (layoutMode !== 'line') e.currentTarget.style.color = isLight ? '#111113' : '#ffffff';
              }}
              onMouseLeave={(e) => {
                if (layoutMode !== 'line') e.currentTarget.style.color = isLight ? '#8e8e93' : '#98989d';
              }}
            >
              Line
            </button>
          </div>

          {/* Live Hovered Movie Preview pill */}
          <div
            style={{
              display: 'none',
              opacity: hoveredProject ? 1 : 0,
              transform: hoveredProject ? 'translateY(0)' : 'translateY(-6px)',
              transition: 'all 0.25s ease',
              backgroundColor: isLight ? '#f2f2f7' : '#1c1c1e',
              border: isLight ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid #2c2c2e',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
              padding: '4px 14px',
              borderRadius: '999px',
              alignItems: 'baseline',
              gap: '8px'
            }}
            className="desktop-hover-pill"
          >
            {hoveredProject && (
              <>
                <span
                  style={{
                    fontFamily: "Inter, 'San Francisco', sans-serif",
                    fontSize: '11px',
                    color: textPrimary,
                    fontWeight: 600,
                    letterSpacing: '0em'
                  }}
                >
                  {hoveredProject.year}
                </span>
                <span
                  style={{
                    fontFamily: "Inter, 'San Francisco', sans-serif",
                    fontSize: '13px',
                    fontWeight: 600,
                    color: textPrimary,
                    letterSpacing: '-0.01em'
                  }}
                >
                  {hoveredProject.title}
                </span>
                <span
                  style={{
                    fontFamily: "Inter, 'San Francisco', sans-serif",
                    fontSize: '11px',
                    fontWeight: 400,
                    letterSpacing: '0em',
                    color: textSecondary
                  }}
                >
                  {hoveredProject.director || 'Best Picture'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Top Right: Selected Work & Utility Controls */}
        <div className="header-right" style={{ gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <span
              style={{
                fontFamily: "Inter, 'San Francisco', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0em',
                color: textPrimary
              }}
            >
              Oscar Winners
            </span>
            <span
              style={{
                fontFamily: "Inter, 'San Francisco', sans-serif",
                fontSize: '13px',
                color: textSecondary,
                fontWeight: 500
              }}
            >
              {cardCount} Films
            </span>
          </div>


        </div>
      </header>

      {/* Bottom Interface Controls & Navigation */}
      <footer
        className="overlay-footer"
        style={{
          pointerEvents: isOpen ? 'none' : 'auto'
        }}
      >
        {/* Category Filters Bar */}
        <nav
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            justifyContent: 'center',
            gap: '2px',
            backgroundColor: isLight ? '#f2f2f7' : '#1c1c1e',
            border: isLight ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid #2c2c2e',
            padding: '3px',
            borderRadius: '999px',
            maxWidth: '95vw',
            overflowX: 'auto',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const label = cat === 'ALL' ? 'All' : (cat === 'CLASSICS' ? 'Classics' : cat);
            
            return (
              <button
                key={cat}
                onClick={() => {
                  try {
                    sounds.playClick();
                  } catch {}
                  onSelectCategory(cat);
                }}
                style={{
                  background: isActive ? (isLight ? '#ffffff' : '#3a3a3c') : 'transparent',
                  color: isActive ? (isLight ? '#111113' : '#ffffff') : (isLight ? '#8e8e93' : '#98989d'),
                  border: 'none',
                  height: '26px',
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: '0em',
                  fontFamily: "Inter, 'San Francisco', sans-serif",
                  boxShadow: isActive ? (isLight ? '0 1px 4px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.3)') : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = isLight ? '#111113' : '#ffffff';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = isLight ? '#8e8e93' : '#98989d';
                }}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Utility Controls Pill Container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: isLight ? '#f2f2f7' : '#1c1c1e',
            border: isLight ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid #2c2c2e',
            padding: '3px',
            borderRadius: '999px',
            gap: '2px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Audio Toggle */}
          <button
            onClick={handleToggleSound}
            style={{
              background: audioEnabled ? (isLight ? '#ffffff' : '#3a3a3c') : (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)'),
              color: audioEnabled ? (isLight ? '#111113' : '#ffffff') : (isLight ? '#8e8e93' : '#98989d'),
              border: 'none',
              borderRadius: '50%',
              width: '26px',
              height: '26px',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: audioEnabled ? (isLight ? '0 1px 4px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.3)') : 'none',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              flexShrink: 0,
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => {
              if (!audioEnabled) e.currentTarget.style.color = isLight ? '#111113' : '#ffffff';
            }}
            onMouseLeave={(e) => {
              if (!audioEnabled) e.currentTarget.style.color = isLight ? '#8e8e93' : '#98989d';
            }}
            title={audioEnabled ? 'Mute Sound' : 'Play Sound'}
          >
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '2px', 
                height: '10px'
              }}
            >
              {[1, 2, 3].map((i) => {
                const isActiveHeight = i === 2 ? '3px' : '7px';
                return (
                  <span 
                    key={i}
                    className={audioEnabled ? 'audio-bar playing' : 'audio-bar'} 
                    style={{ 
                      backgroundColor: 'currentColor', 
                      height: audioEnabled ? isActiveHeight : '2px', 
                      width: '2px',
                      opacity: 1, 
                      borderRadius: '99px', 
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' 
                    }} 
                  />
                );
              })}
            </div>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => {
              try {
                sounds.playClick();
              } catch {}
              onToggleTheme?.();
            }}
            style={{
              background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
              color: isLight ? '#8e8e93' : '#98989d',
              border: 'none',
              borderRadius: '50%',
              width: '26px',
              height: '26px',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = isLight ? '#111113' : '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = isLight ? '#8e8e93' : '#98989d';
            }}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {isLight ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        </div>
      </footer>
    </div>
  );
}
