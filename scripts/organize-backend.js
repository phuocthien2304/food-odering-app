const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SERVICES = [
  'api-gateway',
  'user-service',
  'order-service',
  'restaurant-service',
  'delivery-service',
  'payment-service'
];

const rootDir = path.join(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');

// Ensure backend directory exists
if (!fs.existsSync(backendDir)) {
  fs.mkdirSync(backendDir, { recursive: true });
}

// Move each service to backend folder
SERVICES.forEach(service => {
  const sourcePath = path.join(rootDir, service);
  const destPath = path.join(backendDir, service);
  
  if (fs.existsSync(sourcePath)) {
    console.log(`Moving ${service}...`);
    try {
      // Using system command to move folder
      if (process.platform === 'win32') {
        execSync(`move "${sourcePath}" "${destPath}"`, { stdio: 'inherit' });
      } else {
        execSync(`mv "${sourcePath}" "${destPath}"`, { stdio: 'inherit' });
      }
      console.log(`✓ Moved ${service} to backend/`);
    } catch (error) {
      console.error(`✗ Error moving ${service}:`, error.message);
    }
  } else {
    console.log(`⚠ Service not found: ${service}`);
  }
});

console.log('\n✓ All services moved to backend/');
