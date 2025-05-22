#!/usr/bin/env node

/**
 * Post-install script to ensure all critical dependencies are installed
 * This runs automatically after 'npm install' in the API directory
 */

console.log('🔄 Running post-install dependency check...');

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// List of critical modules that must be available
const CRITICAL_MODULES = [
  'jsonwebtoken',
  'pg',
  'pg-hstore',
  'bcrypt',
  'sequelize',
  'express',
  'cors',
  'dotenv',
  'multer'
];

// Check if we're running in a Vercel environment
const isVercel = process.env.VERCEL === '1' || process.env.NOW_REGION || process.cwd().includes('/var/task');
console.log(`Environment: ${isVercel ? 'Vercel' : 'Local'}`);
console.log('Current working directory:', process.cwd());

// Function to check if a module can be required
function canRequire(moduleName) {
  try {
    require.resolve(moduleName);
    return true;
  } catch (err) {
    return false;
  }
}

// Function to check if a module is physically present
function isModulePresent(moduleName) {
  try {
    // Check in various node_modules locations
    const possiblePaths = [
      path.join(process.cwd(), 'node_modules', moduleName),
      path.join(process.cwd(), '..', 'node_modules', moduleName),
      path.join(process.cwd(), '..', '..', 'node_modules', moduleName),
      isVercel ? path.join('/var/task', 'node_modules', moduleName) : null
    ].filter(Boolean);
    
    return possiblePaths.some(p => fs.existsSync(p));
  } catch (err) {
    return false;
  }
}

// Install missing modules
let installedModules = 0;
const failedModules = [];

for (const moduleName of CRITICAL_MODULES) {
  const canLoad = canRequire(moduleName);
  const isPresent = isModulePresent(moduleName);
  
  console.log(`📦 ${moduleName}: ${canLoad ? '✅ Loadable' : '❌ Not loadable'}, ${isPresent ? '✅ Present' : '❌ Not present'}`);
  
  if (!canLoad || !isPresent) {
    try {
      console.log(`⏳ Installing ${moduleName}...`);
      execSync(`npm install ${moduleName} --no-save`, { stdio: 'inherit' });
      console.log(`✅ Installed ${moduleName} successfully`);
      installedModules++;
    } catch (err) {
      console.error(`❌ Failed to install ${moduleName}:`, err.message);
      failedModules.push(moduleName);
    }
  }
}

// Report results
console.log('\n📊 Post-install summary:');
console.log(`- Installed ${installedModules} missing modules`);
if (failedModules.length > 0) {
  console.log(`- Failed to install ${failedModules.length} modules: ${failedModules.join(', ')}`);
}

// Create a marker file to indicate post-install has run
try {
  fs.writeFileSync(
    path.join(process.cwd(), '.post-install-complete'), 
    `Post-install completed at ${new Date().toISOString()}\n` +
    `Working directory: ${process.cwd()}\n` +
    `Installed modules: ${installedModules}\n` +
    `Failed modules: ${failedModules.join(', ') || 'None'}\n`
  );
} catch (err) {
  console.error('Failed to write post-install marker file:', err.message);
}

console.log('✅ Post-install completed');