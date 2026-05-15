import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { registerGroupCommand } from './group';

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerGroupCommand(program);
  return program;
}

describe('group command', () => {
  let tmpDir: string;
  let envFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-group-'));
    envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, [
      'DB_HOST=localhost',
      'DB_PORT=5432',
      'APP_NAME=envault',
      'APP_ENV=production',
      'SECRET=topsecret',
    ].join('\n'), 'utf-8');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('prints formatted group report to stdout', async () => {
    const program = makeProgram();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'envault', 'group', '-f', envFile]);
    const output = spy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('DB');
    expect(output).toContain('APP');
    spy.mockRestore();
  });

  it('outputs JSON when --json flag is set', async () => {
    const program = makeProgram();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'envault', 'group', '-f', envFile, '--json']);
    const raw = spy.mock.calls[0][0];
    const parsed = JSON.parse(raw);
    expect(parsed).toHaveProperty('groups');
    expect(parsed).toHaveProperty('ungrouped');
    spy.mockRestore();
  });

  it('writes output file when --output is specified', async () => {
    const outFile = path.join(tmpDir, 'grouped.env');
    const program = makeProgram();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'envault', 'group', '-f', envFile, '-o', outFile]);
    expect(fs.existsSync(outFile)).toBe(true);
    const content = fs.readFileSync(outFile, 'utf-8');
    expect(content).toContain('DB_HOST');
    jest.restoreAllMocks();
  });

  it('exits with error when file does not exist', async () => {
    const program = makeProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      program.parseAsync(['node', 'envault', 'group', '-f', '/nonexistent/.env'])
    ).rejects.toThrow();
    exitSpy.mockRestore();
    jest.restoreAllMocks();
  });
});
