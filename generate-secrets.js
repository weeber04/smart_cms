const crypto = require('crypto');

console.log('=== Generating Secrets ===\n');

// Generate JWT Secret
const jwtSecret = crypto.randomBytes(32).toString('base64');
console.log('JWT_SECRET=' + jwtSecret);

// Generate Refresh Token Secret
const refreshSecret = crypto.randomBytes(32).toString('base64');
console.log('REFRESH_TOKEN_SECRET=' + refreshSecret);

// Generate Session Secret
const sessionSecret = crypto.randomBytes(32).toString('base64');
console.log('SESSION_SECRET=' + sessionSecret);

console.log('\n=== Copy these to your .env file ===');