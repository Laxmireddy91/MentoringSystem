// scripts/clean-colors-3.cjs
// Third pass: replace any remaining bright indigo/purple/rose or dark indigo/purple backgrounds
// with muted role/status utilities.

const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'src');

const rules = [
  // Dark indigo/purple backgrounds -> role soft dark
  { regex: /dark:bg-indigo-950(\/\d+)?/g, replace: 'dark:bg-role-soft-dark' },
  { regex: /dark:bg-purple-950(\/\d+)?/g, replace: 'dark:bg-role-soft-dark' },
  // Light indigo/purple backgrounds that are not soft (should be role primary)
  { regex: /bg-indigo-600/g, replace: 'bg-role-primary' },
  { regex: /bg-indigo-700/g, replace: 'bg-role-primary' },
  { regex: /bg-purple-600/g, replace: 'bg-role-primary' },
  // Any remaining indigo dark (non‑dark prefix) -> role soft dark
  { regex: /bg-indigo-950(\/\d+)?/g, replace: 'bg-role-soft-dark' },
  // Replace rose (bright pink) used in conditional badges with error status
  { regex: /bg-rose-100/g, replace: 'bg-status-error' },
  { regex: /text-rose-700/g, replace: 'text-status-error' },
  { regex: /dark:bg-rose-950/g, replace: 'dark:bg-status-error' },
  { regex: /dark:text-rose-300/g, replace: 'dark:text-status-error' },
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
console.log('Third pass color cleanup completed.');
