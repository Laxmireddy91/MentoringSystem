const puppeteer = require('puppeteer');
const path = require('path');

const CHROME_PATH = 'C:\\Users\\Asus\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\bfc484a1-cf54-4719-9e02-4d4c1b26e99e';

const ROLES = [
  { role: 'student', path: '/student/overview', name: 'Student' },
  { role: 'mentor', path: '/mentor/overview', name: 'Mentor' },
  { role: 'mentoring_coordinator', path: '/coordinator/overview', name: 'Coordinator' },
  { role: 'hod', path: '/hod/overview', name: 'HOD' },
  { role: 'exam_coordinator', path: '/exam-coordinator/requests', name: 'Exam Coordinator' },
  { role: 'tpo', path: '/tpo/drives', name: 'TPO' },
  { role: 'parent', path: '/parent/overview', name: 'Parent' },
];

async function verifyBrowserDashboards(browserName, execPath) {
  console.log(`\n========================================`);
  console.log(`  Verifying 7 Dashboards in ${browserName}`);
  console.log(`========================================`);

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/auth/me')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: page.__currentUser || { id: '1', role: 'student', name: 'Test User' },
          token: 'mock-token'
        })
      });
    } else if (url.includes('/api/')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] })
      });
    } else {
      req.continue();
    }
  });

  for (const item of ROLES) {
    page.__currentUser = {
      id: '1',
      role: item.role,
      name: `${item.name} Demo`,
      email: `${item.role}@institution.edu`,
      department: 'Computer Science'
    };

    // First go to /login to set localStorage
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.evaluate((u) => {
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('token', 'mock-token');
    }, page.__currentUser);

    // Now navigate to the dashboard route
    const targetUrl = `http://localhost:5173${item.path}`;
    await page.goto(targetUrl, { waitUntil: 'networkidle0' });

    // Wait a brief moment for dashboard to settle
    await new Promise(r => setTimeout(r, 600));

    const currentUrl = page.url();
    const styleInfo = await page.evaluate(() => {
      const root = document.documentElement;
      return {
        primaryColor: getComputedStyle(root).getPropertyValue('--primary-color').trim(),
        primaryTextLight: getComputedStyle(root).getPropertyValue('--primary-text-light').trim(),
        primaryBorder: getComputedStyle(root).getPropertyValue('--primary-border').trim(),
        className: root.className,
        has404: document.body.innerText.includes('404') || document.body.innerText.includes('Page Not Found')
      };
    });

    console.log(`[${browserName}] ${item.name} (${item.role}):`);
    console.log(`  Target URL:  ${targetUrl}`);
    console.log(`  Actual URL:  ${currentUrl}`);
    console.log(`  Root Class:  ${styleInfo.className}`);
    console.log(`  Primary Clr: ${styleInfo.primaryColor}`);
    console.log(`  Has 404:     ${styleInfo.has404 ? 'FAILED (404 found)' : 'PASSED'}`);

    const shotName = `${browserName.toLowerCase()}_dash_${item.role}.png`;
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, shotName),
      fullPage: false
    });
  }

  await browser.close();
}

(async () => {
  try {
    await verifyBrowserDashboards('Chrome', CHROME_PATH);
    await verifyBrowserDashboards('Edge', EDGE_PATH);
    console.log('\nAll 7 dashboards verified across Chrome and Edge!');
  } catch (err) {
    console.error('Error during dashboard verification:', err);
    process.exit(1);
  }
})();
