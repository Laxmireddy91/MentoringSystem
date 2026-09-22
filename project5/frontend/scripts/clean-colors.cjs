// scripts/clean-colors.cjs
// Run with: `node scripts/clean-colors.cjs`
// Scans src/**/*.jsx|js|tsx|ts and replaces bright Tailwind color classes
// with the new muted role/theme utilities defined in the design system.

const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'src');

// Define replacement rules – order matters (most specific first)
const rules = [
  // ==== Status colours ====
  { regex: /bg-red-(50|100|200|300|400|500|600|700|800|900)/g, replace: 'bg-status-error' },
  { regex: /text-red-(600|700|800|900)/g, replace: 'text-status-error' },
  { regex: /border-red-(200|300|400|500|600)/g, replace: 'border-status-error' },
  { regex: /bg-amber-(50|100|200|300|400|500|600|700|800|900)/g, replace: 'bg-status-warning' },
  { regex: /text-amber-(600|700|800|900)/g, replace: 'text-status-warning' },
  { regex: /border-amber-(200|300|400|500|600)/g, replace: 'border-status-warning' },
  { regex: /bg-green-(50|100|200|300|400|500|600|700|800|900)/g, replace: 'bg-status-success' },
  { regex: /text-green-(600|700|800|900)/g, replace: 'text-status-success' },
  { regex: /border-green-(200|300|400|500|600)/g, replace: 'border-status-success' },
  { regex: /bg-blue-(50|100|200|300|400|500|600|700|800|900)/g, replace: 'bg-status-info' },
  { regex: /text-blue-(600|700|800|900)/g, replace: 'text-status-info' },
  { regex: /border-blue-(200|300|400|500|600)/g, replace: 'border-status-info' },

  // ==== Role accent (indigo, purple, etc.) – map to role utilities ====
  { regex: /bg-indigo-(600|700|800|900)/g, replace: 'bg-role-primary' },
  { regex: /text-indigo-(600|700|800|900)/g, replace: 'text-role-primary' },
  { regex: /border-indigo-(600|700|800|900)/g, replace: 'border-role-primary' },
  { regex: /bg-indigo-(50|100|200)/g, replace: 'bg-role-soft' },
  { regex: /text-indigo-(500|600|700)/g, replace: 'text-role-primary' },
  { regex: /border-indigo-(200|300)/g, replace: 'border-role-primary' },
  { regex: /bg-purple-(50|100|200)/g, replace: 'bg-role-soft' },
  { regex: /text-purple-(600|700|800)/g, replace: 'text-role-primary' },
  { regex: /border-purple-(200|300)/g, replace: 'border-role-primary' },

  // ==== Brand colour (previous brand classes) -> role primary
  { regex: /bg-brand-(50|100|200|300|400|500|600|700|800|900)/g, replace: 'bg-role-primary' },
  { regex: /text-brand-(600|700|800|900)/g, replace: 'text-role-primary' },
  { regex: /border-brand-(200|300|400|500|600)/g, replace: 'border-role-primary' },

  // ==== Focus ring – map any brand or indigo ring to role ring
  { regex: /focus:ring-(indigo|brand)-(\d{3})/g, replace: 'focus-role' },

  // ==== Inline hex colours – replace with CSS variables where possible
  { regex: /#ff0000|#f00|#FF0000/g, replace: 'var(--primary-color)' },
  { regex: /#00ff00|#0f0|#00FF00/g, replace: 'var(--status-success)' },
  { regex: /#ffff00|#ff0|#FFFF00/g, replace: 'var(--status-warning)' },
  { regex: /#0000ff|#00f|#0000FF/g, replace: 'var(--status-info)' },
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
console.log('Color cleanup completed.');
