const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  
  console.log("Navigating to BytePlus console...");
  await page.goto('https://console.byteplus.com/en/login', { waitUntil: 'networkidle' });
  
  // Take a screenshot to see what's on the page
  await page.screenshot({ path: '/tmp/byteplus-login.png', fullPage: true });
  console.log("Screenshot saved to /tmp/byteplus-login.png");
  
  // Try to find the Google login button
  const pageContent = await page.content();
  
  // Log the main text visible on page
  const text = await page.evaluate(() => document.body.innerText);
  console.log("Page text:", text.substring(0, 1000));
  
  // Check for buttons/links
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a, [role="button"]')).map(el => ({
      text: el.textContent.trim().substring(0, 50),
      tag: el.tagName,
      href: el.href || '',
      id: el.id || '',
      class: el.className?.substring(0, 60) || ''
    }));
  });
  console.log("Buttons:", JSON.stringify(buttons, null, 2));
  
  await browser.close();
})();
