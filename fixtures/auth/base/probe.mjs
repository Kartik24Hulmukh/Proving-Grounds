import assert from 'node:assert/strict';
import { canExportCsv } from './app.mjs';

const demoUser = { authenticated: true, role: 'member' };

assert.equal(canExportCsv(demoUser), true);
