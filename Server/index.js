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
const fs_1 = __importDefault(require("fs"));
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
    console.log('saved');
    // await browser.close();
}))();
