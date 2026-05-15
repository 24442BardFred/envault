import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { registerSortCommand } from './sort';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerSortCommand(program);
  return program;
}

describe('sort command', () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `envault-sort-test-${Date.now()}.env`);
    fs.writeFileSync(tmpFile, 'ZEBRA=1\nAPPLE=2\nMango=3\n', 'utf-8');
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it('sorts and writes file with --write flag', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'envault', 'sort', tmpFile, '--write']);
    const content = fs.readFileSync(tmpFile, 'utf-8');
    const keys = content.match(/^[A-Z_a-z]+(?==)/gm) ?? [];
    expect(keys[0]).toBe('APPLE');
  });

  it('does not write file without --write flag when user declines', async () => {
    const original = fs.readFileSync(tmpFile, 'utf-8');
    const { prompt } = await import('./sort');
    jest.spyOn(require('./sort'), 'prompt').mockResolvedValueOnce('n');
    const program = makeProgram();
    await program.parseAsync(['node', 'envault', 'sort', tmpFile]);
    const content = fs.readFileSync(tmpFile, 'utf-8');
    expect(content).toBe(original);
  });

  it('outputs dry-run without writing', async () => {
    const original = fs.readFileSync(tmpFile, 'utf-8');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(['node', 'envault', 'sort', tmpFile, '--dry-run']);
    const content = fs.readFileSync(tmpFile, 'utf-8');
    expect(content).toBe(original);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('dry run'));
    consoleSpy.mockRestore();
  });

  it('exits with error for missing file', async () => {
    const program = makeProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(program.parseAsync(['node', 'envault', 'sort', '/nonexistent.env', '--write']))
      .rejects.toThrow();
    exitSpy.mockRestore();
  });
});
