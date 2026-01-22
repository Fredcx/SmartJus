import puppeteer from 'puppeteer-extra';
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
import { Browser } from 'puppeteer-core';

puppeteer.use(StealthPlugin());

export const getBrowser = async (): Promise<Browser> => {
    if (process.env.VERCEL) {
        const chromium = require('@sparticuz/chromium');
        return await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        }) as any;
    } else {
        // Standard puppeteer launch for local
        return await puppeteer.launch({
            headless: 'new',
            executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome-stable',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-blink-features=AutomationControlled',
                '--window-size=1920,1080'
            ],
        }) as any;
    }
};
