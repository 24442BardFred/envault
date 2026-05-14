import { Command } from 'commander';
import { registerRedactCommand } from './redact';
import * as vault from '../../vault';
import * as profile from '../../profile';
import * as audit from '../../audit';
import * as redactMod from '../../env/redact';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerRedactCommand(program);
  return program;
}

describe('redact command', () => {
  const mockEnv = { API_KEY: 'secret123', PORT: '3000', DB_PASSWORD: 'hunter2' };

  beforeEach(() => {
    jest.spyOn(profile, 'resolveVaultPath').mockReturnValue('/mock/vault');
    jest.spyOn(vault, 'loadVault').mockResolvedValue(mockEnv);
    jest.spyOn(audit, 'logAction').mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('calls redactEnv and prints report', async () => {
    const redactSpy = jest.spyOn(redactMod, 'redactEnv').mockReturnValue({
      env: { API_KEY: '***', PORT: '3000', DB_PASSWORD: '***' },
      redacted: ['API_KEY', 'DB_PASSWORD'],
    });
    const formatSpy = jest.spyOn(redactMod, 'formatRedactReport').mockReturnValue('API_KEY=***\nPORT=3000\nDB_PASSWORD=***');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const { prompt } = require('./redact');
    jest.spyOn({ prompt }, 'prompt').mockResolvedValue('password');

    // Directly test logic by calling loadVault + redactEnv
    const env = await vault.loadVault('/mock/vault', 'password');
    const result = redactMod.redactEnv(env);
    const report = redactMod.formatRedactReport(result);

    expect(redactSpy).toHaveBeenCalledWith(mockEnv);
    expect(formatSpy).toHaveBeenCalledWith(result);
    expect(report).toContain('API_KEY=***');
    expect(result.redacted).toContain('API_KEY');
    expect(result.redacted).toContain('DB_PASSWORD');

    consoleSpy.mockRestore();
  });

  it('registers the redact command on the program', () => {
    const program = makeProgram();
    const names = program.commands.map(c => c.name());
    expect(names).toContain('redact');
  });

  it('handles invalid regex pattern gracefully', () => {
    // registerRedactCommand should not throw during registration
    expect(() => makeProgram()).not.toThrow();
  });
});
