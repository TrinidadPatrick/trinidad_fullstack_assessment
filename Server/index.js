"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const playwright_1 = require("playwright");
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const createSignedRequest = (params) => {
    const timestamp = Math.floor(Date.now() / 1e3).toString();
    const allParams = Object.assign(Object.assign({}, params), { timestamp });
    const payload = Object.keys(allParams)
        .sort()
        .map(key => `${key}=${encodeURIComponent(allParams[key])}`)
        .join('&');
    const hmac = crypto_1.default.createHmac('sha1', 'mys3cr3t');
    hmac.update(payload);
    const checkcode = hmac.digest('hex').toUpperCase();
    return {
        checkcode,
        timestamp
    };
};
(() => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield playwright_1.chromium.launch({ headless: true });
    const context = yield browser.newContext();
    const page = yield context.newPage();
    yield page.goto('https://challenge.sunvoy.com/login');
    yield page.fill('input[name="username"]', 'demo@example.org');
    yield page.fill('input[name="password"]', 'test');
    yield page.click('button[type="submit"]');
    yield page.waitForURL('**/list');
    //Get Users list
    const res = yield page.request.post('https://challenge.sunvoy.com/api/users');
    const users = yield res.json();
    fs_1.default.writeFileSync('users.json', JSON.stringify(users, null, 2));
    console.log('Users Saved in users.json');
    const payloads = yield page.evaluate(`(async () => {
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
    const signed = createSignedRequest(payloads);
    const currentUserResponse = yield page.request.post('https://api.challenge.sunvoy.com/api/settings', {
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
    yield new Promise((resolve, reject) => { setTimeout(() => { resolve('done'); }, 5000); });
    const currentUser = yield currentUserResponse.json();
    let user_list = [];
    try {
        const data = fs_1.default.readFileSync('users.json', 'utf8');
        user_list = JSON.parse(data);
    }
    catch (error) {
        user_list = [];
    }
    user_list.push(currentUser);
    fs_1.default.writeFileSync('users.json', JSON.stringify(user_list, null, 2));
    console.log('Current User Saved in users.json');
}))();
//# sourceMappingURL=index.js.map