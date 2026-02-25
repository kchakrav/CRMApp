/**
 * Verify Content Management listing pages render with standard table-helpers toolbar.
 * Run: node verify-content-pages.js
 */
const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const baseUrl = 'http://localhost:3000';
  const screenshots = [];

  try {
    // 1. Go to main app
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('.sidebar', { timeout: 5000 });

    // Expand Content Management section - click header to expand
    await page.locator('.nav-section-header').filter({ hasText: 'Content Management' }).click();
    await page.waitForTimeout(400);

    // 2. Content Templates - use evaluate to avoid overlay interception
    await page.evaluate(() => {
      const link = document.querySelector('a[data-view="content-templates"]');
      if (link) link.click();
    });
    await page.waitForSelector('.table-toolbar', { timeout: 5000 });
    await page.screenshot({ path: 'test-screenshots/content-templates.png' });
    screenshots.push({ page: 'Content Templates', path: 'test-screenshots/content-templates.png' });

    // 3. Landing Pages
    await page.evaluate(() => document.querySelector('a[data-view="landing-pages"]')?.click());
    await page.waitForSelector('.table-toolbar', { timeout: 5000 });
    await page.screenshot({ path: 'test-screenshots/landing-pages.png' });
    screenshots.push({ page: 'Landing Pages', path: 'test-screenshots/landing-pages.png' });

    // 4. Fragments
    await page.evaluate(() => document.querySelector('a[data-view="fragments"]')?.click());
    await page.waitForSelector('.table-toolbar', { timeout: 5000 });
    await page.screenshot({ path: 'test-screenshots/fragments.png' });
    screenshots.push({ page: 'Fragments', path: 'test-screenshots/fragments.png' });

    // 5. Brands
    await page.evaluate(() => document.querySelector('a[data-view="brands"]')?.click());
    await page.waitForSelector('.table-toolbar', { timeout: 5000 });
    await page.screenshot({ path: 'test-screenshots/brands.png' });
    screenshots.push({ page: 'Brands', path: 'test-screenshots/brands.png' });

    // Verify toolbar elements on each page
    const views = [
      { name: 'Content Templates', view: 'content-templates' },
      { name: 'Landing Pages', view: 'landing-pages' },
      { name: 'Fragments', view: 'fragments' },
      { name: 'Brands', view: 'brands' }
    ];
    const results = [];
    for (const { name, view } of views) {
      await page.evaluate((v) => document.querySelector(`a[data-view="${v}"]`)?.click(), view);
      await page.waitForTimeout(300);
      const hasFilter = (await page.locator('.toolbar-filter-btn').count()) > 0;
      const hasSearch = (await page.locator('.inline-search input').count()) > 0;
      const hasResultCount = (await page.locator('.result-counter').count()) > 0;
      const hasColumnSelector = (await page.locator('.column-selector-btn').count()) > 0;
      results.push({
        page: name,
        filterFunnel: hasFilter,
        searchBar: hasSearch,
        resultCount: hasResultCount,
        columnSelector: hasColumnSelector,
        allPresent: hasSearch && hasResultCount && hasColumnSelector
      });
    }

    console.log('\n=== Content Management Toolbar Verification ===\n');
    results.forEach(r => {
      console.log(`${r.page}:`);
      console.log(`  Filter funnel: ${r.filterFunnel ? 'YES' : 'NO'}`);
      console.log(`  Search bar: ${r.searchBar ? 'YES' : 'NO'}`);
      console.log(`  Result count: ${r.resultCount ? 'YES' : 'NO'}`);
      console.log(`  Column selector: ${r.columnSelector ? 'YES' : 'NO'}`);
      console.log(`  Standard toolbar: ${r.allPresent ? 'YES' : 'NO'}\n`);
    });
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
