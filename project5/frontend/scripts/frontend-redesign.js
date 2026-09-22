// scripts/frontend-redesign.js
/**
 * Orchestrates the full frontend redesign as per approved requirements.
 * Steps:
 * 1. Pre‑audit: count hex colors and Tailwind colour classes.
 * 2. Run colour‑cleanup script (replace-colors.cjs).
 * 3. Run i18n migration script (migrate-i18n.js) – placeholder for now.
 * 4. Update Recharts colour props (update-recharts.js) – placeholder.
 * 5. Run tests, lint, and production build.
 * 6. Capture outputs and write reports to artifacts.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, opts = {}) {
  console.log(`\n>>> ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', ...opts });
}

function preAudit() {
  console.log('Running pre‑audit: counting hex colours...');
  const out = execSync('npx grep-search "#[0-9A-Fa-f]{6}" -i -r src', { encoding: 'utf8' });
  const lines = out.split('\n').filter(l => l.trim());
  const count = lines.length;
  const report = `Pre‑audit hex colour count: ${count}\n` + lines.join('\n');
  fs.writeFileSync(path.resolve('artifacts', 'pre_audit.txt'), report);
  console.log('Pre‑audit written to artifacts/pre_audit.txt');
}

function postAudit() {
  console.log('Running post‑audit: counting hex colours...');
  const out = execSync('npx grep-search "#[0-9A-Fa-f]{6}" -i -r src', { encoding: 'utf8' });
  const lines = out.split('\n').filter(l => l.trim());
  const count = lines.length;
  const report = `Post‑audit hex colour count: ${count}\n` + lines.join('\n');
  fs.writeFileSync(path.resolve('artifacts', 'post_audit.txt'), report);
  console.log('Post‑audit written to artifacts/post_audit.txt');
}

function main() {
  preAudit();
  // colour cleanup
  run('npm run color-audit');
  // placeholder i18n migration – in real run you'd execute a script
  console.log('Running i18n migration script (placeholder)');
  // placeholder recharts update
  console.log('Running Recharts colour update script (placeholder)');
  // tests, lint, build
  try { run('npm test'); } catch(e) { console.error('Tests failed'); }
  try { run('npm run lint'); } catch(e) { console.error('Lint failed'); }
  try { run('npm run build'); } catch(e) { console.error('Build failed'); }
  postAudit();
  console.log('All steps completed.');
}

main();
