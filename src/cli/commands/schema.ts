import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { readEnvFile } from '../../env/index';
import { validateWithSchema, formatSchemaReport, EnvSchema } from '../../env/schema';
import { resolveVaultPath } from '../../profile/index';

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

export function registerSchemaCommand(program: Command): void {
  const schema = program.command('schema').description('Validate .env files against a JSON schema');

  schema
    .command('validate')
    .description('Validate an env file against a schema file')
    .option('-e, --env <path>', '.env file to validate', '.env')
    .option('-s, --schema <path>', 'JSON schema file path')
    .action(async (opts) => {
      const schemaPath = opts.schema || (await prompt('Schema file path: '));

      if (!fs.existsSync(schemaPath)) {
        console.error(`Schema file not found: ${schemaPath}`);
        process.exit(1);
      }

      let schemaDef: EnvSchema;
      try {
        schemaDef = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
      } catch {
        console.error('Failed to parse schema file. Ensure it is valid JSON.');
        process.exit(1);
      }

      const envPath = path.resolve(opts.env);
      if (!fs.existsSync(envPath)) {
        console.error(`Env file not found: ${envPath}`);
        process.exit(1);
      }

      const env = await readEnvFile(envPath);
      const violations = validateWithSchema(env, schemaDef);
      console.log(formatSchemaReport(violations));

      if (violations.length > 0) process.exit(1);
    });

  schema
    .command('generate')
    .description('Generate a schema stub from an existing .env file')
    .option('-e, --env <path>', '.env file to read', '.env')
    .option('-o, --output <path>', 'Output schema file path')
    .action(async (opts) => {
      const envPath = path.resolve(opts.env);
      if (!fs.existsSync(envPath)) {
        console.error(`Env file not found: ${envPath}`);
        process.exit(1);
      }

      const env = await readEnvFile(envPath);
      const stub: EnvSchema = {};
      for (const key of Object.keys(env)) {
        stub[key] = { type: 'string', required: true, description: '' };
      }

      const outPath = opts.output || `${envPath}.schema.json`;
      fs.writeFileSync(outPath, JSON.stringify(stub, null, 2), 'utf-8');
      console.log(`Schema stub written to ${outPath}`);
    });
}
