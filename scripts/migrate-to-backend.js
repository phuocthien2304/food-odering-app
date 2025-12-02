const fs = require('fs');
const path = require('path');

const SERVICES = [
  'api-gateway',
  'user-service',
  'order-service',
  'restaurant-service',
  'delivery-service',
  'payment-service'
];

const rootDir = process.cwd();
const backendDir = path.join(rootDir, 'backend');

console.log('[v0] Starting migration to backend structure...\n');

// Ensure backend directory exists
if (!fs.existsSync(backendDir)) {
  fs.mkdirSync(backendDir, { recursive: true });
  console.log('[v0] Created backend directory');
}

// Move each service
SERVICES.forEach(service => {
  const sourcePath = path.join(rootDir, service);
  const destPath = path.join(backendDir, service);
  
  if (fs.existsSync(sourcePath) && !fs.existsSync(destPath)) {
    console.log(`[v0] Moving ${service}...`);
    
    // Copy directory recursively
    copyDirRecursive(sourcePath, destPath);
    
    // Remove source directory
    removeDirRecursive(sourcePath);
    console.log(`[v0] ✓ Moved ${service} to backend/\n`);
  } else if (fs.existsSync(destPath)) {
    console.log(`[v0] ${service} already in backend/, skipping...\n`);
  } else {
    console.log(`[v0] ⚠ ${service} not found, skipping...\n`);
  }
});

// Helper function to copy directory recursively
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src);
  items.forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Helper function to remove directory recursively
function removeDirRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        removeDirRecursive(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

console.log('[v0] ✓ Migration complete! Services are now in backend/ directory');
