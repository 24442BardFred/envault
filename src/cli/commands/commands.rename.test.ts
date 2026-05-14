import { Command } from 'commander';
import { registerRenameCommand } from './rename';
import * as vaultModule from '../../vault';
import * as renameModule from '../../env/rename';
import * as auditModule from '../../audit';
import * as profileModule from '../../profile';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerRenameCommand(program);
  return program;
}

describe('rename command', () => {
  let loadVault: jest.SpyInstance;
  let saveVault: jest.SpyInstance;
  let renameEnv: jest.SpyInstance;
  let logAction: jest.SpyInstance;
  let resolveVaultPath: jest.SpyInstance;
  let promptSpy: jest.SpyInstance;

  beforeEach(() => {
    loadVault = jest.spyOn(vaultModule, 'loadVault').mockResolvedValue({ DB_HOST: 'localhost', DB_PORT: '5432' });
    saveVault = jest.spyOn(vaultModule, 'saveVault').mockResolvedValue(undefined);
    renameEnv = jest.spyOn(renameModule, 'renameEnv').mockReturnValue({
      env: { DATABASE_HOST: 'localhost', DB_PORT: '5432' },
      result: { renamed: [{ from: 'DB_HOST', to: 'DATABASE_HOST' }], skipped: [], conflicts: [] },
    });
    logAction = jest.spyOn(auditModule, 'logAction').mockResolvedValue(undefined);
    resolveVaultPath = jest.spyOn(profileModule, 'resolveVaultPath').mockReturnValue('/mock/.envault');
    promptSpy = jest.spyOn(require('./rename'), 'prompt').mockResolvedValue('secret');
  });

  afterEach(() => jest.restoreAllMocks());

  it('registers the rename command', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'rename');
    expect(cmd).toBeDefined();
  });

  it('calls loadVault, renameEnv, saveVault and logAction', async () => {
    promptSpy.mockResolvedValue('secret');
    const program = makeProgram();
    await program.parseAsync(['rename', 'DB_HOST', 'DATABASE_HOST', '--yes'], { from: 'user' });
    expect(loadVault).toHaveBeenCalledWith('/mock/.envault', 'secret');
    expect(renameEnv).toHaveBeenCalled();
    expect(saveVault).toHaveBeenCalled();
    expect(logAction).toHaveBeenCalledWith('rename', expect.any(Object));
  });

  it('supports --bulk option', async () => {
    promptSpy.mockResolvedValue('secret');
    const program = makeProgram();
    await program.parseAsync(['rename', '_', '_', '--bulk', 'DB_HOST:DATABASE_HOST,DB_PORT:DATABASE_PORT', '--yes'], { from: 'user' });
    const callArgs = renameEnv.mock.calls[0][1] as { from: string; to: string }[];
    expect(callArgs).toEqual([
      { from: 'DB_HOST', to: 'DATABASE_HOST' },
      { from: 'DB_PORT', to: 'DATABASE_PORT' },
    ]);
  });

  it('aborts when confirmation is declined', async () => {
    promptSpy
      .mockResolvedValueOnce('secret')   // password
      .mockResolvedValueOnce('n');        // confirmation
    const program = makeProgram();
    await program.parseAsync(['rename', 'DB_HOST', 'DATABASE_HOST'], { from: 'user' });
    expect(saveVault).not.toHaveBeenCalled();
  });
});
