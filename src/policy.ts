import type { Capsule, PolicyDocument } from './domain.js';
import { policySchema } from './schema.js';

export interface PolicyEvaluation {
  accepted: boolean;
  reasons: string[];
}

export function validatePolicy(value: unknown): PolicyDocument {
  return policySchema.parse(value);
}

export function evaluatePolicy(capsule: Pick<Capsule, 'summary' | 'mutations' | 'replay'>, policy: PolicyDocument): PolicyEvaluation {
  const reasons: string[] = [];
  if (policy.requireCapsule && !capsule) {
    reasons.push('capsule is required');
  }

  if (policy.maximumRegressions !== undefined && capsule.summary.regression > policy.maximumRegressions) {
    reasons.push(`regressions ${capsule.summary.regression} exceed ${policy.maximumRegressions}`);
  }

  if (
    policy.maximumVacuousIntendedClaims !== undefined &&
    capsule.summary.vacuous > policy.maximumVacuousIntendedClaims
  ) {
    reasons.push(`vacuous claims ${capsule.summary.vacuous} exceed ${policy.maximumVacuousIntendedClaims}`);
  }

  if (policy.allowInconclusive === false && capsule.summary.inconclusive > 0) {
    reasons.push(`inconclusive claims present (${capsule.summary.inconclusive})`);
  }

  const mutationSummary = capsule.mutations as Record<string, unknown> | undefined;
  if (policy.minimumValidMutants !== undefined) {
    const validMutants = typeof mutationSummary?.validMutants === 'number' ? mutationSummary.validMutants : 0;
    if (validMutants < policy.minimumValidMutants) {
      reasons.push(`valid mutants ${validMutants} below ${policy.minimumValidMutants}`);
    }
  }

  if (policy.minimumMutationStrength !== undefined) {
    const strength = typeof mutationSummary?.mutationStrength === 'number' ? mutationSummary.mutationStrength : 0;
    if (strength < policy.minimumMutationStrength) {
      reasons.push(`mutation strength ${strength} below ${policy.minimumMutationStrength}`);
    }
  }

  if (policy.requireReplay && capsule.replay === undefined) {
    reasons.push('replay evidence required');
  }

  return {
    accepted: reasons.length === 0,
    reasons,
  };
}
