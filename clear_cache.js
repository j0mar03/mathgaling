/**
 * Netlify Cache Clearing Script
 * 
 * This script helps ensure that assets like logo.png are properly refreshed
 * by modifying the build timestamp in a way that forces Netlify to fetch new versions.
 */

const fs = require('fs');
const path = require('path');

// Generate a timestamp for cache busting
const timestamp = new Date().getTime();

// Function to update logo references in a file
function updateFileWithTimestamp(filePath, searchStr, replacePattern) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file contains the search string
    if (content.includes(searchStr)) {
      // Create the replacement with current timestamp
      const replacement = replacePattern.replace('{TIMESTAMP}', timestamp);
      
      // Replace the content
      const updatedContent = content.replace(
        new RegExp(searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
        replacement
      );
      
      // Write back to the file
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated ${filePath}`);
    } else {
      console.log(`⚠️ Search string not found in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
}

// List of files and patterns to update
const filesToUpdate = [
  {
    path: './client/src/components/shared/Header.js',
    search: '<img src=',
    replace: '<img src={`/logo.png?v={TIMESTAMP}`} alt="Math Tagumpay Logo" className="logo-icon"'
  },
  {
    path: './client/src/components/student/StudentDashboard.css',
    search: "background: url",
    replace: "background: url('../../assets/logo.png?v={TIMESTAMP}')"
  },
  // Add more files as needed
];

// Process each file
console.log('🚀 Starting cache clearing process...');
filesToUpdate.forEach(file => {
  updateFileWithTimestamp(
    path.resolve(__dirname, file.path),
    file.search,
    file.replace
  );
});

// Also update the build timestamp in a special file to force Netlify to rebuild
const buildTimestampFile = path.resolve(__dirname, './client/public/build_timestamp.js');
fs.writeFileSync(buildTimestampFile, `// Build timestamp: ${timestamp}\n// This file helps clear cache in Netlify deployments\nwindow.BUILD_TIMESTAMP = ${timestamp};`, 'utf8');
console.log(`✅ Created build timestamp file: ${buildTimestampFile}`);

console.log('✨ Cache clearing process complete. Ready for deployment!');