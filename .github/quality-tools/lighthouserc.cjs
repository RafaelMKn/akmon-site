module.exports = {
  ci: {
    collect: {
      url: process.env.QUALITY_ROUTES.split(' ').map(route => new URL(route, 'http://127.0.0.1:4173').href),
      numberOfRuns: 3,
      settings: {
        formFactor: 'mobile',
        onlyCategories: ['performance', 'accessibility', 'seo'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.90, aggregationMethod: 'median'}],
        'categories:accessibility': ['error', {minScore: 0.95, aggregationMethod: 'median'}],
        'categories:seo': ['error', {minScore: 0.95, aggregationMethod: 'median'}],
      },
    },
  },
};
