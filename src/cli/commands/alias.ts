import { Command } from "commander";
import * as readline from "readline";
import { loadVault, saveVault } from "../../vault/index";
import { aliasEnv, formatAliasReport, AliasMap } from "../../env/alias";
import { logAction } from "../../audit/index";

export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

export function registerAliasCommand(program: Command): void {
  program
    .command("alias <from> <to>")
    .description("Rename an environment variable key in the vault")
    .option("--keep-original", "Keep the original key alongside the new alias")
    .option("--password <password>", "Vault password (omit to be prompted)")
    .action(async (from: string, to: string, opts) => {
      try {
        const password =
          opts.password ?? (await prompt("Vault password: "));

        const { env, vault } = await loadVault(password);

        const aliases: AliasMap = { [from]: to };
        const removeOriginal = !opts.keepOriginal;
        const result = aliasEnv(env, aliases, removeOriginal);

        if (result.skipped.length > 0 && result.renamed.length === 0) {
          console.error(formatAliasReport(result));
          process.exit(1);
        }

        await saveVault(vault, result.output, password);
        await logAction("alias", { from, to, removeOriginal });

        console.log(formatAliasReport(result));
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  program
    .command("alias-batch")
    .description("Rename multiple keys from a JSON alias map via stdin or argument")
    .option("--map <json>", "JSON object mapping old keys to new keys")
    .option("--keep-original", "Keep original keys")
    .option("--password <password>", "Vault password")
    .action(async (opts) => {
      try {
        const password =
          opts.password ?? (await prompt("Vault password: "));

        const rawMap = opts.map ?? (await prompt("Alias map (JSON): "));
        const aliases: AliasMap = JSON.parse(rawMap);

        const { env, vault } = await loadVault(password);
        const removeOriginal = !opts.keepOriginal;
        const result = aliasEnv(env, aliases, removeOriginal);

        await saveVault(vault, result.output, password);
        await logAction("alias-batch", { aliases, removeOriginal });

        console.log(formatAliasReport(result));
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
