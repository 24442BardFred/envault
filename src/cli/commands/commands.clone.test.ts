import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { registerCloneCommand } from './clone';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerCloneCommand(program);
  return program;
}

function writeTmp(content: string): string {
  const file = path.join(os.tmpdir(), `clone-test-${Date.now()}.env`);
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('clone command', () => {
  let spy: jest.SpyInstance;

  beforeEach(() => {
    spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('clones keys with a prefix and writes output', async () => {
    const file = writeTmp('DB_HOST=localhost\nDB_PORT=5432\n');
    const out = file + '.out.env';
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'clone', file, '--prefix', 'STAGING_', '--output', out]);
    const written = fs.readFileSync(out, 'utf-8');
    expect(written).toContain('STAGING_DB_HOST=localhost');
    expect(written).toContain('STAGING_DB_PORT=5432');
    fs.unlinkSync(file);
    fs.unlinkSync(out);
  });

  it('performs a dry run without writing', async () => {
    const file = writeTmp('API_KEY=secret\n');
    const before = fs.readFileSync(file, 'utf-8');
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'clone', file, '--prefix', 'OLD_', '--dry-run']);
    const after = fs.readFileSync(file, 'utf-8');
    expect(after).toBe(before);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[dry-run]'));
    fs.unlinkSync(file);
  });

  it('exits with error when neither prefix nor suffix given', async () => {
    const file = writeTmp('FOO=bar\n');
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = makeProgram();
    await expect(program.parseAsync(['node', 'test', 'clone', file])).rejects.toThrow('exit');
    errSpy.mockRestore();
    exitSpy.mockRestore();
    fs.unlinkSync(file);
  });

  it('clones only specified keys', async () => {
    const file = writeTmp('DB_HOST=localhost\nAPI_KEY=secret\n');
    const out = file + '.out.env';
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'clone', file, '--prefix', 'COPY_', '--keys', 'DB_HOST', '--output', out]);
    const written = fs.readFileSync(out, 'utf-8');
    expect(written).toContain('COPY_DB_HOST=localhost');
    expect(written).not.toContain('COPY_API_KEY');
    fs.unlinkSync(file);
    fs.unlinkSync(out);
  });
});
