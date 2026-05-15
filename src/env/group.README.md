# env/group

Groups environment variables by a common prefix or delimiter.

## Usage

```ts
import { groupEnv, formatGroupReport } from './group';

const env = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  APP_NAME: 'envault',
  APP_ENV: 'production',
  SECRET_KEY: 'abc123',
};

const report = groupEnv(env, '_');
console.log(formatGroupReport(report));
```

## API

### `groupEnv(env, delimiter?)`

Groups keys by their prefix (the part before the first `delimiter`, default `_`).

Returns a `GroupReport` containing:
- `groups`: a `Record<string, Record<string, string>>` mapping prefix → key/value pairs
- `ungrouped`: keys that had no prefix or matched no group
- `delimiter`: the delimiter used

### `formatGroupReport(report)`

Returns a human-readable string representation of the group report.
