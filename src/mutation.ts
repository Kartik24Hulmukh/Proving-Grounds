import ts from 'typescript';

export interface MutationRange {
  start: number;
  end: number;
}

export interface MutationCandidate {
  operator:
    | 'boolean_flip'
    | 'comparison_inversion'
    | 'branch_removal'
    | 'boundary_change'
    | 'http_status_swap'
    | 'await_removal'
    | 'return_substitution';
  description: string;
  start: number;
  end: number;
  replacement: string;
  mutatedSource: string;
}

export interface ScreenedMutation extends MutationCandidate {
  valid: boolean;
  diagnostics: readonly ts.Diagnostic[];
}

function intersectsLineRanges(node: ts.Node, sourceFile: ts.SourceFile, ranges?: MutationRange[]): boolean {
  if (!ranges || ranges.length === 0) {
    return true;
  }

  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
  return ranges.some((range) => !(end < range.start || start > range.end));
}

function applyReplacement(source: string, start: number, end: number, replacement: string): string {
  return `${source.slice(0, start)}${replacement}${source.slice(end)}`;
}

function lineNumber(sourceFile: ts.SourceFile, position: number): number {
  return sourceFile.getLineAndCharacterOfPosition(position).line + 1;
}

function createCandidate(
  operator: MutationCandidate['operator'],
  description: string,
  source: string,
  start: number,
  end: number,
  replacement: string,
): MutationCandidate {
  return {
    operator,
    description,
    start,
    end,
    replacement,
    mutatedSource: applyReplacement(source, start, end, replacement),
  };
}

function invertComparison(token: ts.BinaryOperatorToken): string | undefined {
  switch (token.kind) {
    case ts.SyntaxKind.EqualsEqualsToken:
      return '!=';
    case ts.SyntaxKind.ExclamationEqualsToken:
      return '==';
    case ts.SyntaxKind.EqualsEqualsEqualsToken:
      return '!==';
    case ts.SyntaxKind.ExclamationEqualsEqualsToken:
      return '===';
    case ts.SyntaxKind.GreaterThanToken:
      return '<=';
    case ts.SyntaxKind.GreaterThanEqualsToken:
      return '<';
    case ts.SyntaxKind.LessThanToken:
      return '>=';
    case ts.SyntaxKind.LessThanEqualsToken:
      return '>';
    default:
      return undefined;
  }
}

function adjustNumericLiteral(value: string, delta: number): string | undefined {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return undefined;
  }
  return String(parsed + delta);
}

function isStatusLiteral(node: ts.Node): node is ts.NumericLiteral {
  return ts.isNumericLiteral(node) && [200, 201, 204, 400, 401, 403, 404, 500].includes(Number(node.text));
}

function isStatusContext(node: ts.Node): boolean {
  const parent = node.parent;
  if (!parent) {
    return false;
  }
  if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
    return parent.name.text.toLowerCase().includes('status');
  }
  if (ts.isCallExpression(parent)) {
    const expression = parent.expression;
    if (ts.isIdentifier(expression)) {
      return ['status', 'sendstatus', 'responsestatus'].some((value) => expression.text.toLowerCase().includes(value));
    }
    if (ts.isPropertyAccessExpression(expression)) {
      return expression.name.text.toLowerCase().includes('status');
    }
  }
  return false;
}

function statusReplacement(value: number): number | undefined {
  switch (value) {
    case 200:
    case 201:
    case 204:
      return 500;
    case 400:
    case 401:
    case 403:
    case 404:
      return 200;
    case 500:
      return 200;
    default:
      return undefined;
  }
}

function visit(
  sourceFile: ts.SourceFile,
  sourceText: string,
  node: ts.Node,
  ranges: MutationRange[] | undefined,
  mutants: MutationCandidate[],
  seen: Set<string>,
): void {
  if (!intersectsLineRanges(node, sourceFile, ranges)) {
    ts.forEachChild(node, (child) => visit(sourceFile, sourceText, child, ranges, mutants, seen));
    return;
  }

  if (ts.isBinaryExpression(node)) {
    const { operatorToken, left, right } = node;
    const replacementToken = (() => {
      if (operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
        return '||';
      }
      if (operatorToken.kind === ts.SyntaxKind.BarBarToken) {
        return '&&';
      }
      return invertComparison(operatorToken);
    })();

    if (replacementToken) {
      const candidate = createCandidate(
        operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken || operatorToken.kind === ts.SyntaxKind.BarBarToken
          ? 'boolean_flip'
          : 'comparison_inversion',
        `replace ${ts.tokenToString(operatorToken.kind) ?? 'operator'} with ${replacementToken}`,
        sourceText,
        operatorToken.getStart(sourceFile),
        operatorToken.getEnd(),
        replacementToken,
      );
      if (!seen.has(candidate.mutatedSource)) {
        seen.add(candidate.mutatedSource);
        mutants.push(candidate);
      }
    }

    const maybeBoundary = (() => {
      if (ts.isNumericLiteral(left)) {
        if ([ts.SyntaxKind.LessThanToken, ts.SyntaxKind.LessThanEqualsToken].includes(operatorToken.kind)) {
          return adjustNumericLiteral(left.text, operatorToken.kind === ts.SyntaxKind.LessThanToken ? 1 : -1);
        }
        if ([ts.SyntaxKind.GreaterThanToken, ts.SyntaxKind.GreaterThanEqualsToken].includes(operatorToken.kind)) {
          return adjustNumericLiteral(left.text, operatorToken.kind === ts.SyntaxKind.GreaterThanToken ? -1 : 1);
        }
        if ([ts.SyntaxKind.PlusToken, ts.SyntaxKind.MinusToken].includes(operatorToken.kind) && left.text === '1') {
          return adjustNumericLiteral(left.text, operatorToken.kind === ts.SyntaxKind.PlusToken ? 1 : -1);
        }
      }
      if (ts.isNumericLiteral(right)) {
        if ([ts.SyntaxKind.LessThanToken, ts.SyntaxKind.LessThanEqualsToken].includes(operatorToken.kind)) {
          return adjustNumericLiteral(right.text, operatorToken.kind === ts.SyntaxKind.LessThanToken ? -1 : 1);
        }
        if ([ts.SyntaxKind.GreaterThanToken, ts.SyntaxKind.GreaterThanEqualsToken].includes(operatorToken.kind)) {
          return adjustNumericLiteral(right.text, operatorToken.kind === ts.SyntaxKind.GreaterThanToken ? 1 : -1);
        }
        if ([ts.SyntaxKind.PlusToken, ts.SyntaxKind.MinusToken].includes(operatorToken.kind) && right.text === '1') {
          return adjustNumericLiteral(right.text, operatorToken.kind === ts.SyntaxKind.PlusToken ? 1 : -1);
        }
      }
      return undefined;
    })();

    if (maybeBoundary) {
      const target = ts.isNumericLiteral(left)
        ? left
        : ts.isNumericLiteral(right)
          ? right
          : undefined;
      if (target) {
        const candidate = createCandidate(
          'boundary_change',
          `shift numeric boundary to ${maybeBoundary}`,
          sourceText,
          target.getStart(sourceFile),
          target.getEnd(),
          maybeBoundary,
        );
        if (!seen.has(candidate.mutatedSource)) {
          seen.add(candidate.mutatedSource);
          mutants.push(candidate);
        }
      }
    }

    if (isStatusContext(node) && (ts.isNumericLiteral(left) || ts.isNumericLiteral(right))) {
      const target = ts.isNumericLiteral(left) ? left : ts.isNumericLiteral(right) ? right : undefined;
      if (!target) {
        ts.forEachChild(node, (child) => visit(sourceFile, sourceText, child, ranges, mutants, seen));
        return;
      }
      const replacement = statusReplacement(Number(target.text));
      if (replacement !== undefined) {
        const candidate = createCandidate(
          'http_status_swap',
          `swap HTTP status ${target.text} to ${replacement}`,
          sourceText,
          target.getStart(sourceFile),
          target.getEnd(),
          String(replacement),
        );
        if (!seen.has(candidate.mutatedSource)) {
          seen.add(candidate.mutatedSource);
          mutants.push(candidate);
        }
      }
    }
  }

  if (ts.isIfStatement(node)) {
    const replacement = node.elseStatement ? node.elseStatement.getText(sourceFile) : ';';
    const candidate = createCandidate(
      'branch_removal',
      node.elseStatement ? 'remove then-branch' : 'remove branch body',
      sourceText,
      node.getStart(sourceFile),
      node.getEnd(),
      replacement,
    );
    if (!seen.has(candidate.mutatedSource)) {
      seen.add(candidate.mutatedSource);
      mutants.push(candidate);
    }
  }

  if (ts.isAwaitExpression(node)) {
    const candidate = createCandidate(
      'await_removal',
      'remove await',
      sourceText,
      node.getStart(sourceFile),
      node.getEnd(),
      node.expression.getText(sourceFile),
    );
    if (!seen.has(candidate.mutatedSource)) {
      seen.add(candidate.mutatedSource);
      mutants.push(candidate);
    }
  }

  if (ts.isReturnStatement(node) && node.expression) {
    let replacementExpression = 'undefined';
    if (node.expression.kind === ts.SyntaxKind.TrueKeyword) {
      replacementExpression = 'false';
    } else if (node.expression.kind === ts.SyntaxKind.FalseKeyword) {
      replacementExpression = 'true';
    } else if (ts.isNumericLiteral(node.expression)) {
      replacementExpression = String(Number(node.expression.text) + 1);
    } else if (ts.isStringLiteral(node.expression)) {
      replacementExpression = '""';
    }
    const candidate = createCandidate(
      'return_substitution',
      `replace return expression with ${replacementExpression}`,
      sourceText,
      node.expression.getStart(sourceFile),
      node.expression.getEnd(),
      replacementExpression,
    );
    if (!seen.has(candidate.mutatedSource)) {
      seen.add(candidate.mutatedSource);
      mutants.push(candidate);
    }
  }

  ts.forEachChild(node, (child) => visit(sourceFile, sourceText, child, ranges, mutants, seen));
}

export function generateMutations(sourceText: string, filePath: string, ranges?: MutationRange[]): MutationCandidate[] {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const mutants: MutationCandidate[] = [];
  const seen = new Set<string>();
  visit(sourceFile, sourceText, sourceFile, ranges, mutants, seen);
  return mutants;
}

export function rangesFromLines(lines: Array<{ start: number; end: number }>): MutationRange[] {
  return lines.map((line) => ({ start: line.start, end: line.end }));
}

export function summarizeMutants(mutants: MutationCandidate[]): Record<string, number> {
  return mutants.reduce<Record<string, number>>((accumulator, mutant) => {
    accumulator[mutant.operator] = (accumulator[mutant.operator] ?? 0) + 1;
    return accumulator;
  }, {});
}

export function screenMutation(mutant: MutationCandidate): ScreenedMutation {
  const diagnostics = ts.transpileModule(mutant.mutatedSource, {
    compilerOptions: {
      module: ts.ModuleKind.NodeNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: `${mutant.operator}.ts`,
    reportDiagnostics: true,
  }).diagnostics ?? [];
  return {
    ...mutant,
    valid: diagnostics.length === 0,
    diagnostics,
  };
}

export function screenMutants(mutants: MutationCandidate[]): ScreenedMutation[] {
  return mutants.map(screenMutation);
}
