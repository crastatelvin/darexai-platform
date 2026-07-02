const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

let browser;
let page;

(async () => {
  console.log('Launching browser...');
  browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Console message listeners
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  const screenshotDir = path.join(__dirname, 'public', 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // 1. Landing Page
  console.log('Navigating to landing page...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.screenshot({ path: path.join(screenshotDir, '01-landing-page.png') });
  console.log('Landing page screenshot captured.');

  // 2. Perform Sandbox Login
  console.log('Filling out Sandbox Login form...');
  
  // Clear and type owner name
  await page.click('input[placeholder="Business Owner Name"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type('input[placeholder="Business Owner Name"]', 'Telvin Crasta');

  // Clear and type email
  await page.click('input[placeholder="owner@example.com"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type('input[placeholder="owner@example.com"]', 'owner@example.com');
  
  console.log('Submitting login form...');
  await page.click('button[type="submit"]');

  // Wait for dashboard sidebar nav element to appear (client-side redirect)
  console.log('Waiting for client-side navigation to dashboard...');
  await page.waitForSelector('nav', { timeout: 15000 });
  console.log('Logged in successfully. URL: ' + page.url());

  // Wait a bit for charts/KPIs to load
  await new Promise(r => setTimeout(r, 4000));

  // 3. Dashboard Overview
  await page.screenshot({ path: path.join(screenshotDir, '02-overview.png') });
  console.log('Overview page screenshot captured.');

  // 4. CRM Kanban Board
  console.log('Navigating to CRM Pipeline...');
  await page.goto('http://localhost:3000/dashboard/crm', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('main', { timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(screenshotDir, '03-crm-kanban.png') });
  console.log('CRM Kanban screenshot captured.');

  // 5. AI Business Agent
  console.log('Navigating to AI Agent...');
  await page.goto('http://localhost:3000/dashboard/agent', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('main', { timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(screenshotDir, '04-ai-agent.png') });
  console.log('AI Agent screenshot captured.');

  // 6. WhatsApp Inbox
  console.log('Navigating to WhatsApp Inbox...');
  await page.goto('http://localhost:3000/dashboard/whatsapp', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('main', { timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(screenshotDir, '05-whatsapp-inbox.png') });
  console.log('WhatsApp Inbox screenshot captured.');

  // 7. Unified Inbox Timeline
  console.log('Navigating to Unified Inbox Timeline...');
  await page.goto('http://localhost:3000/dashboard/timeline', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('main', { timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(screenshotDir, '06-unified-timeline.png') });
  console.log('Unified Timeline screenshot captured.');

  // 8. Lead Automation
  console.log('Navigating to Lead Automation...');
  await page.goto('http://localhost:3000/dashboard/automation', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('main', { timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(screenshotDir, '07-lead-automation.png') });
  console.log('Lead Automation screenshot captured.');

  await browser.close();
  console.log('All screenshots captured successfully.');
})().catch(async err => {
  console.error('Screenshot capture crashed:', err);
  // Attempt to take a debug screenshot if browser/page is available
  try {
    if (page) {
      const errPath = path.join(__dirname, 'public', 'screenshots', 'error-debug.png');
      await page.screenshot({ path: errPath });
      console.log('Error screenshot saved to:', errPath);
      const bodyHtml = await page.evaluate(() => document.body.innerHTML);
      console.log('Page HTML snippet:', bodyHtml.substring(0, 1000));
    }
  } catch (e) {
    console.error('Failed to capture error details:', e);
  }
  if (browser) {
    await browser.close();
  }
  process.exit(1);
});
