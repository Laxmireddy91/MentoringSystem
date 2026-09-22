// scripts/clean-colors-final.cjs
// Final comprehensive pass to eliminate any remaining bright Tailwind color classes.
// Replaces any indigo, purple, emerald, amber, red, yellow, green, blue classes
// with the muted role/status utilities defined in the design system.

const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'src');

const rules = [
  // ---- Role primary (indigo/purple/teal) ----
  // Primary accent (used for active buttons, links, etc.)
  { regex: /bg-(indigo|purple|teal)-(600|700|800|900)/g, replace: 'bg-role-primary' },
  { regex: /text-(indigo|purple|teal)-(600|700|800|900)/g, replace: 'text-role-primary' },
  { regex: /border-(indigo|purple|teal)-(600|700|800|900)/g, replace: 'border-role-primary' },
  // Soft role backgrounds (tints, badges)
  { regex: /bg-(indigo|purple|teal)-(50|100|200|300)/g, replace: 'bg-role-soft' },
  { regex: /text-(indigo|purple|teal)-(500|600|700)/g, replace: 'text-role-primary' },
  { regex: /border-(indigo|purple|teal)-(200|300)/g, replace: 'border-role-primary' },

  // ---- Status colors ----
  // Success (emerald) -> muted success
  { regex: /bg-emerald-(50|100|200|300|400|500|600|700|800|900)/g, replace: 'bg-status-success' },
  { regex: /text-emerald-(500|600|700|800|900)/g, replace: 'text-status-success' },
  { regex: /border-emerald-(200|300|400|500|600)/g, replace: 'border-status-success' },
  // Warning (amber) -> muted warning
  { regex: /bg-amber-(50|100|200|300|400|500|600|700|800|900)/g, replace: 'bg-status-warning' },
  { regex: /text-amber-(600|700|800|900)/g, replace: 'text-status-warning' },
  { regex: /border-amber-(200|300|400|500|600)/g, replace: 'border-status-warning' },
  // Error (red) -> muted error (already mostly done but catch any left)
  { regex: /bg-red-(50|100|200|300|400|500|600|700|800|900)/g, replace: 'bg-status-error' },
  { regex: /text-red-(600|700|800|900)/g, replace: 'text-status-error' },
  { regex: /border-red-(200|300|400|500|600)/g, replace: 'border-status-error' },
  // Info (blue) -> muted info
  { regex: /bg-blue-(50|100|200|300|400|500|600|700|800|900)/g, replace: 'bg-status-info' },
  { regex: /text-blue-(600|700|800|900)/g, replace: 'text-status-info' },
  { regex: /border-blue-(200|300|400|500|600)/g, replace: 'border-status-info' },

  // ---- Dark mode specific replacements ----
  { regex: /dark:bg-(indigo|purple|teal)-950(\/\d+)?/g, replace: 'dark:bg-role-soft-dark' },
  { regex: /dark:bg-(indigo|purple|teal)-950/g, replace: 'dark:bg-role-soft-dark' },
  { regex: /dark:bg-(indigo|purple|teal)-(900|800|700|600)/g, replace: 'dark:bg-role-soft-dark' },
  // Dark soft backgrounds already covered by role-soft-dark
  { regex: /dark:bg-(emerald|amber|red|blue)-950(\/\d+)?/g, replace: (m) => {
      const color = m.match(/dark:bg-(\w+)-950/)[1];
      return `dark:bg-status-${color}`;
    }
  },

  // ---- Focus rings / borders ----
  { regex: /focus:ring-(indigo|purple|teal)-(\d{3})/g, replace: 'focus-role' },
  { regex: /focus:border-(indigo|purple|teal)-(\d{3})/g, replace: 'focus:border-role-primary' },

  // ---- Misc residual bright colors ----
  // Rose (bright pink) used for error badges – map to error status
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
console.log('Final color cleanup completed.');
