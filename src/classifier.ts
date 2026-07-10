import type { ClaimType, Outcome, Verdict } from './domain.js';

export function classify(type: ClaimType, base: Outcome, head: Outcome): Verdict {
  if (base === 'unknown' || head === 'unknown') {
    return 'inconclusive';
  }

  if (type === 'intended_delta') {
    if (base === 'fail' && head === 'pass') {
      return 'demonstrated';
    }
    if (base === 'pass' && head === 'pass') {
      return 'vacuous';
    }
    if (base === 'pass' && head === 'fail') {
      return 'regression';
    }
    return 'inconclusive';
  }

  if (base === 'pass' && head === 'pass') {
    return 'demonstrated';
  }
  if (base === 'pass' && head === 'fail') {
    return 'regression';
  }
  return 'inconclusive';
}
