// Full acceptance test script - revised to match actual UI selectors
// Run with: node scripts/full_acceptance.js

'use strict';

const axios = require('axios');
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:5173';

// Credentials from seed.js
const STUDENT_EMAIL = 'rahul@college.edu';
const MENTOR_EMAIL = 'anita@college.edu';
const PASSWORD = 'Password@123';

const results = [];

function log(name, passed, evidence = '', note = '') {
  const status = passed === null ? 'NOT_TESTED' : (passed ? 'PASS' : 'FAIL');
  const line = `[${status}] ${name}${evidence ? ' | ' + evidence : ''}${note ? ' | NOTE: ' + note : ''}`;
  console.log(line);
  results.push({ name, status, evidence, note });
}

function runCommand(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { shell: true, stdio: 'inherit', ...opts });
    p.on('close', (code) => resolve(code));
    p.on('error', () => resolve(1));
  });
}

async function waitMs(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ──────────────────────────────────────────────
// SECTION 1: API-LEVEL TESTS
// ──────────────────────────────────────────────
async function runApiTests() {
  console.log('\n=== SECTION 1: API LOGIN & REST ===');

  let studentToken, mentorToken, studentId, mentorUserId;

  // 1a. Student login
  try {
    const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email: STUDENT_EMAIL, password: PASSWORD });
    studentToken = res.data?.data?.token;
    studentId = res.data?.data?.user?._id;
    log('API LOGIN - Student', res.status === 200 && !!studentToken, `HTTP ${res.status} | token: ${studentToken?.slice(0,20)}...`);
  } catch (e) {
    log('API LOGIN - Student', false, `${e.response?.status} ${e.message}`);
  }

  // 1b. Mentor login
  try {
    const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email: MENTOR_EMAIL, password: PASSWORD });
    mentorToken = res.data?.data?.token;
    mentorUserId = res.data?.data?.user?._id;
    log('API LOGIN - Mentor', res.status === 200 && !!mentorToken, `HTTP ${res.status} | token: ${mentorToken?.slice(0,20)}...`);
  } catch (e) {
    log('API LOGIN - Mentor', false, `${e.response?.status} ${e.message}`);
  }

  // 1c. /api/auth/me
  if (studentToken) {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${studentToken}` } });
      log('API /auth/me - Student', res.status === 200, `HTTP ${res.status} | role: ${res.data?.data?.user?.role}`);
    } catch (e) {
      log('API /auth/me - Student', false, `${e.response?.status}`);
    }
  }

  // 1d. Send a message via REST API
  let sentMsgId;
  if (studentToken && mentorUserId) {
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/messages`,
        { receiverId: mentorUserId, content: 'TEST-STUDENT-001' },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      sentMsgId = res.data?.data?._id;
      log('API POST /messages (Student→Mentor)', res.status === 201 && !!sentMsgId, `HTTP ${res.status} | msgId: ${sentMsgId}`);
    } catch (e) {
      log('API POST /messages (Student→Mentor)', false, `${e.response?.status} ${JSON.stringify(e.response?.data)}`);
    }
  }

  // 1e. GET /messages/thread/:id
  if (studentToken && mentorUserId) {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/messages/thread/${mentorUserId}`, { headers: { Authorization: `Bearer ${studentToken}` } });
      const msgs = res.data?.data;
      const hasTestMsg = Array.isArray(msgs) && msgs.some(m => m.content === 'TEST-STUDENT-001');
      log('API GET /messages/thread (Student)', res.status === 200 && hasTestMsg, `HTTP ${res.status} | ${msgs?.length} messages | TEST-STUDENT-001 found: ${hasTestMsg}`);
    } catch (e) {
      log('API GET /messages/thread', false, `${e.response?.status} ${e.message}`);
    }
  }

  // 1f. Mark delivered + read
  if (sentMsgId && mentorToken) {
    try {
      const dRes = await axios.post(`${BACKEND_URL}/api/messages/${sentMsgId}/delivered`, {}, { headers: { Authorization: `Bearer ${mentorToken}` } });
      log('API POST /messages/:id/delivered', dRes.status === 200, `HTTP ${dRes.status}`);
    } catch (e) {
      log('API POST /messages/:id/delivered', false, `${e.response?.status} ${e.message}`);
    }
    try {
      const rRes = await axios.post(`${BACKEND_URL}/api/messages/${sentMsgId}/read`, {}, { headers: { Authorization: `Bearer ${mentorToken}` } });
      log('API POST /messages/:id/read', rRes.status === 200, `HTTP ${rRes.status}`);
    } catch (e) {
      log('API POST /messages/:id/read', false, `${e.response?.status} ${e.message}`);
    }
  }

  // 1g. Health check
  try {
    const res = await axios.get(`${BACKEND_URL}/api/health`);
    log('API GET /health', res.status === 200, `HTTP ${res.status}`);
  } catch (e) {
    log('API GET /health', false, `${e.message}`);
  }

  return { studentToken, mentorToken, studentId, mentorUserId };
}

// ──────────────────────────────────────────────
// SECTION 2: UI-LEVEL TESTS (Puppeteer)
// ──────────────────────────────────────────────
async function runUiTests() {
  console.log('\n=== SECTION 2: UI / BROWSER TESTS ===');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  async function uiLogin(page, email, password) {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    // Use name attribute selectors (no ids on these inputs)
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.type('input[name="email"]', email, { delay: 30 });
    await page.type('input[name="password"]', password, { delay: 30 });
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
    return page.url();
  }

  let studentPage, mentorPage;

  // ── 2a. Student Dashboard loads ──
  try {
    studentPage = await browser.newPage();
    await studentPage.setViewport({ width: 1280, height: 800 });
    const url = await uiLogin(studentPage, STUDENT_EMAIL, PASSWORD);
    const passed = url.includes('/student');
    log('UI LOGIN - Student dashboard loads', passed, `Redirected to: ${url}`);
  } catch (e) {
    log('UI LOGIN - Student dashboard loads', false, e.message);
    await browser.close();
    return;
  }

  // ── 2b. Mentor Dashboard loads ──
  try {
    mentorPage = await browser.newPage();
    await mentorPage.setViewport({ width: 1280, height: 800 });
    const url = await uiLogin(mentorPage, MENTOR_EMAIL, PASSWORD);
    const passed = url.includes('/mentor');
    log('UI LOGIN - Mentor dashboard loads', passed, `Redirected to: ${url}`);
  } catch (e) {
    log('UI LOGIN - Mentor dashboard loads', false, e.message);
    await browser.close();
    return;
  }

  // ── 2c. Navigate to Messages ──
  try {
    await studentPage.goto(`${FRONTEND_URL}/student/messages`, { waitUntil: 'networkidle2', timeout: 20000 });
    // wait for chat input to appear (means mentor was found and chat loaded)
    await studentPage.waitForSelector('input[type="text"]', { timeout: 15000 });
    log('UI Student /messages page loads', true, 'Chat input visible');
  } catch (e) {
    log('UI Student /messages page loads', false, e.message);
    await browser.close();
    return;
  }

  try {
    await mentorPage.goto(`${FRONTEND_URL}/mentor/messages`, { waitUntil: 'networkidle2', timeout: 20000 });
    // Mentor page has a sidebar list of mentees; wait for the chat panel input
    await mentorPage.waitForSelector('input[type="text"]', { timeout: 15000 });
    log('UI Mentor /messages page loads', true, 'Chat input visible');
  } catch (e) {
    log('UI Mentor /messages page loads', false, e.message);
    await browser.close();
    return;
  }

  // ── 2d. Student sends TEST-STUDENT-001, Mentor receives without refresh ──
  try {
    const testMsg = 'TEST-STUDENT-001-' + Date.now();
    // Type into chat input and submit
    const inputSel = 'form input[type="text"]';
    await studentPage.waitForSelector(inputSel);
    await studentPage.type(inputSel, testMsg, { delay: 20 });
    await studentPage.keyboard.press('Enter');

    // Wait up to 10s for mentor page to show the message (no refresh)
    const mentorReceived = await mentorPage.waitForFunction(
      (msg) => document.body.innerText.includes(msg),
      { timeout: 10000 },
      testMsg
    ).then(() => true).catch(() => false);

    log('UI Real-time: Mentor receives Student message (no refresh)', mentorReceived,
      `Sent: "${testMsg}"`);

    // Also verify it persists after refresh
    await studentPage.reload({ waitUntil: 'networkidle2' });
    await studentPage.waitForSelector('form input[type="text"]', { timeout: 10000 });
    const studentRefreshOk = await studentPage.waitForFunction(
      (msg) => document.body.innerText.includes(msg),
      { timeout: 8000 },
      testMsg
    ).then(() => true).catch(() => false);
    log('UI Message persists after Student page refresh', studentRefreshOk, `msg: "${testMsg}"`);
  } catch (e) {
    log('UI Real-time: Mentor receives Student message (no refresh)', false, e.message);
  }

  // ── 2e. Mentor sends TEST-MENTOR-001, Student receives without refresh ──
  try {
    const testMsg = 'TEST-MENTOR-001-' + Date.now();
    const inputSel = 'form input[type="text"]';
    await mentorPage.waitForSelector(inputSel);
    await mentorPage.click(inputSel);
    await mentorPage.type(inputSel, testMsg, { delay: 20 });
    await mentorPage.keyboard.press('Enter');

    const studentReceived = await studentPage.waitForFunction(
      (msg) => document.body.innerText.includes(msg),
      { timeout: 10000 },
      testMsg
    ).then(() => true).catch(() => false);

    log('UI Real-time: Student receives Mentor reply (no refresh)', studentReceived,
      `Sent: "${testMsg}"`);

    // Verify persists after mentor refresh
    await mentorPage.reload({ waitUntil: 'networkidle2' });
    await mentorPage.waitForSelector('form input[type="text"]', { timeout: 10000 });
    const mentorRefreshOk = await mentorPage.waitForFunction(
      (msg) => document.body.innerText.includes(msg),
      { timeout: 8000 },
      testMsg
    ).then(() => true).catch(() => false);
    log('UI Message persists after Mentor page refresh', mentorRefreshOk, `msg: "${testMsg}"`);
  } catch (e) {
    log('UI Real-time: Student receives Mentor reply (no refresh)', false, e.message);
  }

  // ── 2f. Typing indicator ──
  try {
    const inputSel = 'form input[type="text"]';
    await studentPage.waitForSelector(inputSel);
    await studentPage.click(inputSel);
    await studentPage.type(inputSel, 'typing...', { delay: 80 });

    // Mentor page should show "is typing..." text
    const typingVisible = await mentorPage.waitForFunction(
      () => document.body.innerText.toLowerCase().includes('is typing'),
      { timeout: 6000 }
    ).then(() => true).catch(() => false);
    log('UI Typing indicator visible to Mentor while Student types', typingVisible,
      'Expected: "is typing..." text in mentor page');

    // Clear input to stop typing
    await studentPage.keyboard.down('Control');
    await studentPage.keyboard.press('a');
    await studentPage.keyboard.up('Control');
    await studentPage.keyboard.press('Backspace');

    // Wait for typing indicator to disappear
    await waitMs(2500); // typing timeout is 1500ms + buffer
    const typingGone = await mentorPage.evaluate(
      () => !document.body.innerText.toLowerCase().includes('is typing')
    );
    log('UI Typing indicator disappears after Student stops typing', typingGone,
      'Expected: "is typing..." gone within 2.5s');
  } catch (e) {
    log('UI Typing indicator visible to Mentor while Student types', false, e.message);
    log('UI Typing indicator disappears after Student stops typing', false, e.message);
  }

  // ── 2g. Delivery/Read UI indicator ──
  // The UI renders <CheckCheck> icon next to sent messages (Lucide CheckCheck SVG)
  // There is no explicit ".delivered" or ".read" class — checking SVG presence
  log('UI Delivery/Read indicator (CSS class)',  null, '',
    'NOT TESTED — UI uses Lucide CheckCheck SVG without .delivered/.read CSS classes. No programmatic way to distinguish states in headless browser without class markers.');

  // ── 2h. Presence indicator ──
  log('UI Presence indicator (online/offline badge)', null, '',
    'NOT TESTED — StudentMessages.jsx does not render a presence badge element. Presence is tracked server-side but not surfaced in the current UI component.');

  // ── 2i. Unread badge ──
  log('UI Unread badge count', null, '',
    'NOT TESTED — Neither StudentMessages.jsx nor MentorMessages.jsx renders an unread count badge. Feature is not implemented in the current UI.');

  // ── 2j. Image/attachment upload ──
  log('UI Image upload and rendering', null, '',
    'NOT TESTED — StudentMessages.jsx has no file attachment button (.attach-button). REST upload endpoint exists (/api/messages/upload) but is not wired into the current UI.');

  await browser.close();
  console.log('\n[Browser closed]');
}

// ──────────────────────────────────────────────
// SECTION 3: AUTOMATED TEST SUITES
// ──────────────────────────────────────────────
async function runTestSuites() {
  console.log('\n=== SECTION 3: AUTOMATED TEST SUITES ===');

  const backendCode = await runCommand('npm', ['test', '--', '--forceExit'], { cwd: 'D:/git_project/project5/backend' });
  log('Backend npm test (all 175 tests)', backendCode === 0, `exit code: ${backendCode}`);

  const frontendCode = await runCommand('npm', ['test', '--', '--watchAll=false'], { cwd: 'D:/git_project/project5/frontend' });
  log('Frontend npm test', frontendCode === 0, `exit code: ${frontendCode}`);
}

// ──────────────────────────────────────────────
// SECTION 4: LINT + BUILD
// ──────────────────────────────────────────────
async function runBuildChecks() {
  console.log('\n=== SECTION 4: LINT & BUILD ===');

  const lintF = await runCommand('npm', ['run', 'lint'], { cwd: 'D:/git_project/project5/frontend' });
  log('Frontend lint', lintF === 0, `exit code: ${lintF}`);

  const buildF = await runCommand('npm', ['run', 'build'], { cwd: 'D:/git_project/project5/frontend' });
  log('Frontend build (vite)', buildF === 0, `exit code: ${buildF}`);

  // Backend has no lint/build scripts typically — check
  const lintB = await runCommand('npm', ['run', 'lint'], { cwd: 'D:/git_project/project5/backend' });
  log('Backend lint', lintB === 0, `exit code: ${lintB}`, lintB !== 0 ? 'script may not exist' : '');
}

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
(async () => {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   FULL ACCEPTANCE TEST SUITE             ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`Backend: ${BACKEND_URL}`);
  console.log(`Frontend: ${FRONTEND_URL}\n`);

  await runApiTests();
  await runUiTests();
  await runTestSuites();
  await runBuildChecks();

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   ACCEPTANCE RESULTS SUMMARY             ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`${'Test'.padEnd(65)} ${'Result'}`);
  console.log('─'.repeat(75));
  for (const r of results) {
    const badge = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️ ';
    console.log(`${badge} ${r.name.padEnd(63)} ${r.status}`);
    if (r.evidence) console.log(`   Evidence: ${r.evidence}`);
    if (r.note)     console.log(`   Note: ${r.note}`);
  }
  console.log('─'.repeat(75));
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const notTested = results.filter(r => r.status === 'NOT_TESTED').length;
  console.log(`TOTAL: ${passed} PASS | ${failed} FAIL | ${notTested} NOT_TESTED`);
})();
