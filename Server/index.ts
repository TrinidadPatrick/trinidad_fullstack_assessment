import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://challenge.sunvoy.com/login');

  await page.fill('input[name="username"]', 'demo@example.org');
  await page.fill('input[name="password"]', 'test');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/list');

  //Get Users list
  const res = await page.request.post('https://challenge.sunvoy.com/api/users');
  const users = await res.json();

    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    console.log('saved');

})();
