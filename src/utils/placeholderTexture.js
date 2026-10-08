import * as THREE from 'three';

/**
 * Creates a dark fallback card texture displaying the movie title, year,
 * director and Oscar laurel styling if a poster fails to load.
 */
export function createFallbackCardTexture(movie) {
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 750; // Exact 2:3 vertical aspect ratio
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.Texture();

  // Dark background
  const grad = ctx.createLinearGradient(0, 0, 0, 750);
  grad.addColorStop(0, '#15161c');
  grad.addColorStop(0.5, '#0b0c10');
  grad.addColorStop(1, '#08080a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 500, 750);

  // Subtle platinum silver film border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, 460, 710);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.strokeRect(26, 26, 448, 698);

  // Academy Laurel / Statuette typography in luxury serif
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 13px "Cinzel", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.letterSpacing = '4px';
  ctx.fillText('ACADEMY AWARD® WINNER', 250, 75);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = '500 12px "Cinzel", serif';
  ctx.letterSpacing = '3px';
  ctx.fillText((movie?.award || 'BEST PICTURE').toUpperCase(), 250, 102);

  // Year Badge in silver glass circle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.arc(250, 160, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 18px "Cinzel", monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(movie?.year || ''), 250, 160);

  // Movie Title in Cormorant Garamond luxury serif
  ctx.fillStyle = '#ffffff';
  ctx.font = '500 38px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  wrapText(ctx, movie?.title || 'OSCAR WINNER', 250, 375, 410, 44);

  // Director in elegant italic serif
  if (movie?.director) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = 'italic 18px "Cormorant Garamond", serif';
    ctx.fillText(`Directed by ${movie.director}`, 250, 620);
  }

  // Footer seal
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '600 11px "Cinzel", serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('OFFICIAL ARCHIVE SELECTION', 250, 680);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, x, startY + index * lineHeight);
  });
}
