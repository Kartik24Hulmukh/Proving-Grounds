import { allowed } from './app.mjs';

console.log('auth-token=ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890AB');
process.exit(allowed ? 0 : 1);
