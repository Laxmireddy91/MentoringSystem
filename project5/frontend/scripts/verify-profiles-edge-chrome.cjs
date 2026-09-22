const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Users\\Asus\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\bfc484a1-cf54-4719-9e02-4d4c1b26e99e';

const ROLES = [
  { role: 'student', name: 'Student' },
  { role: 'mentor', name: 'Mentor' },
  { role: 'mentoring_coordinator', name: 'Mentoring Coordinator' },
  { role: 'hod', name: 'HOD' },
  { role: 'exam_coordinator', name: 'Exam Coordinator' },
  { role: 'tpo', name: 'TPO' },
  { role: 'parent', name: 'Parent' },
];

async function inspectBrowserProfiles(browserName, execPath) {
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
    } else if (url.includes('/api/profile/me')) {
      const u = page.__currentUser || {};
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ...u,
            bio: `Institutional profile bio for ${u.name}`,
            phone: '+91 9876543210',
            visibility: 'institution',
            skills: [{ name: 'Problem Solving', proficiency: 'Advanced' }],
            education: [{ qualification: 'Bachelor of Engineering', institution: 'S G Balekundri Institute of Technology', startYear: 2022, endYear: 2026 }],
            experience: [{ organization: 'SGBIT', role: 'Academic Member', currentlyWorking: true }],
            projects: [{ title: 'Smart Mentoring Platform', technologies: ['React', 'Node.js'] }],
            certifications: [{ name: 'Certified Professional', issuer: 'National Board' }],
            social: { linkedIn: 'https://linkedin.com', gitHub: 'https://github.com' },
            roleData: u.role === 'student' ? { usn: '2BU22CS001', semester: 6, section: 'A', batch: '2022-2026', mentor: { name: 'Dr. Ramesh Kumar', department: 'CSE' } }
              : u.role === 'mentor' ? { employeeId: 'MNT101', department: 'CSE', designation: 'Associate Professor', maxMentees: 25, isActive: true, ratingAverage: 4.8 }
              : u.role === 'parent' ? { relation: 'Father', ward: { name: 'Rahul Sharma', usn: '2BU22CS001', department: 'CSE', semester: 6, section: 'A' } }
              : { employeeId: `${u.role.toUpperCase()}001`, department: 'Computer Science', designation: u.name },
            stats: u.role === 'student' ? { cgpa: 8.75, attendancePercentage: 88, totalActiveBacklogs: 0, totalEarnedCredits: 120 }
              : u.role === 'mentor' ? { activeMenteeCount: 18, availableCapacity: 7, completedSessionsCount: 42 }
              : u.role === 'parent' ? { cgpa: 8.75, attendancePercentage: 88, totalActiveBacklogs: 0 }
              : { studentCount: 240, mentorCount: 16 }
          }
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

  const profileResults = {};

  for (const item of ROLES) {
    page.__currentUser = {
      _id: 'user123',
      id: 'user123',
      role: item.role,
      name: `${item.name} Demo User`,
      email: `${item.role}.demo@sgbit.edu.in`,
      department: 'Computer Science & Engineering',
      isActive: true
    };

    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.evaluate((u) => {
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('token', 'mock-token');
    }, page.__currentUser);

    // 1. Light mode check
    await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const lightStyles = await page.evaluate(() => {
      const root = document.documentElement;
      const body = document.body;
      const rootStyle = getComputedStyle(root);
      const bodyStyle = getComputedStyle(body);
      const headerTitle = document.querySelector('h1')?.innerText;
      const roleBadges = Array.from(document.querySelectorAll('.rounded-full')).map(el => el.innerText.trim()).filter(Boolean);

      return {
        path: window.location.pathname,
        primaryColor: rootStyle.getPropertyValue('--primary-color').trim(),
        bodyBg: bodyStyle.backgroundColor,
        bodyColor: bodyStyle.color,
        headerTitle,
        roleBadges,
        has404: body.innerText.includes('404') || body.innerText.includes('Page Not Found')
      };
    });

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `${browserName.toLowerCase()}_profile_${item.role}_light.png`),
      fullPage: false
    });

    // 2. Dark mode check
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await new Promise(r => setTimeout(r, 400));

    const darkStyles = await page.evaluate(() => {
      const root = document.documentElement;
      const body = document.body;
      const rootStyle = getComputedStyle(root);
      const bodyStyle = getComputedStyle(body);

      return {
        bodyBg: bodyStyle.backgroundColor,
        bodyColor: bodyStyle.color,
        isDark: root.classList.contains('dark')
      };
    });

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `${browserName.toLowerCase()}_profile_${item.role}_dark.png`),
      fullPage: false
    });

    profileResults[item.role] = {
      light: lightStyles,
      dark: darkStyles
    };

    console.log(`[${browserName}] Checked ${item.name} profile: Header='${lightStyles.headerTitle}', 404=${lightStyles.has404}`);
  }

  await browser.close();
  return profileResults;
}

(async () => {
  try {
    console.log('Starting Edge vs Chrome Profile Verification...');
    const edgeResults = await inspectBrowserProfiles('Edge', EDGE_PATH);
    const chromeResults = await inspectBrowserProfiles('Chrome', CHROME_PATH);

    console.log('\n--- VERIFICATION COMPARISON SUMMARY ---');
    let allMatched = true;
    for (const item of ROLES) {
      const edge = edgeResults[item.role];
      const chrome = chromeResults[item.role];
      const colorMatch = edge.light.primaryColor === chrome.light.primaryColor;
      const headerMatch = edge.light.headerTitle === chrome.light.headerTitle;
      const no404 = !edge.light.has404 && !chrome.light.has404;

      console.log(`Role [${item.name}]: Colors Match=${colorMatch}, Headers Match=${headerMatch}, No 404=${no404}`);
      if (!colorMatch || !headerMatch || !no404) allMatched = false;
    }

    console.log(`\nOverall Profile Verification: ${allMatched ? 'ALL 7 ROLES VERIFIED PASSED' : 'DISCREPANCY DETECTED'}`);
  } catch (err) {
    console.error('Inspection failed:', err);
    process.exit(1);
  }
})();
