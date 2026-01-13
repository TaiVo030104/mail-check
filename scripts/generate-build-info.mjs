#!/usr/bin/env node

/**
 * Generate build-info.json with version, build time, and git info
 * Run this script before building the frontend application
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

// Read package.json for version
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const buildInfo = {
  version: packageJson.version || '1.0.0',
  name: packageJson.name || 'Email Application Frontend',
  buildTime: new Date().toISOString(),
  environment: process.env.NODE_ENV || process.env.VITE_ENVIRONMENT || 'development',
  git: {
    commit: exec('git rev-parse HEAD'),
    commitShort: exec('git rev-parse --short HEAD'),
    branch: exec('git rev-parse --abbrev-ref HEAD'),
    tag: exec('git describe --tags --abbrev=0 2>/dev/null') || 'no-tag',
    author: exec('git log -1 --pretty=format:"%an"'),
    date: exec('git log -1 --pretty=format:"%ai"'),
    message: exec('git log -1 --pretty=format:"%s"'),
  },
  deployment: {
    deployedAt: new Date().toISOString(),
    deployedBy: process.env.USER || process.env.USERNAME || 'unknown',
  },
};

// Write to public folder so it can be accessed at runtime
const outputPath = path.join(__dirname, '..', 'public', 'build-info.json');
fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

console.log('✅ Frontend build info generated successfully!');
console.log(JSON.stringify(buildInfo, null, 2));
