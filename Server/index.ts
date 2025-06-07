import { chromium } from 'playwright';
import crypto from 'crypto';
import fs from 'fs';

interface Params{
    access_token: string;
    timestamp: string;
    checkcode: string;
    apiuser: string;
    openId: string;
    operateId: string;
    language: string;
    userId: string;
}

interface User {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
}

// TO generate the checkcode
const createSignedRequest = (params: Params) => {
    const timestamp = Math.floor(Date.now() / 1e3).toString();
    const allParams : Params = { ...params, timestamp };
  
    const payload = Object.keys(allParams)
      .sort()
      .map(key => `${key}=${encodeURIComponent((allParams as any)[key])}`)
      .join('&');
  
    const hmac = crypto.createHmac('sha1', 'mys3cr3t');
    hmac.update(payload);
  
    const checkcode = hmac.digest('hex').toUpperCase();
  
    return {
      checkcode,
      timestamp
    };
  }

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
    const users : User[] = await res.json();

    // Create a users.json file
    fs.writeFileSync('users.json', JSON.stringify(users, null,  2));
    console.log('Users Saved in users.json');

    // Get payloads to get user setting info
    const payloads : any = await page.evaluate(`(async () => {
        const response = await fetch('https://challenge.sunvoy.com/settings/tokens', {
        credentials: 'include',
        });
        if (!response.ok) throw new Error(response.status);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        return {
            access_token : doc.getElementById('access_token').value,
            apiuser : doc.getElementById('apiuser').value,
            openId : doc.getElementById('openId').value,
            operateId : doc.getElementById('operateId').value,
            language : doc.getElementById('language').value,
            userId : doc.getElementById('userId').value
        };
    })()`);

    const signed = createSignedRequest(payloads as Params);
    const currentUserResponse = await page.request.post('https://api.challenge.sunvoy.com/api/settings', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({
          access_token: payloads.access_token,
          timestamp: signed.timestamp,
          checkcode: signed.checkcode,
          apiuser: payloads.apiuser,
          openId: payloads.openId,
          operateId: payloads.operateId,
          language: payloads.language,
          userId: payloads.userId,
        }),
      });

      //For demo purposed
        await new Promise((resolve, reject) => {setTimeout(()=>{resolve('done')}, 5000)});

        const currentUser = await currentUserResponse.json();
        
        let user_list: User[] = [];
        try {
            const data = fs.readFileSync('users.json', 'utf8');
            user_list = JSON.parse(data);
        } catch (error) {
            user_list = []
        }

        user_list.push(currentUser);
        fs.writeFileSync('users.json', JSON.stringify(user_list, null, 2));
        console.log('Current User Saved in users.json');



})();
