# Audit Module

The `audit` module provides a lightweight append-only audit log for tracking
actions performed against the vault. Each entry records a timestamp, the action
type, an optional key name, and an optional detail string.

## Location

The default log file is stored alongside the vault:

```
~/.envault/audit.log
```

## Entry format

Each line in the log file is a JSON object:

```json
{"timestamp":"2024-01-15T10:23:45.123Z","action":"set","key":"API_KEY"}
```

## API

### `logAction(action, key?, detail?, logPath?)`

Appends a new entry to the audit log.

```ts
import { logAction } from './audit';
logAction('set', 'DATABASE_URL', 'updated');
```

### `getAuditLog(logPath?)`

Returns all entries from the audit log as an array of `AuditEntry` objects.

```ts
const entries = getAuditLog();
```

### `clearLog(logPath?)`

Clears all entries from the audit log.

```ts
clearLog();
```

## CLI

Use the `log` command to inspect or clear the audit log:

```sh
envault log           # show last 20 entries
envault log -n 50     # show last 50 entries
envault log --clear   # clear the log
```
