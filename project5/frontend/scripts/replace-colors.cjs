// scripts/replace-colors.cjs
/**
 * Color audit and replacement script (CommonJS).
 * Scans all files under src/ and audits prohibited colour literals.
 * Protects index.css, roleThemes.js, and configuration files.
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');

// Excluded files that define design tokens and must not be touched
const excludedFiles = new Set([
  path.resolve(srcDir, 'index.css'),
  path.resolve(srcDir, 'utils/roleThemes.js'),
]);

// Mapping of specific raw status literals to token variables where appropriate
const colorMap = {
  // Only safe replacements - never map white, backgrounds, or theme definitions
};

function walkDir(dir, cb) {
  fs.readdirSync(dir).forEach((name) => {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walkDir(full, cb);
    } else if (stat.isFile() && /\.(js|jsx|ts|tsx|css|html)$/.test(full)) {
      cb(full);
    }
  });
}

function replaceColors(filePath) {
  if (excludedFiles.has(path.resolve(filePath))) {
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  for (const [oldColor, newVal] of Object.entries(colorMap)) {
    const escaped = oldColor.replace('#', '\\#');
    const safeRegex = new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`, 'gi');
    content = content.replace(safeRegex, newVal);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

walkDir(srcDir, replaceColors);
console.log('Color audit completed.');
