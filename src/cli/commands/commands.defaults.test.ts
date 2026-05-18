import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { registerDefaultsCommand } from './defaults';

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerDefaultsCommand(program);
  return program;
}

describe('defaults command', () => {
  let tmpDir: string;
  let envFile: string;
  let defaultsFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-defaults-'));
    envFile = path.join(tmpDir, '.env');
    defaultsFile = path.join(tmpDir, '.env.defaults');
    fs.writeFileSync(envFile, 'FOO=existing\nBAR=\n');
    fs.writeFileSync(defaultsFile, 'FOO=default_foo\nBAR=default_bar\nBAZ=default_baz\n');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('applies defaults and writes to the env file', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'envault', 'defaults', envFile, '-d', defaultsFile]);
    const written = fs.readFileSync(envFile, 'utf-8');
    expect(written).toContain('BAZ=default_baz');
    expect(written).toContain('FOO=existing');
  });

  it('writes to output file when --output is provided', async () => {
    const outFile = path.join(tmpDir, '.env.out');
    const program = makeProgram();
    await program.parseAsync(['node', 'envault', 'defaults', envFile, '-d', defaultsFile, '-o', outFile]);
    expect(fs.existsSync(outFile)).toBe(true);
    const written = fs.readFileSync(outFile, 'utf-8');
    expect(written).toContain('BAZ=default_baz');
  });

  it('does not write in dry-run mode', async () => {
    const program = makeProgram();
    const before = fs.readFileSync(envFile, 'utf-8');
    await program.parseAsync(['node', 'envault', 'defaults', envFile, '-d', defaultsFile, '--dry-run']);
    const after = fs.readFileSync(envFile, 'utf-8');
    expect(after).toBe(before);
  });

  it('does not overwrite empty values when --no-overwrite-empty is set', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'envault', 'defaults', envFile, '-d', defaultsFile, '--no-overwrite-empty']);
    const written = fs.readFileSync(envFile, 'utf-8');
    expect(written).toMatch(/BAR=($|\s)/);
  });
});
