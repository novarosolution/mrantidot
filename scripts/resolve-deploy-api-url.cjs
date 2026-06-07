#!/usr/bin/env node
/** Shared deploy URL resolver for mobile EAS builds and deploy:check. */
const fs = require('node:fs');
const path = require('node:path');

const PLACEHOLDER = /REPLACE|YOUR-SERVICE|your-public-api|example\.com/i;

function loadDeployConfig() {
  const configPath = path.join(__dirname, '..', 'deploy.config.json');
  try {
    if (!fs.existsSync(configPath)) return null;
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return null;
  }
}

function resolveDeployApiUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv && !PLACEHOLDER.test(fromEnv)) {
    return fromEnv.replace(/\/$/, '');
  }

  const deploy = loadDeployConfig();
  const fromFile = deploy?.API_URL?.trim();
  if (fromFile && !PLACEHOLDER.test(fromFile)) {
    return fromFile.replace(/\/$/, '');
  }

  return fromEnv?.replace(/\/$/, '');
}

module.exports = { loadDeployConfig, resolveDeployApiUrl, PLACEHOLDER };
