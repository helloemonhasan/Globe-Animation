import React, { useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Award, 
  Calendar, 
  Film, 
  Clapperboard, 
  Sparkles, 
  Camera, 
  Music, 
  Layers, 
  Users, 
  Sun, 
  Moon,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { getMovieEditorial } from '../data/movieEditorialData';
import { sounds } from './AudioEffects';
import './MagazineDetailsPage.css';

export function MagazineDetailsPage({
  movie,
  selectedIndex = 0,
  totalCount = 48,
  theme = 'dark',
  onToggleTheme,
  onClose,
  onNext,
  onPrev,
  nextMovie
}) {
  const containerRef = useRef(null);

  // Retrieve or generate rich authentic editorial monograph
  const editorial = useMemo(() => {
    return getMovieEditorial(movie);
  }, [movie]);

  // Scroll to top whenever the active movie changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [movie?.title]);

  // Keyboard navigation: Escape to close, arrows for next/prev
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        sounds?.playClick?.();
        onClose?.();
      } else if (e.key === 'ArrowRight' && (e.metaKey || e.ctrlKey || e.altKey)) {
        sounds?.playClick?.();
        onNext?.();
      } else if (e.key === 'ArrowLeft' && (e.metaKey || e.ctrlKey || e.altKey)) {
        sounds?.playClick?.();
        onPrev?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  if (!movie || !editorial) return null;

  const isLight = theme === 'light';
  const director = editorial.director;
  const crew = editorial.crew;
  const stats = editorial.stats;
  const palette = editorial.palette || ['#10151f', '#d4af37', '#7b8794', '#f7f6f2'];

  return (
    <div 
      className="magazine-viewport" 
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${editorial.title} Magazine Feature`}
    >
      {/* Background Lighting & Noise */}
      <div 
        className="magazine-ambient-glow" 
        style={{
          background: isLight 
            ? `radial-gradient(circle at 65% 15%, ${palette[1]}25 0%, rgba(230, 226, 218, 0.6) 50%, transparent 75%)`
            : `radial-gradient(circle at 65% 15%, ${palette[1]}22 0%, rgba(12, 14, 20, 0.6) 50%, transparent 75%)`
        }}
      />
      <div className="magazine-noise-overlay" />

      {/* Sticky Editorial Masthead Bar */}
      <header className="magazine-masthead">
        <div className="masthead-branding">
          <span className="masthead-badge">Monolith</span>
          <span className="masthead-title">Ciné-Revue</span>
          <span className="masthead-divider" />
          <span className="masthead-sub">{editorial.issueLabel}</span>
        </div>

        {/* Center Progress Pill */}
        <div className="masthead-center-counter">
          <span style={{ color: '#d4af37', fontWeight: 600 }}>Vol. {selectedIndex + 1}</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span>{totalCount}</span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span style={{ fontWeight: 600 }}>{editorial.title}</span>
        </div>

        {/* Top Actions */}
        <div className="masthead-actions">
          {/* Previous Feature Button */}
          <button 
            className="mag-nav-arrow-btn"
            onClick={() => {
              sounds?.playClick?.();
              onPrev?.();
            }}
            title="Previous Archive Film"
            aria-label="Previous Film"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Next Feature Button */}
          <button 
            className="mag-nav-arrow-btn"
            onClick={() => {
              sounds?.playClick?.();
              onNext?.();
            }}
            title="Next Archive Film"
            aria-label="Next Film"
          >
            <ArrowRight size={16} />
          </button>

          {/* Theme Switcher */}
          {onToggleTheme && (
            <button 
              className="mag-nav-arrow-btn"
              onClick={() => {
                sounds?.playClick?.();
                onToggleTheme();
              }}
              title="Toggle Reading Mode"
              aria-label="Toggle Light/Dark Theme"
            >
              {isLight ? <Moon size={15} /> : <Sun size={15} />}
            </button>
          )}

          {/* Return to Globe Button */}
          <button 
            className="mag-return-btn"
            onClick={() => {
              sounds?.playClick?.();
              onClose?.();
            }}
          >
            <span>Return to Archive</span>
            <span style={{ opacity: 0.6, fontSize: '11px' }}>[ESC]</span>
            <X size={15} />
          </button>
        </div>
      </header>

      {/* Main Editorial Article Spread */}
      <article className="magazine-article">

        {/* ------------------------------------------------------------------
            1. HERO ASYMMETRIC SPREAD (HEADLINE & OFFSET POSTER)
            ------------------------------------------------------------------ */}
        <section className="magazine-hero-spread">
          <div className="hero-editorial-col">
            <div className="hero-issue-folio">
              <span className="folio-tag">{editorial.category}</span>
              <span className="folio-line" />
            </div>

            <div className="hero-award-stamp">
              <Award size={15} style={{ color: '#d4af37' }} />
              <span>Academy Award® Winner • Best Picture ({editorial.year})</span>
            </div>

            <h1 className="hero-magazine-headline">
              {editorial.headline}
            </h1>

            <p className="hero-magazine-subheading">
              {editorial.subheading}
            </p>

            {/* Editorial Specs Matrix */}
            <div className="hero-specs-matrix">
              <div className="spec-cell">
                <span className="spec-label">Year</span>
                <span className="spec-value">{editorial.year}</span>
              </div>
              <div className="spec-cell">
                <span className="spec-label">Runtime</span>
                <span className="spec-value">{stats.runtime}</span>
              </div>
              <div className="spec-cell">
                <span className="spec-label">Academy Honors</span>
                <span className="spec-value">{stats.wins}</span>
              </div>
              <div className="spec-cell">
                <span className="spec-label">Aspect Ratio</span>
                <span className="spec-value">{stats.aspectRatio}</span>
              </div>
            </div>
          </div>

          {/* Asymmetric Offset Poster Frame */}
          <div className="hero-poster-col">
            <figure className="poster-frame-wrapper">
              <img 
                src={editorial.poster} 
                alt={`${editorial.title} theatrical poster`}
                className="poster-frame-image"
                loading="eager"
              />
              <span className="poster-corner-ribbon">
                Oscar Winner
              </span>
            </figure>

            {/* Signature Film Palette Bar */}
            <div className="poster-palette-bar">
              <span className="palette-label">Film Palette</span>
              <div className="palette-swatches">
                {palette.map((color, idx) => (
                  <span 
                    key={idx} 
                    className="palette-dot" 
                    style={{ backgroundColor: color }}
                    title={`Color code: ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------
            2. ESSAY & ASYMMETRIC CURATOR FIELD NOTES
            ------------------------------------------------------------------ */}
        <section className="magazine-essay-section">
          <div className="essay-body-col">
            {editorial.essay.map((paragraph, index) => (
              <p key={index}>
                {index === 0 && (
                  <span className="magazine-drop-cap">
                    {editorial.dropCapText || paragraph.charAt(0)}
                  </span>
                )}
                {index === 0 
                  ? paragraph.slice(1)
                  : paragraph
                }
              </p>
            ))}
          </div>

          <aside className="curator-side-card">
            <div className="curator-badge-title">
              <Sparkles size={14} />
              <span>Curator Field Notes</span>
            </div>
            <p className="curator-notes-text">
              {editorial.curatorNotes}
            </p>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', opacity: 0.65 }}>
                <Film size={13} style={{ color: '#d4af37' }} />
                <span>Production: {crew.studio || 'Theatrical Archive'}</span>
              </div>
            </div>
          </aside>
        </section>

        {/* Full-Width Pull Quote Banner */}
        <div className="magazine-pull-quote-banner">
          <span className="pull-quote-mark">“</span>
          <blockquote className="pull-quote-content">
            {editorial.pullQuote.replace(/^“|”$/g, '')}
          </blockquote>
          <cite className="pull-quote-byline">
            — {editorial.pullQuoteAuthor}
          </cite>
        </div>

        {/* ------------------------------------------------------------------
            3. SECTION: THE DIRECTOR (BIOGRAPHY & AUTEUR STUDY)
            ------------------------------------------------------------------ */}
        <section className="magazine-director-section">
          <div className="magazine-section-header">
            <span className="section-number-tag">CHAPTER 01</span>
            <h2 className="section-header-title">The Director's Monograph</h2>
          </div>

          <div className="director-asymmetric-spread">
            {/* Director Profile Badge Card */}
            <div className="director-profile-card">
              <div className="director-monogram-badge">
                {director.portraitBadge || 'DIR'}
              </div>

              <h3 className="director-card-name">{director.name}</h3>
              <div className="director-card-title">{director.title}</div>
              <div className="director-card-born">{director.born}</div>

              <div className="director-style-label">Directorial Signature</div>
              <ul className="director-style-list">
                {director.signatureStyle?.map((style, idx) => (
                  <li key={idx}>{style}</li>
                ))}
              </ul>

              {director.keyWorks && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.5, marginBottom: '6px' }}>
                    Key Works
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8, lineHeight: 1.5 }}>
                    {director.keyWorks.join(' • ')}
                  </div>
                </div>
              )}
            </div>

            {/* Director Biographical Essay */}
            <div className="director-bio-text-col">
              <p className="director-bio-lead">
                {director.bio}
              </p>

              <div className="director-philosophy-quote-box">
                <blockquote className="director-philosophy-quote">
                  {director.quote}
                </blockquote>
                <div className="director-quote-author">
                  — {director.name} on Directing
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------
            4. SECTION: FILM CREW & ENSEMBLE MASTERCLASS
            ------------------------------------------------------------------ */}
        <section className="magazine-crew-section">
          <div className="magazine-section-header">
            <span className="section-number-tag">CHAPTER 02</span>
            <h2 className="section-header-title">Film Crew & Craft Directory</h2>
          </div>

          {/* Key Creative Departments Grid */}
          <div className="crew-editorial-grid">
            {/* Cinematography */}
            <div className="crew-dept-card">
              <div className="crew-dept-tag">
                <Camera size={13} />
                <span>Cinematography (DP)</span>
              </div>
              <h4 className="crew-person-name">{crew.cinematographer}</h4>
              <p className="crew-role-notes">{crew.cinematographyNote}</p>
            </div>

            {/* Screenplay */}
            <div className="crew-dept-card">
              <div className="crew-dept-tag">
                <BookOpen size={13} />
                <span>Screenplay & Story</span>
              </div>
              <h4 className="crew-person-name">{crew.screenplay}</h4>
              <p className="crew-role-notes">{crew.screenplayNote}</p>
            </div>

            {/* Musical Score */}
            <div className="crew-dept-card">
              <div className="crew-dept-tag">
                <Music size={13} />
                <span>Original Score</span>
              </div>
              <h4 className="crew-person-name">{crew.composer}</h4>
              <p className="crew-role-notes">{crew.composerNote}</p>
            </div>

            {/* Editing */}
            <div className="crew-dept-card">
              <div className="crew-dept-tag">
                <Clapperboard size={13} />
                <span>Film Editing</span>
              </div>
              <h4 className="crew-person-name">{crew.editor}</h4>
              <p className="crew-role-notes">{crew.editorNote}</p>
            </div>

            {/* Production Design */}
            <div className="crew-dept-card">
              <div className="crew-dept-tag">
                <Layers size={13} />
                <span>Production Design</span>
              </div>
              <h4 className="crew-person-name">{crew.productionDesigner}</h4>
              <p className="crew-role-notes">{crew.productionDesignerNote}</p>
            </div>

            {/* Costume Design */}
            <div className="crew-dept-card">
              <div className="crew-dept-tag">
                <Sparkles size={13} />
                <span>Costume Design</span>
              </div>
              <h4 className="crew-person-name">{crew.costumeDesigner}</h4>
              <p className="crew-role-notes">{crew.costumeDesignerNote}</p>
            </div>
          </div>

          {/* Lead Cast Ensemble Showcase */}
          {crew.cast && crew.cast.length > 0 && (
            <div className="cast-showcase-container">
              <div className="cast-header-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={18} style={{ color: '#d4af37' }} />
                  <h3 className="cast-section-title">Principal Cast Ensemble</h3>
                </div>
                <span style={{ fontSize: '11px', letterSpacing: '0.14em', opacity: 0.5, textTransform: 'uppercase' }}>
                  Theatrical Playbill
                </span>
              </div>

              <div className="cast-cards-grid">
                {crew.cast.map((member, idx) => (
                  <div key={idx} className="cast-actor-card">
                    <span className="actor-name">{member.actor}</span>
                    <span className="actor-character">as {member.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------------------
            5. ARCHIVE FOOTER & NEXT FEATURE TEASER
            ------------------------------------------------------------------ */}
        <footer className="magazine-footer-banner">
          {nextMovie && (
            <div 
              className="next-feature-card"
              onClick={() => {
                sounds?.playClick?.();
                onNext?.();
              }}
              role="button"
              tabIndex={0}
              aria-label={`Next feature story: ${nextMovie.title}`}
            >
              <div>
                <div className="next-meta-tag">
                  Next Archive Feature • {nextMovie.year}
                </div>
                <h3 className="next-film-title">
                  {nextMovie.title}
                </h3>
                <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '4px' }}>
                  Directed by {nextMovie.director}
                </div>
              </div>

              <div className="next-arrow-circle">
                <ArrowRight size={22} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
            <button 
              className="mag-return-btn"
              style={{ padding: '12px 32px', fontSize: '13px' }}
              onClick={() => {
                sounds?.playClick?.();
                onClose?.();
              }}
            >
              <span>Return to 3D Sphere & Line Archive</span>
              <X size={16} />
            </button>
          </div>

          <div className="magazine-colophon">
            <span>MONOLITH ARCHIVE // SPECIAL RETROSPECTIVE EDITION</span>
            <span>All rights and film archives preserved under Academy of Motion Picture Arts and Sciences heritage.</span>
          </div>
        </footer>

      </article>
    </div>
  );
}
