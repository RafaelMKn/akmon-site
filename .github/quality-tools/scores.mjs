import { appendFileSync, readFileSync, readdirSync } from 'node:fs';

const reports = readdirSync('.lighthouseci').filter(name => /^lhr-.*\.json$/.test(name)).sort();
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
  const samples = values.map(value => categories.map(category => {
    const score = value[category]?.score;
    if (typeof score !== 'number') throw new Error('Nota ausente: ' + category);
    return score;
  }));
  for (const [index, [performance, accessibility, seo]] of samples.entries()) {
    console.log('LIGHTHOUSE_MOBILE_RUN ' + route + ' run=' + (index + 1) +
      ' performance=' + Math.round(performance * 100) +
      ' accessibility=' + Math.round(accessibility * 100) +
      ' seo=' + Math.round(seo * 100));
  }
  const medians = categories.map((_, index) => {
    const scores = samples.map(sample => sample[index]).sort((a, b) => a - b);
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
