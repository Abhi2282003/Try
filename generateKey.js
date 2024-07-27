const crypto = require('crypto');

// Generate a 256-bit (32-byte) random key
const key = crypto.randomBytes(32).toString('hex');
console.log('Your JWT secret key:', key);
