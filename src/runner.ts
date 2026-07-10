import { spawn } from 'node:child_process';
import type { Outcome, ProbeAttempt } from './domain.js';
import { millis } from './utils.js';

export interface CommandExecutionOptions {
  cwd: string;
  timeoutMs: number;
  env?: NodeJS.ProcessEnv;
}

function inferOutcome(exitCode: number | null, timedOut: boolean, spawnError: boolean): Outcome {
  if (timedOut || spawnError || exitCode === null) {
    return 'unknown';
  }
  return exitCode === 0 ? 'pass' : 'fail';
}

export async function runCommand(command: string[], options: CommandExecutionOptions): Promise<ProbeAttempt> {
  if (command.length === 0) {
    throw new Error('Probe command cannot be empty');
  }

  const [bin, ...args] = command;
  if (!bin) {
    throw new Error('Probe command cannot be empty');
  }
  const started = process.hrtime.bigint();
  return await new Promise<ProbeAttempt>((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let spawnError = false;
    const child = spawn(bin, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      shell: false,
      windowsHide: true,
    }) as ReturnType<typeof spawn>;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, options.timeoutMs);

    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr?.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.on('error', () => {
      spawnError = true;
    });
    child.on('close', (exitCode: number | null, signal: NodeJS.Signals | null) => {
      clearTimeout(timeout);
      const ended = process.hrtime.bigint();
      resolve({
        command,
        cwd: options.cwd,
        timeoutMs: options.timeoutMs,
        outcome: inferOutcome(exitCode, timedOut, spawnError),
        exitCode,
        signal,
        durationMs: millis(started, ended),
        stdout,
        stderr,
      });
    });
  });
}

export async function runStableProbe(command: string[], options: CommandExecutionOptions & { attempts?: number }): Promise<{
  outcome: Outcome;
  attempts: ProbeAttempt[];
}> {
  const count = Math.max(1, options.attempts ?? 2);
  const attempts: ProbeAttempt[] = [];
  for (let index = 0; index < count; index += 1) {
    attempts.push(await runCommand(command, options));
  }

  const first = attempts[0]!;
  const stable = attempts.every((attempt) => attempt.outcome === first.outcome);
  return {
    outcome: stable ? first.outcome : 'unknown',
    attempts,
  };
}
