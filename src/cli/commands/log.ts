import { Argv } from 'yargs';
import { getAuditLog, clearLog, defaultAuditLogPath } from '../../audit';

export function registerLogCommand(yargs: Argv): Argv {
  return yargs.command(
    'log',
    'View or clear the audit log',
    (y) =>
      y
        .option('clear', {
          alias: 'c',
          type: 'boolean',
          description: 'Clear the audit log',
          default: false,
        })
        .option('limit', {
          alias: 'n',
          type: 'number',
          description: 'Number of recent entries to show',
          default: 20,
        }),
    (argv) => {
      const logPath = defaultAuditLogPath;

      if (argv.clear) {
        clearLog(logPath);
        console.log('Audit log cleared.');
        return;
      }

      const entries = getAuditLog(logPath);
      if (entries.length === 0) {
        console.log('No audit log entries found.');
        return;
      }

      const limited = entries.slice(-argv.limit);
      console.log(`Showing last ${limited.length} audit entries:\n`);
      for (const entry of limited) {
        const key = entry.key ? ` [${entry.key}]` : '';
        const detail = entry.detail ? ` — ${entry.detail}` : '';
        console.log(`${entry.timestamp}  ${entry.action.toUpperCase()}${key}${detail}`);
      }
    }
  );
}
