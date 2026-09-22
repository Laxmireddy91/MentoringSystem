const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Users\\Asus\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\bfc484a1-cf54-4719-9e02-4d4c1b26e99e';

async function testBrowser(name, executablePath) {
  console.log(`\n=== Testing ${name} ===`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Visit landing page
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // Clear any existing service workers & cache
  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let reg of registrations) {
        await reg.unregister();
      }
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      for (let key of keys) {
        await caches.delete(key);
      }
    }
  });

  // Reload to ensure fresh render
  await page.reload({ waitUntil: 'networkidle0' });

  // Inspect landing styles
  const landingStyles = await page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    const bodyStyle = getComputedStyle(document.body);
    const primaryBtn = document.querySelector('a[href="/login"], button');
    const heroTitle = document.querySelector('h1');
    return {
      primaryColor: rootStyle.getPropertyValue('--primary-color').trim(),
      primarySoft: rootStyle.getPropertyValue('--primary-soft').trim(),
      textPrimary: rootStyle.getPropertyValue('--text-primary').trim(),
      textSecondary: rootStyle.getPropertyValue('--text-secondary').trim(),
      bodyColor: bodyStyle.color,
      bodyBg: bodyStyle.backgroundColor,
      heroTitleColor: heroTitle ? getComputedStyle(heroTitle).color : null,
      primaryBtnBg: primaryBtn ? getComputedStyle(primaryBtn).backgroundColor : null,
      primaryBtnColor: primaryBtn ? getComputedStyle(primaryBtn).color : null
    };
  });

  console.log(`${name} Landing styles:`, landingStyles);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, `${name.toLowerCase()}_landing_verified.png`),
    fullPage: false
  });

  // Test role query parameter /login?role=mentoring_coordinator
  await page.goto('http://localhost:5173/login?role=mentoring_coordinator', { waitUntil: 'networkidle0' });
  const coordinatorStyles = await page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    const primaryElem = document.querySelector('.text-role-primary') || document.querySelector('.bg-role-primary');
    return {
      primaryColor: rootStyle.getPropertyValue('--primary-color').trim(),
      classes: document.documentElement.className,
      accentColor: primaryElem ? (getComputedStyle(primaryElem).color || getComputedStyle(primaryElem).backgroundColor) : null
    };
  });
  console.log(`${name} Coordinator login styles:`, coordinatorStyles);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, `${name.toLowerCase()}_login_coordinator.png`),
    fullPage: false
  });

  // Test role query parameter /login?role=student
  await page.goto('http://localhost:5173/login?role=student', { waitUntil: 'networkidle0' });
  const studentStyles = await page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    return {
      primaryColor: rootStyle.getPropertyValue('--primary-color').trim(),
      classes: document.documentElement.className
    };
  });
  console.log(`${name} Student login styles:`, studentStyles);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, `${name.toLowerCase()}_login_student.png`),
    fullPage: false
  });

  await browser.close();
}

(async () => {
  try {
    await testBrowser('Chrome', CHROME_PATH);
    await testBrowser('Edge', EDGE_PATH);
    console.log('\nBrowser verification complete!');
  } catch (err) {
    console.error('Error during browser verification:', err);
    process.exit(1);
  }
})();
