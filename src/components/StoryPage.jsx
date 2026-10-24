import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  ArrowDown, 
  RotateCcw, 
  Sun, 
  Moon, 
  Award, 
  Sparkles, 
  Camera, 
  Music, 
  Clapperboard, 
  Users, 
  Layers 
} from 'lucide-react';
import { BIRDMAN_STORY_DATA } from '../data/birdmanStoryData';
import { StoryGlobeIntro } from './StoryGlobeIntro';
import { sounds } from './AudioEffects';
import './StoryPage.css';

export function StoryPage({
  theme = 'dark',
  onToggleTheme,
  onNavigateToArchive,
  activeTab = 'story'
}) {
  const [showIntroAnim, setShowIntroAnim] = useState(true);
  const narrativeRef = useRef(null);

  const handleScrollToContent = () => {
    try {
      sounds?.playClick?.();
    } catch {}
    if (narrativeRef.current) {
      narrativeRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReplayIntro = () => {
    try {
      sounds?.playClick?.();
    } catch {}
    setShowIntroAnim(true);
  };

  const isLight = theme === 'light';
  const story = BIRDMAN_STORY_DATA;

  return (
    <div className={`story-page-container ${isLight ? 'light-mode' : ''}`}>
      {/* 1. 3D Globe-to-16:9 Morph Intro Overlay */}
      {showIntroAnim && (
        <StoryGlobeIntro
          onComplete={() => setShowIntroAnim(false)}
          onSkip={() => setShowIntroAnim(false)}
        />
      )}

      {/* 2. Sticky Story Top Navbar */}
      <nav className="story-top-navbar" aria-label="Story Navigation">
        <div className="story-nav-brand">
          <span className="story-brand-badge">Monolith</span>
          <span className="story-brand-text">Ciné-Revue</span>
        </div>

        {/* Tab Switching Pill: [ ARCHIVE | STORY ] */}
        <div className="story-nav-tabs">
          <button
            className={`story-nav-tab-btn ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => {
              try {
                sounds?.playClick?.();
              } catch {}
              onNavigateToArchive?.();
            }}
          >
            3D Archive
          </button>
          <button
            className={`story-nav-tab-btn ${activeTab === 'story' ? 'active' : ''}`}
          >
            Story
          </button>
        </div>

        {/* Action Controls */}
        <div className="story-nav-actions">
          {/* Replay Intro Transition */}
          <button
            className="story-btn-icon"
            onClick={handleReplayIntro}
            title="Replay Globe to 16:9 Intro Animation"
            aria-label="Replay Intro"
          >
            <RotateCcw size={15} />
          </button>

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              className="story-btn-icon"
              onClick={() => {
                try {
                  sounds?.playClick?.();
                } catch {}
                onToggleTheme();
              }}
              title="Toggle Light/Dark Theme"
              aria-label="Toggle Theme"
            >
              {isLight ? <Moon size={15} /> : <Sun size={15} />}
            </button>
          )}

          {/* Back to Sphere */}
          <button
            className="story-btn-back"
            onClick={() => {
              try {
                sounds?.playClick?.();
              } catch {}
              onNavigateToArchive?.();
            }}
          >
            <ArrowLeft size={14} />
            <span>Archive Globe</span>
          </button>
        </div>
      </nav>

      {/* 3. Hero Section: 16:9 Cinematic Full-Bleed */}
      <section className="story-hero-section">
        {/* Full-bleed 16:9 Widescreen Image */}
        <img
          src={story.heroBackdrop}
          alt="Birdman 16:9 Cinematic Hero"
          className="story-hero-backdrop-img"
        />
        <div className="story-hero-gradient-overlay" />

        {/* Hero Content */}
        <div className="story-hero-content">
          <div className="story-folio-badge">
            <Award size={14} style={{ color: '#d4af37' }} />
            <span>{story.academyEdition} • {story.academyWins}</span>
          </div>

          <h1 className="story-hero-title">
            {story.title}
          </h1>

          <div className="story-hero-subtitle">
            {story.fullTitle.replace('Birdman or ', '')}
          </div>

          <p className="story-hero-tagline">
            {story.logline}
          </p>

          <div className="story-hero-cta-row">
            <button className="story-btn-primary" onClick={handleScrollToContent}>
              <span>Explore The Story</span>
              <ArrowDown size={16} />
            </button>

            <button className="story-btn-secondary" onClick={handleReplayIntro}>
              <RotateCcw size={14} />
              <span>Replay 3D Intro</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. Editorial Story Narrative & Chapters */}
      <main className="story-narrative-wrapper" ref={narrativeRef}>
        {/* Full-Width Pull Quote */}
        <div style={{ textAlign: 'center', margin: '0 auto 80px', maxWidth: '840px' }}>
          <div style={{ fontSize: '72px', fontFamily: "'Cinzel', serif", color: '#d4af37', lineHeight: '40px', opacity: 0.35 }}>
            “
          </div>
          <blockquote style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(26px, 3.2vw, 38px)', fontStyle: 'italic', margin: '14px 0', lineHeight: 1.35 }}>
            {story.pullQuote.replace(/^“|”$/g, '')}
          </blockquote>
          <cite style={{ fontFamily: "'Cinzel', serif", fontSize: '12px', letterSpacing: '0.18em', color: '#d4af37', textTransform: 'uppercase' }}>
            — {story.pullQuoteAttribution}
          </cite>
        </div>

        {/* Chapters */}
        {story.chapters.map((chapter, idx) => {
          const still = story.stills[idx + 1] || story.stills[0];

          return (
            <article key={idx} className="story-chapter-block">
              <header className="story-chapter-header">
                <span className="chapter-number-pill">CHAPTER {chapter.number}</span>
                <h2 className="chapter-title">{chapter.title}</h2>
                <div className="chapter-subtitle">{chapter.subtitle}</div>
              </header>

              <div className="story-asymmetric-chapter-grid">
                <div className="story-chapter-text-col">
                  <p>
                    <span className="story-drop-cap">{chapter.leadParagraph.charAt(0)}</span>
                    {chapter.leadParagraph.slice(1)}
                  </p>
                  {chapter.paragraphs.map((p, pIdx) => (
                    <p key={pIdx}>{p}</p>
                  ))}
                </div>

                <aside className="story-chapter-side-col">
                  <img
                    src={still.url}
                    alt={still.caption}
                    className="chapter-still-img"
                    loading="lazy"
                  />
                  <div className="chapter-still-caption">
                    {still.caption}
                  </div>
                </aside>
              </div>
            </article>
          );
        })}

        {/* 16:9 Widescreen Film Stills Showcase */}
        <section className="story-gallery-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
            <Camera size={18} style={{ color: '#d4af37' }} />
            <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              Cinematic Stills & Visual Language (16:9)
            </h3>
          </div>

          <div className="story-gallery-grid">
            {story.stills.map((still, idx) => (
              <figure key={idx} className="gallery-card-16-9">
                <img src={still.url} alt={still.caption} loading="lazy" />
                <figcaption className="gallery-card-desc">
                  {still.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* The Director: Alejandro G. Iñárritu */}
        <section style={{ marginBottom: '90px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
            <Sparkles size={18} style={{ color: '#d4af37' }} />
            <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              The Director's Monograph
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '32px' }}>
            <div>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #d4af37 0%, #876d1e 100%)', color: '#07080a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cinzel', serif", fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>
                {story.director.monogram}
              </div>
              <h4 style={{ fontFamily: "'Cinzel', serif", fontSize: '24px', margin: '0 0 6px 0' }}>{story.director.name}</h4>
              <div style={{ color: '#d4af37', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>{story.director.title}</div>
              <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '20px' }}>{story.director.born}</div>
              <p style={{ fontSize: '14px', lineHeight: 1.6, opacity: 0.85 }}>{story.director.bio}</p>
            </div>

            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: '11px', letterSpacing: '0.18em', color: '#d4af37', textTransform: 'uppercase', marginBottom: '14px', fontWeight: 700 }}>
                Directorial Trademarks
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {story.director.signatureStyle.map((s, idx) => (
                  <li key={idx} style={{ fontSize: '13px', opacity: 0.8, position: 'relative', paddingLeft: '18px' }}>
                    <span style={{ position: 'absolute', left: 0, color: '#d4af37' }}>♦</span>
                    {s}
                  </li>
                ))}
              </ul>

              <div style={{ background: 'rgba(212, 175, 55, 0.05)', borderLeft: '3px solid #d4af37', padding: '20px', borderRadius: '0 4px 4px 0' }}>
                <blockquote style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '18px', fontStyle: 'italic', margin: '0 0 8px 0', lineHeight: 1.45 }}>
                  {story.director.quote}
                </blockquote>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '11px', color: '#d4af37', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  — {story.director.name}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Crew & Cast Directory */}
        <section style={{ marginBottom: '80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
            <Users size={18} style={{ color: '#d4af37' }} />
            <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '20px', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              Film Crew & Principal Cast
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {story.crew.map((c, idx) => (
              <div key={idx} style={{ padding: '20px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', color: '#d4af37', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {c.dept}
                </div>
                <h5 style={{ fontFamily: "'Cinzel', serif", fontSize: '16px', margin: '0 0 6px 0' }}>{c.name}</h5>
                <p style={{ fontSize: '13px', lineHeight: 1.5, opacity: 0.7, margin: 0 }}>{c.notes}</p>
              </div>
            ))}
          </div>

          {/* Cast Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
            {story.cast.map((member, idx) => (
              <div key={idx} style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', fontWeight: 600 }}>{member.actor}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: '13px', opacity: 0.65 }}>as {member.role}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Navigation */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <button
            className="story-btn-primary"
            onClick={() => {
              try {
                sounds?.playClick?.();
              } catch {}
              onNavigateToArchive?.();
            }}
          >
            <span>Return to 3D Sphere & Line Archive</span>
            <ArrowLeft size={16} />
          </button>

          <div style={{ fontSize: '12px', opacity: 0.5, letterSpacing: '0.06em', textAlign: 'center' }}>
            MONOLITH ARCHIVE // BIRDMAN (2014) CINEMATIC PRESENTATION
          </div>
        </footer>
      </main>
    </div>
  );
}
