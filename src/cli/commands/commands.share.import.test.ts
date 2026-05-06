import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { registerShareCommand } from './share';
import { registerImportCommand } from './import';
import * as shareModule from '../../share/index';
import * as vaultModule from '../../vault/index';

jest.mock('../../share/index');
jest.mock('../../vault/index');
jest.mock('readline', () => ({
  createInterface: () => ({
    question: (_q: string, cb: (a: string) => void) => cb('test-password'),
    close: jest.fn(),
  }),
}));

describe('share command', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    registerShareCommand(program);
    (vaultModule.loadVault as jest.Mock).mockResolvedValue({ KEY: 'value' });
    (shareModule.createShareBundle as jest.Mock).mockResolvedValue('bundle-content');
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  });

  afterEach(() => jest.clearAllMocks());

  it('should call createShareBundle with vault data', async () => {
    await program.parseAsync(['node', 'envault', 'share', '-o', '/tmp/test.bundle']);
    expect(shareModule.createShareBundle).toHaveBeenCalledWith({ KEY: 'value' }, 'test-password', undefined);
  });

  it('should write bundle to file', async () => {
    await program.parseAsync(['node', 'envault', 'share', '-o', '/tmp/test.bundle']);
    expect(fs.writeFileSync).toHaveBeenCalledWith(expect.stringContaining('test.bundle'), 'bundle-content', 'utf-8');
  });
});

describe('import command', () => {
  let program: Command;
  const bundlePath = path.resolve('/tmp/test.bundle');

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    registerImportCommand(program);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('bundle-content');
    (vaultModule.loadVault as jest.Mock).mockResolvedValue({ EXISTING: 'val' });
    (shareModule.importShareBundle as jest.Mock).mockResolvedValue({ EXISTING: 'val', NEW: 'imported' });
    (vaultModule.saveVault as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => jest.clearAllMocks());

  it('should call importShareBundle with bundle content', async () => {
    await program.parseAsync(['node', 'envault', 'import', bundlePath]);
    expect(shareModule.importShareBundle).toHaveBeenCalledWith('bundle-content', 'test-password', { EXISTING: 'val' }, false);
  });

  it('should save the merged vault', async () => {
    await program.parseAsync(['node', 'envault', 'import', bundlePath]);
    expect(vaultModule.saveVault).toHaveBeenCalledWith({ EXISTING: 'val', NEW: 'imported' }, 'test-password');
  });
});
