import { Command } from 'commander';
import { registerTransformCommand } from './transform';
import * as vaultIndex from '../../vault/index';
import * as transformModule from '../../env/transform';
import * as auditIndex from '../../audit/index';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerTransformCommand(program);
  return program;
}

const fakeVault = { APP_NAME: 'myapp', SECRET: 'abc123' };

beforeEach(() => {
  jest.spyOn(vaultIndex, 'loadVault').mockResolvedValue({ vault: { ...fakeVault }, vaultPath: '/fake/.envault' });
  jest.spyOn(vaultIndex, 'saveVault').mockResolvedValue(undefined);
  jest.spyOn(auditIndex, 'logAction').mockResolvedValue(undefined);
});

afterEach(() => jest.restoreAllMocks());

describe('transform command', () => {
  it('lists built-in transformers with --list flag', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await makeProgram().parseAsync(['node', 'envault', 'transform', 'uppercase', '--list']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('transformers'));
    spy.mockRestore();
  });

  it('transforms all keys and saves vault', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await makeProgram().parseAsync(['node', 'envault', 'transform', 'uppercase']);
    expect(vaultIndex.saveVault).toHaveBeenCalledWith(
      '/fake/.envault',
      expect.objectContaining({ APP_NAME: 'MYAPP', SECRET: 'ABC123' })
    );
    expect(auditIndex.logAction).toHaveBeenCalledWith('transform', expect.any(Object));
    spy.mockRestore();
  });

  it('transforms only specified keys', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await makeProgram().parseAsync(['node', 'envault', 'transform', 'uppercase', '--keys', 'APP_NAME']);
    const savedVault = (vaultIndex.saveVault as jest.Mock).mock.calls[0][1];
    expect(savedVault.APP_NAME).toBe('MYAPP');
    expect(savedVault.SECRET).toBe('abc123');
    spy.mockRestore();
  });

  it('does not save on --dry-run', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await makeProgram().parseAsync(['node', 'envault', 'transform', 'trim', '--dry-run']);
    expect(vaultIndex.saveVault).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('exits on unknown transformer', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      makeProgram().parseAsync(['node', 'envault', 'transform', 'nonexistent'])
    ).rejects.toThrow('exit');
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });
});
