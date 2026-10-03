/** Exports a code-native Lucide brand mark; no reference photographs are edited. */
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const source=readFileSync('public/assets/brand/platform-icon.svg','utf8');
  for(const size of [192,512]) {
    const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
    await page.setContent(`<style>html,body{margin:0;width:100%;height:100%}svg{display:block;width:100%;height:100%}</style>${source}`);
    await page.screenshot({path:`public/assets/brand/platform-icon-${size}.png`});await page.close();
  }
} finally {await browser.close();}
