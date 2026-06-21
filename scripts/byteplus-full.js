const { chromium } = require('playwright');
const fs = require('fs');

const EMAIL = 'hsxtuiter@gmail.com';
const PASSWORD = 'xxx808080';
const SCREENSHOT_DIR = '/tmp/byteplus-screenshots';

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function ss(page, name) {
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: true });
  console.log(`📸 Screenshot: ${name}`);
}

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    timeout: 60000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  
  console.log("🚀 Navigating to BytePlus Console...");
  await page.goto('https://console.byteplus.com/en/login', { waitUntil: 'networkidle', timeout: 30000 });
  await ss(page, '01-login-page');
  
  // Dismiss cookie banner first
  try {
    const acceptBtn = page.locator('button:has-text("Accept"), button:has-text("OK"), button:has-text("Got it"), [class*="cookie"] button, [id*="cookie"] button');
    const visible = await acceptBtn.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (visible) {
      console.log("🍪 Dismissing cookie banner...");
      await acceptBtn.first().click({ force: true, timeout: 5000 });
      await page.waitForTimeout(1000);
      await ss(page, '01b-after-cookie');
    }
  } catch(e) {
    console.log("Cookie banner handling:", e.message.substring(0,60));
  }
  
  // Click "Continue with Google"
  console.log("🔍 Looking for Google button...");
  const googleBtn = page.locator('button:has-text("Continue with Google")');
  const googleVisible = await googleBtn.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (!googleVisible) {
    console.log("❌ Google button not visible, checking page...");
    const text = await page.evaluate(() => document.body.innerText);
    console.log("Page text:", text.substring(0, 500));
    await ss(page, '01c-no-google');
    await browser.close();
    return;
  }
  
  console.log("✅ Found Google button, clicking...");
  await googleBtn.click({ force: true, timeout: 10000 });
  
  // Wait for Google OAuth page to load (inline redirect, not popup)
  await page.waitForTimeout(5000);
  await ss(page, '02-google-oauth');
  console.log("URL after click:", page.url().substring(0, 100));
  
  // Enter email on Google sign-in
  const emailInput = page.locator('input[type="email"]');
  const emailVisible = await emailInput.isVisible({ timeout: 15000 }).catch(() => false);
  if (emailVisible) {
    console.log("✏️ Entering email...");
    await emailInput.fill(EMAIL);
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Next"), #identifierNext').first().click();
    await page.waitForTimeout(5000);
    await ss(page, '03-after-email');
    
    // Enter password
    const pwdInput = page.locator('input[type="password"]');
    const pwdVisible = await pwdInput.isVisible({ timeout: 10000 }).catch(() => false);
    if (pwdVisible) {
      console.log("✏️ Entering password...");
      await pwdInput.fill(PASSWORD);
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Next"), #passwordNext').first().click();
      await page.waitForTimeout(8000);
      await ss(page, '04-after-password');
      console.log("URL after password:", page.url().substring(0, 100));
    } else {
      console.log("⚠️ Password field not found, checking page...");
      const t = await page.evaluate(() => document.body.innerText);
      console.log("Page text:", t.substring(0, 300));
      await ss(page, '03b-no-password');
    }
  } else {
    console.log("⚠️ Email field not found, checking page...");
    const t = await page.evaluate(() => document.body.innerText);
    console.log("Page text:", t.substring(0, 300));
    await ss(page, '02b-no-email');
  }
  
  // Wait for redirect back to BytePlus
  await page.waitForTimeout(5000);
  await ss(page, '05-byteplus-redirect');
  console.log("Post-login URL:", page.url().substring(0, 100));
  
  // Save page text
  const text = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync('/tmp/byteplus-state.txt', text);
  console.log("Page text saved");
  
  // Check if there's a signup form to fill
  const signupBtn = page.locator('button:has-text("Sign Up"), button:has-text("Create"), button:has-text("Submit"), [type="submit"]');
  const signupVisible = await signupBtn.first().isVisible({ timeout: 5000 }).catch(() => false);
  if (signupVisible) {
    console.log("📝 Signup/registration form detected");
    await ss(page, '06-signup-form');
  }
  
  // Try navigating to API keys
  console.log("🔑 Attempting to navigate to API keys...");
  try {
    await page.goto('https://console.byteplus.com/en/setting/api-key', { 
      waitUntil: 'networkidle', timeout: 15000 
    });
    await ss(page, '07-api-keys');
    console.log("API keys page loaded");
    
    // Check if there's a "Create API Key" button
    const createBtn = page.locator('button:has-text("Create"), button:has-text("New"), [class*="create"] button');
    const createVisible = await createBtn.first().isVisible({ timeout: 3000 }).catch(() => false);
    if (createVisible) {
      console.log("✅ Found Create API Key button");
      await ss(page, '08-create-key');
    }
    
    // Save API key page text
    const keyText = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('/tmp/byteplus-apikey.txt', keyText);
    console.log("API key page content saved");
    
  } catch(e) {
    console.log("⚠️ Could not navigate to API keys:", e.message.substring(0,100));
    // Try alternate URL
    try {
      await page.goto('https://console.byteplus.com/en/setting/secretKey', { 
        waitUntil: 'networkidle', timeout: 15000 
      });
      await ss(page, '07b-secret-key');
    } catch(e2) {
      console.log("Also failed:", e2.message.substring(0,60));
    }
  }
  
  console.log("\n✅ Done! Check screenshots in", SCREENSHOT_DIR);
  await browser.close();
})().catch(err => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
