#!/usr/bin/env node

// Simple script to test OAuth configuration
const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.PRODUCTION_API_URL || 'https://your-production-domain.com'
    : 'http://localhost:5001';

console.log('=== OAuth Configuration Test ===');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Base URL:', baseUrl);
console.log('Expected callback URL:', `${baseUrl}/auth/google/callback`);
console.log('');
console.log('Add this EXACT URL to your Google Cloud Console:');
console.log(`${baseUrl}/auth/google/callback`);
console.log('');
console.log('Also add these JavaScript origins:');
console.log('http://localhost:5001');
console.log('http://localhost:3000');
