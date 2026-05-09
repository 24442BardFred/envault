import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs';
import { registerSchemaCommand } from './schema';
import * as envIndex from '../../env/index';
import * as schemaModule from '../../env/schema';

vi.mock('fs');
vi.mock('../../env/index');
vi.mock('../../env/schema');

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerSchemaCommand(program);
  return program;
}

describe('schema validate command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('exits with error if schema file not found', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const program = makeProgram();
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['node', 'envault', 'schema', 'validate', '--schema', 'missing.json'])
    ).rejects.toThrow();
    exit.mockRestore();
  });

  it('reports validation pass', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ PORT: { type: 'number', required: true } }));
    vi.mocked(envIndex.readEnvFile).mockResolvedValue({ PORT: '3000' });
    vi.mocked(schemaModule.validateWithSchema).mockReturnValue([]);
    vi.mocked(schemaModule.formatSchemaReport).mockReturnValue('Schema validation passed.');

    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(['node', 'envault', 'schema', 'validate', '--schema', 'schema.json', '--env', '.env']);
    expect(log).toHaveBeenCalledWith('Schema validation passed.');
    log.mockRestore();
  });
});

describe('schema generate command', () => {
  it('writes a schema stub file', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(envIndex.readEnvFile).mockResolvedValue({ PORT: '3000', APP_NAME: 'test' });
    const writeFile = vi.mocked(fs.writeFileSync).mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    const program = makeProgram();
    await program.parseAsync(['node', 'envault', 'schema', 'generate', '--env', '.env', '--output', 'out.json']);

    expect(writeFile).toHaveBeenCalled();
    const written = JSON.parse(writeFile.mock.calls[0][1] as string);
    expect(written).toHaveProperty('PORT');
    expect(written).toHaveProperty('APP_NAME');
    log.mockRestore();
  });
});
