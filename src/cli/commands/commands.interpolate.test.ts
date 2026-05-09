import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerInterpolateCommand } from './interpolate';

vi.mock('../../env/index', () => ({
  readEnvFile: vi.fn(),
}));

vi.mock('../../env/interpolate', () => ({
  interpolateEnv: vi.fn(),
}));

vi.mock('../../env/parser', () => ({
  serialiseEnv: vi.fn((env: Record<string, string>) =>
    Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n')
  ),
}));

import { readEnvFile } from '../../env/index';
import { interpolateEnv } from '../../env/interpolate';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerInterpolateCommand(program);
  return program;
}

describe('interpolate command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves and prints env to stdout', async () => {
    vi.mocked(readEnvFile).mockResolvedValue({ BASE: 'http://localhost', URL: '${BASE}/api' });
    vi.mocked(interpolateEnv).mockReturnValue({
      resolved: { BASE: 'http://localhost', URL: 'http://localhost/api' },
      unresolved: [],
      circular: [],
    });

    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'interpolate', '.env']);
    expect(writeSpy).toHaveBeenCalled();
    writeSpy.mockRestore();
  });

  it('warns about unresolved references', async () => {
    vi.mocked(readEnvFile).mockResolvedValue({ URL: '${MISSING}/path' });
    vi.mocked(interpolateEnv).mockReturnValue({
      resolved: { URL: '${MISSING}/path' },
      unresolved: ['URL'],
      circular: [],
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'interpolate', '.env']);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unresolved'));
    warnSpy.mockRestore();
  });

  it('warns about circular references', async () => {
    vi.mocked(readEnvFile).mockResolvedValue({ A: '${B}', B: '${A}' });
    vi.mocked(interpolateEnv).mockReturnValue({
      resolved: { A: '${B}', B: '${A}' },
      unresolved: [],
      circular: ['A', 'B'],
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'interpolate', '.env']);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Circular'));
    warnSpy.mockRestore();
  });
});
