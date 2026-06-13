/** Self-contained SVG covers — no external CDN, works on Vercel instantly. */
export function starterCover(emoji, accent, subtitle = "") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" role="img">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="45%" stop-color="#dbeafe"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.35"/>
    </linearGradient>
    <radialGradient id="glow" cx="72%" cy="18%" r="55%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="640" height="360" fill="url(#bg)"/>
  <rect width="640" height="360" fill="url(#glow)"/>
  <circle cx="96" cy="72" r="48" fill="${accent}" fill-opacity="0.18"/>
  <circle cx="560" cy="300" r="72" fill="${accent}" fill-opacity="0.12"/>
  <text x="320" y="${subtitle ? 168 : 198}" font-size="112" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  ${
    subtitle
      ? `<text x="320" y="248" font-family="system-ui,sans-serif" font-size="28" font-weight="700" fill="#1e3a8a" fill-opacity="0.88" text-anchor="middle">${subtitle}</text>`
      : ""
  }
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

export function questionIllustration(emoji, accent, label) {
  const safe = String(label || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 42);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" role="img">
  <defs>
    <linearGradient id="qbg" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.45"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" rx="24" fill="url(#qbg)"/>
  <text x="320" y="148" font-size="96" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  <text x="320" y="248" font-family="system-ui,sans-serif" font-size="24" font-weight="600" fill="#1e3a8a" fill-opacity="0.92" text-anchor="middle">${safe}</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}
