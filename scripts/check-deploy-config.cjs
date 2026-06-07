#!/usr/bin/env node
/** Validates deploy.config.json and prints the API URL for mobile + server deploy. */
const { resolveDeployApiUrl, PLACEHOLDER } = require('./resolve-deploy-api-url.cjs');

const url = resolveDeployApiUrl();

if (!url || PLACEHOLDER.test(url)) {
  console.error('Missing or placeholder API URL.');
  console.error('Copy deploy.config.example.json → deploy.config.json and set API_URL, e.g.:');
  console.error('  "API_URL": "https://mrantidot-api.onrender.com"');
  process.exit(1);
}

console.log('Deploy API URL:', url);
console.log('');
console.log('Mobile: EAS reads this via app.config.ts at build time.');
console.log('Test:   curl', url + '/api/health');
console.log('');
console.log('Build APK: cd mobile && npm run build:production');
