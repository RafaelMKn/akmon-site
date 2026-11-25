import { AxeBuilder } from '@axe-core/playwright';
import { chromium, devices } from 'playwright';

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
try {
  const context = await browser.newContext(devices['Pixel 7']);
  const page = await context.newPage();
  let violations = 0;
  for (const route of process.env.QUALITY_ROUTES.split(' ')) {
    const url = new URL(route, 'http://127.0.0.1:4173').href;
    const response = await page.goto(url, {waitUntil: 'load', timeout: 30_000});
    if (response?.status() !== 200) throw new Error('Prévia indisponível: ' + route);
    const results = await new AxeBuilder({page}).analyze();
    const failures = results.violations.filter(({impact}) => ['serious', 'critical'].includes(impact));
    violations += failures.length;
    console.log('AXE ' + route + ' serious_or_critical=' + failures.length);
    for (const {id, impact, nodes} of failures) {
      console.error(impact + ' ' + id + ': ' + nodes.map(node => node.target.join(' ')).join(', '));
    }
  }
  if (violations > 0) process.exitCode = 1;
} finally {
  await browser.close();
}
