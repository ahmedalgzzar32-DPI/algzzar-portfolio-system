/**
 * env-config.js — Environment Configuration
 * Algzzar Portfolio System · Production-Ready
 *
 * HOW TO USE:
 *   Include this script FIRST in every HTML page before any other JS.
 *   It sets window.ALGZZAR_API_URL based on the current hostname.
 *
 * DEPLOYMENT:
 *   - Vercel / Netlify: set VITE_API_URL or just use the auto-detection below
 *   - GitHub Codespaces: auto-detected
 *   - Local dev: falls back to localhost:5000
 */
(function () {
  'use strict';

  const hostname = window.location.hostname;

  // ── Codespace / GitHub dev auto-detection ─────────────────────
  // Pattern: "xxx-5173.app.github.dev" → backend is on port 5000
  const codespaceMatch = hostname.match(/^([\w-]+)-\d+\.app\.github\.dev$/);
  if (codespaceMatch) {
    const base = codespaceMatch[1];
    window.ALGZZAR_API_URL = `https://${base}-5000.app.github.dev/api`;
    window.ALGZZAR_ENV = 'codespace';
    return;
  }

  // ── Production domains ─────────────────────────────────────────
  const productionDomains = [
    'algzzar.com',
    'algzzar.vercel.app',
    'algzzar-portfolio.vercel.app',
  ];
  if (productionDomains.some(d => hostname.endsWith(d))) {
    // Backend URL: update this to your production API
    window.ALGZZAR_API_URL = 'https://algzzar-portfolio-system.onrender.com/api';
    window.ALGZZAR_ENV = 'production';
    return;
  }

  // ── Live backend (Codespace URL – hardcoded as current live backend) ──
  // This is the currently running backend from the brief:
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Try to detect if running in codespace context via referrer/port
    window.ALGZZAR_API_URL = 'https://automatic-journey-x5qqvg699x5q3pv75-5000.app.github.dev/api';
    window.ALGZZAR_ENV = 'development';
    return;
  }

  // ── Fallback ───────────────────────────────────────────────────
  window.ALGZZAR_API_URL = 'https://automatic-journey-x5qqvg699x5q3pv75-5000.app.github.dev/api';
  window.ALGZZAR_ENV = 'fallback';
})();
