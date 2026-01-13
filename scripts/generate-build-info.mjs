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
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

// Read package.json for version
const packageJsonPath = path.join(__dirname, '..', 'package.json');
let packageJson = { version: '1.0.0', name: 'Email Application Frontend' };

try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
  console.warn('Warning: Could not read package.json, using defaults');
}

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
    deployedBy: process.env.USER || process.env.USERNAME || 'docker',
  },
};

// Ensure public folder exists
const publicDir = path.join(__dirname, '..', 'public');
try {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('Created public directory');
  }
} catch (error) {
  console.error('Warning: Could not create public directory:', error.message);
}

// Write to public folder so it can be accessed at runtime
const outputPath = path.join(publicDir, 'build-info.json');
try {
  fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));
  console.log('✅ Frontend build info generated successfully!');
  console.log(JSON.stringify(buildInfo, null, 2));
} catch (error) {
  console.error('Warning: Could not write build-info.json:', error.message);
  console.error('Build will continue without build info...');
  // Don't fail the build, just warn
  process.exit(0);
}
