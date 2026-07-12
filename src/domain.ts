export type ClaimType = 'intended_delta' | 'invariant';
export type Outcome = 'pass' | 'fail' | 'unknown';
export type Verdict = 'demonstrated' | 'regression' | 'vacuous' | 'inconclusive';

export interface ClaimProbe {
  command: string[];
  timeoutMs?: number;
}

export interface ClaimInput {
  id: string;
  type: ClaimType;
  statement: string;
  probe: ClaimProbe;
}

export interface ClaimsDocument {
  version: '0.1';
  claims: ClaimInput[];
}

export interface ProbeAttempt {
  command: string[];
  cwd: string;
  timeoutMs: number;
  outcome: Outcome;
  exitCode: number | null;
  signal: string | null;
  durationMs: number;
  stdout: string;
  stderr: string;
}

export interface ClaimResult extends ClaimInput {
  base: Outcome;
  head: Outcome;
  verdict: Verdict;
  baseAttempts: ProbeAttempt[];
  headAttempts: ProbeAttempt[];
}

export interface CapsuleRepository {
  root: string;
  baseRef: string;
  headRef: string;
  baseSha: string;
  headSha: string;
  claimsPath: string;
}

export interface CapsuleSummary {
  demonstrated: number;
  regression: number;
  vacuous: number;
  inconclusive: number;
}

export interface CapsuleArtifact {
  path: string;
  sha256: string;
}

export interface CapsuleReplay {
  command: string[];
  workingDirectory: string;
}

export interface Capsule {
  version: '0.1';
  createdAt: string;
  repository: CapsuleRepository;
  claims: ClaimResult[];
  summary: CapsuleSummary;
  artifacts: Record<string, CapsuleArtifact>;
  generatedBy: Record<string, unknown>;
  replay: CapsuleReplay;
  mutations?: Record<string, unknown>;
  policy?: Record<string, unknown>;
  integrity: {
    capsuleHash: string;
  };
}

export interface PolicyDocument {
  evidencePolicyVersion: '0.1';
  requireCapsule: boolean;
  maximumRegressions?: number;
  maximumVacuousIntendedClaims?: number;
  allowInconclusive?: boolean;
  minimumValidMutants?: number;
  minimumMutationStrength?: number;
  requireReplay?: boolean;
}

export interface PluginManifest {
  id: string;
  version: string;
  kind: 'language' | 'runner' | 'mutator' | 'oracle' | 'execution' | 'agent' | 'renderer' | 'attestation';
  license: string;
  capabilities: string[];
  securityRequirements?: string[];
}

export interface ValidationReport {
  kind: 'claims' | 'capsule' | 'policy' | 'plugin';
  valid: boolean;
  path: string;
  detail: string;
}
