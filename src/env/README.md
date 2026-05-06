# env module

Utilities for **parsing**, **serialising**, and **managing** `.env` files on disk.

## API

### `parseEnv(content: string): EnvRecord`

Parses a `.env` file string into a plain key-value object.

- Ignores blank lines and comment lines (starting with `#`).
- Strips surrounding single or double quotes from values.
- Handles values that contain `=` characters.

```ts
import { parseEnv } from './src/env';

const record = parseEnv('FOO=bar\nBAZ="hello world"');
// { FOO: 'bar', BAZ: 'hello world' }
```

### `serialiseEnv(record: EnvRecord): string`

Converts a key-value record back into `.env` file format.
Values containing spaces or special characters are automatically double-quoted.

```ts
import { serialiseEnv } from './src/env';

const content = serialiseEnv({ FOO: 'bar', BAZ: 'hello world' });
// FOO=bar
// BAZ="hello world"
```

### `readEnvFile(filePath: string): EnvRecord`

Reads and parses a `.env` file from disk. Returns `{}` if the file does not exist.

### `writeEnvFile(filePath: string, record: EnvRecord): void`

Writes a record to a `.env` file, creating parent directories as needed.

### `mergeEnvFile(filePath: string, additions: EnvRecord): void`

Merges new variables into an existing `.env` file. Existing keys are overwritten.

## Types

```ts
interface EnvRecord {
  [key: string]: string;
}
```
