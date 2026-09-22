// scripts/visual-qa.cjs
// Run after starting the dev server (npm run dev) on http://localhost:5173
// Requires puppeteer (installed as dev dependency)
// Captures screenshots of all major pages for each role and saves to artifact folder.

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration: list of routes and role contexts
const routes = [
  { name: 'Login', url: '/login' },
  { name: 'Activation', url: '/activate' },
  { name: 'Student Dashboard', url: '/dashboard', role: 'student' },
  { name: 'Mentor Dashboard', url: '/dashboard', role: 'mentor' },
  { name: 'Coordinator Dashboard', url: '/dashboard', role: 'coordinator' },
  { name: 'HOD Dashboard', url: '/dashboard', role: 'hod' },
  { name: 'Exam Coordinator Dashboard', url: '/dashboard', role: 'exam' },
  { name: 'TPO Dashboard', url: '/dashboard', role: 'tpo' },
  { name: 'Parent Dashboard', url: '/dashboard', role: 'parent' },
  { name: 'Profile', url: '/profile' },
  { name: 'Settings', url: '/settings' },
  { name: 'Tables', url: '/tables' },
  { name: 'Forms', url: '/forms' },
  { name: 'Notifications', url: '/notifications' },
  { name: 'Modals', url: '/modals' },
  { name: 'Loading State', url: '/loading' },
  { name: 'Error State', url: '/error' },
  { name: 'Empty State', url: '/empty' },
];

// Helper to set role in localStorage before navigation (app uses role from localStorage)
async function setRole(page, role) {
  if (role) {
    await page.evaluate(r => localStorage.setItem('role', r), role);
  } else {
    await page.evaluate(() => localStorage.removeItem('role'));
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, defaultViewport: { width: 1920, height: 1080 } });
  const page = await browser.newPage();

  const baseUrl = 'http://localhost:5173';
  const outDir = path.resolve(__dirname, '..', '..', 'artifacts', 'visual-qa');
  fs.mkdirSync(outDir, { recursive: true });

  for (const route of routes) {
    await setRole(page, route.role);
    const url = baseUrl + route.url;
    console.log(`Navigating to ${url} (${route.name})`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 }).catch(e => console.error('Navigation error', e));
    // Wait a moment for UI to settle
    await page.waitForTimeout(1000);
    const fileName = `${route.name.replace(/\s+/g, '_')}${route.role ? '_' + route.role : ''}.png`;
    const filePath = path.join(outDir, fileName);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Saved screenshot: ${filePath}`);
  }

  await browser.close();
  console.log('Visual QA complete. Screenshots stored in', outDir);
})();
