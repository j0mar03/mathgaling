#!/usr/bin/env node

/**
 * Debug script for Vercel deployment
 * Access at /api/debug
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Function to check if a module can be required
function canRequire(moduleName) {
  try {
    require.resolve(moduleName);
    return { success: true, path: require.resolve(moduleName) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Function to find all node_modules directories
function findNodeModulesDirs() {
  const dirs = [];
  const search = (dir, depth = 0) => {
    if (depth > 4) return; // Limit recursion depth
    
    try {
      const nodeModulesPath = path.join(dir, 'node_modules');
      if (fs.existsSync(nodeModulesPath) && fs.statSync(nodeModulesPath).isDirectory()) {
        dirs.push(nodeModulesPath);
      }
      
      const parentDir = path.dirname(dir);
      if (parentDir !== dir) { // Not at root yet
        search(parentDir, depth + 1);
      }
    } catch (err) {
      // Ignore errors
    }
  };
  
  search(process.cwd());
  return dirs;
}

// Modules to check
const CRITICAL_MODULES = [
  'jsonwebtoken',
  'pg',
  'bcrypt',
  'sequelize',
  'express',
  'cors',
  'dotenv'
];

// Create the debug report
function createDebugReport() {
  return {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV || 'unknown',
      cwd: process.cwd(),
      isVercel: process.env.VERCEL === '1' || process.env.NOW_REGION || process.cwd().includes('/var/task'),
      memoryUsage: process.memoryUsage(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem()
    },
    modules: CRITICAL_MODULES.map(name => ({
      name,
      ...canRequire(name)
    })),
    nodeModulesDirs: findNodeModulesDirs(),
    processEnv: Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('PASSWORD')).reduce((obj, key) => {
      obj[key] = process.env[key];
      return obj;
    }, {})
  };
}

module.exports = (req, res) => {
  // Check for admin parameter
  const isAdmin = req.query.admin === process.env.DEBUG_SECRET;
  
  const report = createDebugReport();
  
  // Only show full environment details to admins
  if (!isAdmin) {
    delete report.processEnv;
  }
  
  res.json({
    status: 'ok',
    message: 'Debug information',
    ...report
  });
};