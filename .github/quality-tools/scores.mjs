import { appendFileSync, readFileSync, readdirSync } from 'node:fs';

const reports = readdirSync('.lighthouseci').filter(name => /^lhr-.*\.json$/.test(name));
if (!reports.length) throw new Error('Lighthouse CI não gerou relatórios.');
const byUrl = new Map();
for (const name of reports) {
  const report = JSON.parse(readFileSync('.lighthouseci/' + name, 'utf8'));
  const results = byUrl.get(report.requestedUrl) ?? [];
  results.push(report.categories);
  byUrl.set(report.requestedUrl, results);
}
const categories = ['performance', 'accessibility', 'seo'];
const rows = [];
for (const [url, values] of byUrl) {
  const route = new URL(url).pathname;
  const medians = categories.map(category => {
    const scores = values.map(value => value[category]?.score).sort((a, b) => a - b);
    if (scores.some(score => typeof score !== 'number')) throw new Error('Nota ausente: ' + category);
    return Math.round(scores[Math.floor(scores.length / 2)] * 100);
  });
  console.log('LIGHTHOUSE_MOBILE ' + route + ' performance=' + medians[0] +
    ' accessibility=' + medians[1] + ' seo=' + medians[2]);
  rows.push('| ' + route + ' | ' + medians.join(' | ') + ' |');
}
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    '## Lighthouse CI mobile\n\n| Rota | Performance | Acessibilidade | SEO |\n' +
    '|---|---:|---:|---:|\n' + rows.join('\n') + '\n');
}
