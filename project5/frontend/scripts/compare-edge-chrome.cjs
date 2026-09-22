const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

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

async function inspectBrowser(browserName, execPath) {
  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Landing Page Inspection
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const landingLight = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const rootStyle = getComputedStyle(root);
    const bodyStyle = getComputedStyle(body);

    const cards = Array.from(document.querySelectorAll('.rounded-2xl, .rounded-xl, [class*="bg-white"], [class*="card"]'));
    const buttons = Array.from(document.querySelectorAll('a[href="/login"], button'));
    
    // First stat card ("2,180 Active Mentee Allocations")
    const statCards = Array.from(document.querySelectorAll('.grid > div'));

    return {
      primaryColor: rootStyle.getPropertyValue('--primary-color').trim(),
      primarySoft: rootStyle.getPropertyValue('--primary-soft').trim(),
      textPrimary: rootStyle.getPropertyValue('--text-primary').trim(),
      textSecondary: rootStyle.getPropertyValue('--text-secondary').trim(),
      bodyBg: bodyStyle.backgroundColor,
      bodyColor: bodyStyle.color,
      portalBtnBg: buttons[0] ? getComputedStyle(buttons[0]).backgroundColor : null,
      portalBtnColor: buttons[0] ? getComputedStyle(buttons[0]).color : null,
      firstStatCardBg: statCards[0] ? getComputedStyle(statCards[0]).backgroundColor : null,
      secondStatCardBg: statCards[1] ? getComputedStyle(statCards[1]).backgroundColor : null,
      cardCount: cards.length
    };
  });

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, `${browserName.toLowerCase()}_landing_truth.png`),
    fullPage: false
  });

  // 2. Dashboards Inspection
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

  const dashboardResults = {};

  for (const item of ROLES) {
    page.__currentUser = {
      id: '1',
      role: item.role,
      name: `${item.name} Demo`,
      email: `${item.role}@institution.edu`,
      department: 'Computer Science'
    };

    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.evaluate((u) => {
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('token', 'mock-token');
    }, page.__currentUser);

    const targetUrl = `http://localhost:5173${item.path}`;
    await page.goto(targetUrl, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const dashStyles = await page.evaluate(() => {
      const root = document.documentElement;
      const body = document.body;
      const rootStyle = getComputedStyle(root);
      const bodyStyle = getComputedStyle(body);

      const buttons = Array.from(document.querySelectorAll('button, a'));
      const cards = Array.from(document.querySelectorAll('.rounded-xl, .rounded-2xl, [class*="bg-white"]'));
      const roleAccentElem = document.querySelector('.text-role-primary, .bg-role-primary, [class*="text-role"], [class*="bg-role"]');

      return {
        actualUrl: window.location.pathname,
        primaryColor: rootStyle.getPropertyValue('--primary-color').trim(),
        primarySoft: rootStyle.getPropertyValue('--primary-soft').trim(),
        textPrimary: rootStyle.getPropertyValue('--text-primary').trim(),
        textSecondary: rootStyle.getPropertyValue('--text-secondary').trim(),
        bodyBg: bodyStyle.backgroundColor,
        bodyColor: bodyStyle.color,
        firstCardBg: cards[0] ? getComputedStyle(cards[0]).backgroundColor : null,
        firstBtnBg: buttons[0] ? getComputedStyle(buttons[0]).backgroundColor : null,
        roleAccent: roleAccentElem ? (getComputedStyle(roleAccentElem).color || getComputedStyle(roleAccentElem).backgroundColor) : null,
        is404: body.innerText.includes('404') || body.innerText.includes('Page Not Found')
      };
    });

    dashboardResults[item.role] = dashStyles;

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `${browserName.toLowerCase()}_dash_${item.role}_truth.png`),
      fullPage: false
    });
  }

  await browser.close();
  return { landingLight, dashboardResults };
}

(async () => {
  try {
    console.log('--- Inspecting Microsoft Edge (Visual Source of Truth) ---');
    const edgeData = await inspectBrowser('Edge', EDGE_PATH);

    console.log('\n--- Inspecting Google Chrome ---');
    const chromeData = await inspectBrowser('Chrome', CHROME_PATH);

    console.log('\n======================================================');
    console.log('              COMPUTED STYLE COMPARISON               ');
    console.log('======================================================\n');

    console.log('1. Landing Page:');
    console.log('Metric                 | Edge (Truth)                 | Chrome                       | Match?');
    console.log('-----------------------|------------------------------|------------------------------|--------');
    for (const key of Object.keys(edgeData.landingLight)) {
      const eVal = String(edgeData.landingLight[key]);
      const cVal = String(chromeData.landingLight[key]);
      const match = eVal === cVal ? 'MATCH' : 'MISMATCH';
      console.log(`${key.padEnd(22)} | ${eVal.padEnd(28)} | ${cVal.padEnd(28)} | ${match}`);
    }

    console.log('\n2. Dashboards (all 7 roles):');
    for (const item of ROLES) {
      const eDash = edgeData.dashboardResults[item.role];
      const cDash = chromeData.dashboardResults[item.role];
      console.log(`\n--- Dashboard: ${item.name} (${item.role}) ---`);
      console.log(`Target Path: ${item.path}`);
      console.log(`Edge Actual Path:   ${eDash.actualUrl} (404: ${eDash.is404})`);
      console.log(`Chrome Actual Path: ${cDash.actualUrl} (404: ${cDash.is404})`);
      console.log(`--primary-color:    Edge: ${eDash.primaryColor} | Chrome: ${cDash.primaryColor} -> ${eDash.primaryColor === cDash.primaryColor ? 'MATCH' : 'MISMATCH'}`);
      console.log(`--text-primary:     Edge: ${eDash.textPrimary} | Chrome: ${cDash.textPrimary} -> ${eDash.textPrimary === cDash.textPrimary ? 'MATCH' : 'MISMATCH'}`);
      console.log(`--text-secondary:   Edge: ${eDash.textSecondary} | Chrome: ${cDash.textSecondary} -> ${eDash.textSecondary === cDash.textSecondary ? 'MATCH' : 'MISMATCH'}`);
      console.log(`body background:    Edge: ${eDash.bodyBg} | Chrome: ${cDash.bodyBg} -> ${eDash.bodyBg === cDash.bodyBg ? 'MATCH' : 'MISMATCH'}`);
      console.log(`first card bg:      Edge: ${eDash.firstCardBg} | Chrome: ${cDash.firstCardBg} -> ${eDash.firstCardBg === cDash.firstCardBg ? 'MATCH' : 'MISMATCH'}`);
      console.log(`first button bg:    Edge: ${eDash.firstBtnBg} | Chrome: ${cDash.firstBtnBg} -> ${eDash.firstBtnBg === cDash.firstBtnBg ? 'MATCH' : 'MISMATCH'}`);
      console.log(`role accent:        Edge: ${eDash.roleAccent} | Chrome: ${cDash.roleAccent} -> ${eDash.roleAccent === cDash.roleAccent ? 'MATCH' : 'MISMATCH'}`);
    }

    console.log('\nAudit complete!');
  } catch (err) {
    console.error('Error during comparison:', err);
    process.exit(1);
  }
})();
