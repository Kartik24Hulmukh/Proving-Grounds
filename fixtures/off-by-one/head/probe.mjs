import assert from 'node:assert/strict';
import { isEligible } from './app.mjs';

assert.equal(isEligible(10), true);
