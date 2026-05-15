import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { registerCastCommand } from './cast';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerCastCommand(program);
  return program;
}

describe('cast command', () => {
  let tmpDir: string;
  let envFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-cast-'));
    envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'PORT=3000\nDEBUG=true\nNAME=envault\nCONFIG={"x":1}\n');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('casts values using --rule flags and outputs report', async () => {
    const program = makeProgram();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'envault', 'cast', envFile, '--rule', 'PORT:number', 'DEBUG:boolean', '--report']);
    const output = spy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('PORT');
    expect(output).toContain('DEBUG');
    spy.mockRestore();
  });

  it('outputs JSON when --json flag is set', async () => {
    const program = makeProgram();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'envault', 'cast', envFile, '--rule', 'PORT:number', '--json']);
    const output = spy.mock.calls.map(c => c[0]).join('\n');
    const parsed = JSON.parse(output);
    expect(parsed.PORT).toBe(3000);
    spy.mockRestore();
  });

  it('warns on cast error but does not crash', async () => {
    const program = makeProgram();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'envault', 'cast', envFile, '--rule', 'NAME:number', '--report']);
    const warns = warnSpy.mock.calls.map(c => c[0]).join('\n');
    expect(warns).toContain('Cast warnings');
    warnSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('exits with error for missing file', async () => {
    const program = makeProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      program.parseAsync(['node', 'envault', 'cast', '/nonexistent/.env', '--rule', 'PORT:number'])
    ).rejects.toThrow();
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });
});
