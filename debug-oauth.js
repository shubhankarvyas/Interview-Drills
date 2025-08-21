// Debug OAuth URLs
const url = require('url');

const baseUrl = 'http://localhost:5001';
const callbackPath = '/auth/google/callback';
const fullCallbackUrl = `${baseUrl}${callbackPath}`;

console.log('=== OAuth Debug Information ===');
console.log('Base URL:', baseUrl);
console.log('Callback Path:', callbackPath);
console.log('Full Callback URL:', fullCallbackUrl);
console.log('URL Encoded:', encodeURIComponent(fullCallbackUrl));
console.log('');
console.log('What Google should have in Authorized redirect URIs:');
console.log(`  ${fullCallbackUrl}`);
console.log('');
console.log('What Google should have in Authorized JavaScript origins:');
console.log('  http://localhost:3000');
console.log('  http://localhost:5001');
console.log('');
console.log('Try accessing this URL directly in your browser:');
console.log(`http://localhost:3000`);
console.log('Then click the Google sign-in button.');
