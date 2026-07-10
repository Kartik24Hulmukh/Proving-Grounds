import type { Capsule, ClaimResult } from './domain.js';
import { capsuleSchema } from './schema.js';
import { canonicalHash } from './utils.js';

function digestClaims(claims: ClaimResult[]): Array<Pick<ClaimResult, 'id' | 'type' | 'statement' | 'probe' | 'base' | 'head' | 'verdict'>> {
  return claims.map((claim) => ({
    id: claim.id,
    type: claim.type,
    statement: claim.statement,
    probe: claim.probe,
    base: claim.base,
    head: claim.head,
    verdict: claim.verdict,
  }));
}

export function capsuleDigest(body: Omit<Capsule, 'integrity'>): unknown {
  return {
    version: body.version,
    repository: body.repository,
    claims: digestClaims(body.claims),
    summary: body.summary,
    mutations: body.mutations ?? null,
    policy: body.policy ?? null,
  };
}

export function summarizeClaims(claims: ClaimResult[]): Capsule['summary'] {
  return claims.reduce<Capsule['summary']>(
    (summary, claim) => {
      summary[claim.verdict] += 1;
      return summary;
    },
    {
      demonstrated: 0,
      regression: 0,
      vacuous: 0,
      inconclusive: 0,
    },
  );
}

export function buildCapsule(body: Omit<Capsule, 'integrity'>): Capsule {
  const integrity = {
    capsuleHash: canonicalHash(capsuleDigest(body)),
  };
  return {
    ...body,
    integrity,
  };
}

export function validateCapsule(value: unknown): Capsule {
  return capsuleSchema.parse(value);
}
