import assert from 'node:assert/strict';
import { normalizeEmail } from './app.mjs';

assert.equal(normalizeEmail('  Team@Example.com '), 'team@example.com');
