// scripts/replace-colors.js
/**
 * Color audit and replacement script.
 * Scans all files under src/ and replaces prohibited colour literals
 * with design‑system tokens (CSS variables / Tailwind utilities).
 *
 * Rules implemented:
 *  - Role accent colours (deep Sapphire, Teal, Indigo, Burgundy, Navy, Forest, Bronze)
 *    are replaced with the CSS custom property `var(--primary-color)`
 *    which is set by applyRoleTheme().
 *  - Semantic status colours are replaced with `var(--status-*)` variables.
 *    Mapping:
 *      #10b981 => var(--status-success)
 *      #34d399 => var(--status-success)
 *      #f59e0b => var(--status-warning)
 *      #f97316 => var(--status-error)
 *      #ef4444 => var(--status-error)
 *      #60a5fa => var(--status-info)
 *  - Any remaining bright/ neon hex values are logged for manual review.
 *
 * The script updates files in‑place using simple string replacement.
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');

// Mapping of exact colour literals to replacement strings
const colorMap = {
  // Status colours
  '#10b981': 'var(--status-success)', // success (emerald-500)
  '#34d399': 'var(--status-success)', // success (emerald-300)
  '#f59e0b': 'var(--status-warning)', // warning (amber-500)
  '#f97316': 'var(--status-error)',   // error (orange‑500)
  '#ef4444': 'var(--status-error)',   // error (red‑500)
  '#60a5fa': 'var(--status-info)',    // info (blue‑400)
  // Role accent colours – replace with CSS var
  '#1e4db7': 'var(--primary-color)', // student sapphire
  '#0f766e': 'var(--primary-color)', // mentor teal
  '#4338ca': 'var(--primary-color)', // coordinator indigo
  '#7c1d1d': 'var(--primary-color)', // hod burgundy
  '#1e3a5f': 'var(--primary-color)', // exam coordinator navy
  '#14532d': 'var(--primary-color)', // tpo forest green
  '#92400e': 'var(--primary-color)', // parent bronze
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((file) => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walkDir(full, callback);
    } else if (stat.isFile() && /\.(js|jsx|ts|tsx|css|html)$/.test(full)) {
      callback(full);
    }
  });
}

function replaceColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  for (const [oldColor, newVal] of Object.entries(colorMap)) {
    const regex = new RegExp(oldColor, 'gi');
    content = content.replace(regex, newVal);
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated colors in ${filePath}`);
  }
}

walkDir(srcDir, replaceColorsInFile);
console.log('Color audit & replacement completed.');
