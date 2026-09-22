// scripts/clean-colors-2.cjs
// Second pass: replace leftover bright emerald/amber/indigo-dark with muted utilities.

const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'src');

const rules = [
  // Emerald (bright green) -> muted success
  { regex: /bg-emerald-(50|100|200|300|400|500|600|700|800|900)/g, replace: 'bg-status-success' },
  { regex: /text-emerald-(500|600|700|800|900)/g, replace: 'text-status-success' },
  { regex: /border-emerald-(200|300|400|500|600)/g, replace: 'border-status-success' },
  // Amber (bright warning) -> muted warning (already covered, but ensure any leftover)
  { regex: /bg-amber-(50|100|200|300|400|500|600|700|800|900)/g, replace: 'bg-status-warning' },
  { regex: /text-amber-(600|700|800|900)/g, replace: 'text-status-warning' },
  { regex: /border-amber-(200|300|400|500|600)/g, replace: 'border-status-warning' },
  // Replace indigo dark mode classes with role-soft-dark
  { regex: /dark:bg-indigo-950\/([0-9]+)?/g, replace: 'dark:bg-role-soft-dark' },
  { regex: /dark:hover:bg-indigo-950\/([0-9]+)?/g, replace: 'dark:hover:bg-role-soft-dark' },
  // Replace any lingering dark indigo background on soft usage
  { regex: /bg-indigo-950\/([0-9]+)?/g, replace: 'bg-role-soft-dark' },
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'build', '.next', '.git'].includes(entry.name)) continue;
      walk(fullPath);
    } else if (entry.isFile()) {
      if (!/\.(jsx?|tsx?)$/.test(entry.name)) continue;
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      for (const { regex, replace } of rules) {
        content = content.replace(regex, replace);
      }
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated', path.relative(srcDir, fullPath));
      }
    }
  }
}

walk(srcDir);
console.log('Second pass color cleanup completed.');
