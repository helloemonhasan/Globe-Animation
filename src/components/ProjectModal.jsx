import React, { useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, ExternalLink, Calendar, Film, Award } from 'lucide-react';
import { sounds } from './AudioEffects';

export function ProjectModal({
  movie,
  project, // fallback alias
  theme = 'dark',
  selectedIndex,
  totalCount,
  onClose,
  onNext,
  onPrev
}) {
  const currentMovie = movie || project;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        sounds.playClick();
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        sounds.playClick();
        onNext?.();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        sounds.playClick();
        onPrev?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  // Touch swipe support for smooth mobile and trackpad browsing
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e) => {
      if (e.touches && e.touches[0]) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > 40 || Math.abs(dy) > 40) {
          sounds.playClick();
          if (Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) onNext?.();
            else onPrev?.();
          } else {
            if (dy < 0) onNext?.();
            else onPrev?.();
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onNext, onPrev]);

  if (!currentMovie) return null;

  const isLight = theme === 'light';
  const textPrimary = isLight ? '#111113' : '#ffffff';
  const textSecondary = isLight ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.75)';
  const textDim = isLight ? 'rgba(0, 0, 0, 0.55)' : 'rgba(255, 255, 255, 0.78)';
  const borderSubtle = isLight ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.22)';
  const bgPill = isLight ? 'rgba(255, 255, 255, 0.88)' : 'rgba(12, 12, 16, 0.85)';
  const bgBtn = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)';
  const bottomGradient = isLight
    ? 'linear-gradient(to top, rgba(245,245,247,0.96) 0%, rgba(245,245,247,0) 100%)'
    : 'linear-gradient(to top, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0) 100%)';

  return (
    <div
      className="modal-container-fluid"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(20px, 4vw, 48px)',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Header Bar */}
      <div
        className="modal-header-fluid"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span
            style={{
              fontFamily: "Inter, 'San Francisco', sans-serif",
              fontSize: '13px',
              letterSpacing: '0em',
              color: textPrimary,
              fontWeight: 600
            }}
          >
            {currentMovie.year} Archive
          </span>
          <span
            style={{
              height: '12px',
              width: '1px',
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.18)' : 'rgba(255, 255, 255, 0.25)'
            }}
          />
          <span
            style={{
              fontFamily: "Inter, 'San Francisco', sans-serif",
              fontSize: '13px',
              letterSpacing: '0em',
              color: textSecondary,
              fontWeight: 500
            }}
          >
            {currentMovie.award || 'Best Picture'}
          </span>
        </div>

        {/* Top Center: Scroll Navigation Hint */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: bgPill,
            border: borderSubtle,
            padding: '5px 16px',
            borderRadius: '999px',
            backdropFilter: 'blur(16px)',
            fontFamily: "Inter, 'San Francisco', sans-serif",
            fontSize: '12px',
            letterSpacing: '0em',
            color: textPrimary,
            boxShadow: isLight ? '0 4px 20px rgba(0, 0, 0, 0.08)' : 'none'
          }}
          className="modal-scroll-pill modal-pill-fluid"
        >
          <span style={{ color: textPrimary, fontWeight: 600 }}>Scroll</span>
          <span style={{ opacity: 0.6 }}>•</span>
          <span>Film {selectedIndex !== undefined ? selectedIndex + 1 : 1} of {totalCount}</span>
        </div>

        {/* Close Button */}
        <button
          className="modal-action-btn-fluid"
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          style={{
            backgroundColor: isLight ? '#111113' : '#ffffff',
            color: isLight ? '#ffffff' : '#050505',
            border: 'none',
            padding: '11px 24px',
            borderRadius: '999px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            letterSpacing: '0em',
            fontWeight: 600,
            fontFamily: "Inter, 'San Francisco', sans-serif",
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            boxShadow: isLight ? '0 4px 20px rgba(0, 0, 0, 0.15)' : '0 0 24px rgba(255, 255, 255, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = isLight ? '0 6px 24px rgba(0, 0, 0, 0.2)' : '0 0 30px rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isLight ? '0 4px 20px rgba(0, 0, 0, 0.15)' : '0 0 24px rgba(255, 255, 255, 0.2)';
          }}
        >
          <span>Close</span>
          <span style={{ opacity: 0.6, fontSize: '12px', fontWeight: 500 }}>[ESC]</span>
          <X size={15} />
        </button>
      </div>

      {/* Smooth Bottom Gradient Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '45vh',
          background: bottomGradient,
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Bottom Editorial Details Panel */}
      <div
        className="modal-details-fluid"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '24px',
          pointerEvents: 'auto',
          paddingTop: '40px',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{ maxWidth: '560px' }}>
          <div
            style={{
              fontFamily: "Inter, 'San Francisco', sans-serif",
              fontSize: '14px',
              letterSpacing: '0em',
              color: textSecondary,
              marginBottom: '10px',
              fontWeight: 600
            }}
          >
            Academy Award® Winner • {currentMovie.year}
          </div>

          <h2
            style={{
              fontFamily: "Inter, 'San Francisco', sans-serif",
              fontSize: 'clamp(36px, 4.8vw, 58px)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: textPrimary,
              margin: '0 0 12px 0',
              lineHeight: 1.05
            }}
          >
            {currentMovie.title}
          </h2>

          <p
            style={{
              fontFamily: "Inter, 'San Francisco', sans-serif",
              fontSize: '16px',
              lineHeight: 1.55,
              color: textDim,
              margin: '0 0 20px 0',
              maxWidth: '490px'
            }}
          >
            Honored with the Academy Award® for Best Picture. Directed by {currentMovie.director}. Theatrical presentation archived in 2:3 vertical aspect ratio.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '22px',
              fontSize: '13px',
              letterSpacing: '0em',
              color: textPrimary,
              fontFamily: "Inter, 'San Francisco', sans-serif",
              fontWeight: 500
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Film size={13} style={{ color: textPrimary, opacity: 0.8 }} />
              {currentMovie.director}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Calendar size={13} style={{ color: textPrimary, opacity: 0.8 }} />
              {currentMovie.year}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Award size={13} style={{ color: textPrimary, opacity: 0.8 }} />
              {currentMovie.award || 'Best Picture'}
            </span>
          </div>
        </div>

        {/* Navigation & Action Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <button
            onClick={() => {
              sounds.playClick();
              onPrev?.();
            }}
            aria-label="Previous Film"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: bgBtn,
              border: borderSubtle,
              color: textPrimary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.borderColor = isLight ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = bgBtn;
              e.currentTarget.style.borderColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.22)';
            }}
          >
            <ArrowLeft size={16} />
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onNext?.();
            }}
            aria-label="Next Film"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: bgBtn,
              border: borderSubtle,
              color: textPrimary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.borderColor = isLight ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = bgBtn;
              e.currentTarget.style.borderColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.22)';
            }}
          >
            <ArrowRight size={16} />
          </button>

          {/* VIEW POSTER CTA Removed as per user request */}
        </div>
      </div>
    </div>
  );
}
