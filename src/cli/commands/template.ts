import * as fs from 'fs';
import * as path from 'path';
import type { Argv } from 'yargs';
import { parseTemplate, serialiseTemplate, generateTemplate, validateAgainstTemplate } from '../../template/template';
import { readEnvFile } from '../../env/index';

export function prompt(msg: string): string {
  return msg;
}

export function registerTemplateCommand(yargs: Argv): Argv {
  return yargs.command(
    'template <action>',
    'Manage .env.template files',
    (y) =>
      y
        .positional('action', {
          choices: ['generate', 'validate', 'view'] as const,
          describe: 'Action to perform',
        })
        .option('env', {
          type: 'string',
          default: '.env',
          describe: 'Path to the .env file',
        })
        .option('template', {
          type: 'string',
          default: '.env.template',
          describe: 'Path to the template file',
        }),
    async (argv) => {
      const action = argv.action as string;
      const envPath = path.resolve(argv.env as string);
      const tplPath = path.resolve(argv.template as string);

      if (action === 'generate') {
        let envMap: Record<string, string> = {};
        if (fs.existsSync(envPath)) {
          envMap = await readEnvFile(envPath);
        }
        const tpl = generateTemplate(envMap);
        const content = serialiseTemplate(tpl);
        fs.writeFileSync(tplPath, content, 'utf8');
        console.log(`Template written to ${tplPath}`);
        return;
      }

      if (action === 'validate') {
        if (!fs.existsSync(tplPath)) {
          console.error(`Template file not found: ${tplPath}`);
          process.exit(1);
        }
        const tplContent = fs.readFileSync(tplPath, 'utf8');
        const tpl = parseTemplate(tplContent);
        let envMap: Record<string, string> = {};
        if (fs.existsSync(envPath)) {
          envMap = await readEnvFile(envPath);
        }
        const missing = validateAgainstTemplate(envMap, tpl);
        if (missing.length === 0) {
          console.log('All required variables are present.');
        } else {
          console.error(`Missing required variables: ${missing.join(', ')}`);
          process.exit(1);
        }
        return;
      }

      if (action === 'view') {
        if (!fs.existsSync(tplPath)) {
          console.error(`Template file not found: ${tplPath}`);
          process.exit(1);
        }
        const tplContent = fs.readFileSync(tplPath, 'utf8');
        const tpl = parseTemplate(tplContent);
        tpl.variables.forEach((v) => {
          const req = v.required ? '(required)' : `(default: ${v.defaultValue})`;
          const desc = v.description ? ` — ${v.description}` : '';
          console.log(`  ${v.key} ${req}${desc}`);
        });
      }
    }
  );
}
