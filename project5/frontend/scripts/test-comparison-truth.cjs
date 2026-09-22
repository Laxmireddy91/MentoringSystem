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
  console.log(`Starting ${browserName}...`);
  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  let currentUser = null;

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/auth/me')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Success',
          data: {
            user: currentUser || { id: '1', role: 'student', name: 'Demo User', email: 'demo@sgbit.edu' },
            token: 'mock-jwt-token'
          }
        })
      });
    } else if (url.includes('/api/')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Success', data: [] })
      });
    } else {
      req.continue();
    }
  });

  // 1. Landing Page Inspection
  currentUser = null;
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const landing = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const rootStyle = getComputedStyle(root);
    const bodyStyle = getComputedStyle(body);

    const statCards = Array.from(document.querySelectorAll('.hover-lift'));
    const buttons = Array.from(document.querySelectorAll('a[href="/login"], a[href="/activate"], button'));
    const heroTitle = document.querySelector('h1');

    return {
      primaryColor: rootStyle.getPropertyValue('--primary-color').trim(),
      primarySoft: rootStyle.getPropertyValue('--primary-soft').trim(),
      textPrimary: rootStyle.getPropertyValue('--text-primary').trim(),
      textSecondary: rootStyle.getPropertyValue('--text-secondary').trim(),
      bodyBg: bodyStyle.backgroundColor,
      bodyColor: bodyStyle.color,
      heroTitleColor: heroTitle ? getComputedStyle(heroTitle).color : null,
      card1Bg: statCards[0] ? getComputedStyle(statCards[0]).backgroundImage || getComputedStyle(statCards[0]).backgroundColor : null,
      card2Bg: statCards[1] ? getComputedStyle(statCards[1]).backgroundColor : null,
      card3Bg: statCards[2] ? getComputedStyle(statCards[2]).backgroundColor : null,
      accessPortalBtnBg: buttons[2] ? getComputedStyle(buttons[2]).backgroundColor : (buttons[0] ? getComputedStyle(buttons[0]).backgroundColor : null),
      accessPortalBtnColor: buttons[2] ? getComputedStyle(buttons[2]).color : (buttons[0] ? getComputedStyle(buttons[0]).color : null)
    };
  });

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, `${browserName.toLowerCase()}_landing_truth.png`),
    fullPage: false
  });

  // 2. Dashboards Inspection
  const dashboardResults = {};

  for (const item of ROLES) {
    currentUser = {
      id: `usr_${item.role}`,
      role: item.role,
      name: `${item.name} Demo User`,
      email: `${item.role}@sgbit.edu`,
      department: 'Computer Science & Engg.'
    };

    // Populate localStorage with user and token
    await page.evaluate((u) => {
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('token', 'mock-jwt-token');
    }, currentUser);

    const targetUrl = `http://localhost:5173${item.path}`;
    await page.goto(targetUrl, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const dashStyles = await page.evaluate(() => {
      const root = document.documentElement;
      const body = document.body;
      const rootStyle = getComputedStyle(root);
      const bodyStyle = getComputedStyle(body);

      const cards = Array.from(document.querySelectorAll('.bg-white, [class*="rounded-xl"], [class*="rounded-2xl"]'));
      const buttons = Array.from(document.querySelectorAll('button'));
      const roleAccents = Array.from(document.querySelectorAll('.text-role-primary, .bg-role-primary, [class*="role"]'));

      return {
        url: window.location.pathname,
        primaryColor: rootStyle.getPropertyValue('--primary-color').trim(),
        primarySoft: rootStyle.getPropertyValue('--primary-soft').trim(),
        textPrimary: rootStyle.getPropertyValue('--text-primary').trim(),
        textSecondary: rootStyle.getPropertyValue('--text-secondary').trim(),
        bodyBg: bodyStyle.backgroundColor,
        bodyColor: bodyStyle.color,
        rootClass: root.className,
        cardCount: cards.length,
        firstCardBg: cards[0] ? getComputedStyle(cards[0]).backgroundColor : null,
        firstBtnBg: buttons[0] ? getComputedStyle(buttons[0]).backgroundColor : null,
        firstBtnColor: buttons[0] ? getComputedStyle(buttons[0]).color : null,
        roleAccentColor: roleAccents[0] ? (getComputedStyle(roleAccents[0]).color || getComputedStyle(roleAccents[0]).backgroundColor) : null,
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
  return { landing, dashboardResults };
}

(async () => {
  try {
    const edgeData = await inspectBrowser('Edge', EDGE_PATH);
    const chromeData = await inspectBrowser('Chrome', CHROME_PATH);

    console.log('\n======================================================');
    console.log('              COMPUTED STYLE COMPARISON               ');
    console.log('======================================================\n');

    console.log('1. Landing Page:');
    console.log('Metric                 | Edge (Truth)                 | Chrome                       | Match?');
    console.log('-----------------------|------------------------------|------------------------------|--------');
    for (const key of Object.keys(edgeData.landing)) {
      const eVal = String(edgeData.landing[key]);
      const cVal = String(chromeData.landing[key]);
      const match = eVal === cVal ? 'MATCH' : 'MISMATCH';
      console.log(`${key.padEnd(22)} | ${eVal.padEnd(28)} | ${cVal.padEnd(28)} | ${match}`);
    }

    console.log('\n2. Dashboards (all 7 roles):');
    for (const item of ROLES) {
      const eDash = edgeData.dashboardResults[item.role];
      const cDash = chromeData.dashboardResults[item.role];
      console.log(`\n--- Dashboard: ${item.name} (${item.role}) ---`);
      console.log(`Target Path: ${item.path}`);
      console.log(`Edge Path:   ${eDash.url} (404: ${eDash.is404})`);
      console.log(`Chrome Path: ${cDash.url} (404: ${cDash.is404})`);
      console.log(`Root Class:         Edge: ${eDash.rootClass.padEnd(26)} | Chrome: ${cDash.rootClass.padEnd(26)} -> ${eDash.rootClass === cDash.rootClass ? 'MATCH' : 'MISMATCH'}`);
      console.log(`--primary-color:    Edge: ${eDash.primaryColor.padEnd(26)} | Chrome: ${cDash.primaryColor.padEnd(26)} -> ${eDash.primaryColor === cDash.primaryColor ? 'MATCH' : 'MISMATCH'}`);
      console.log(`--primary-soft:     Edge: ${eDash.primarySoft.padEnd(26)} | Chrome: ${cDash.primarySoft.padEnd(26)} -> ${eDash.primarySoft === cDash.primarySoft ? 'MATCH' : 'MISMATCH'}`);
      console.log(`--text-primary:     Edge: ${eDash.textPrimary.padEnd(26)} | Chrome: ${cDash.textPrimary.padEnd(26)} -> ${eDash.textPrimary === cDash.textPrimary ? 'MATCH' : 'MISMATCH'}`);
      console.log(`--text-secondary:   Edge: ${eDash.textSecondary.padEnd(26)} | Chrome: ${cDash.textSecondary.padEnd(26)} -> ${eDash.textSecondary === cDash.textSecondary ? 'MATCH' : 'MISMATCH'}`);
      console.log(`body background:    Edge: ${eDash.bodyBg.padEnd(26)} | Chrome: ${cDash.bodyBg.padEnd(26)} -> ${eDash.bodyBg === cDash.bodyBg ? 'MATCH' : 'MISMATCH'}`);
      console.log(`first card bg:      Edge: ${String(eDash.firstCardBg).padEnd(26)} | Chrome: ${String(cDash.firstCardBg).padEnd(26)} -> ${eDash.firstCardBg === cDash.firstCardBg ? 'MATCH' : 'MISMATCH'}`);
      console.log(`first button bg:    Edge: ${String(eDash.firstBtnBg).padEnd(26)} | Chrome: ${String(cDash.firstBtnBg).padEnd(26)} -> ${eDash.firstBtnBg === cDash.firstBtnBg ? 'MATCH' : 'MISMATCH'}`);
      console.log(`role accent:        Edge: ${String(eDash.roleAccentColor).padEnd(26)} | Chrome: ${String(cDash.roleAccentColor).padEnd(26)} -> ${eDash.roleAccentColor === cDash.roleAccentColor ? 'MATCH' : 'MISMATCH'}`);
    }

    console.log('\nVerification completed successfully!');
  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  }
})();
