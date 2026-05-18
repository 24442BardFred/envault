# env/clone

The `clone` module lets you duplicate existing env keys under new names by applying a **prefix**, a **suffix**, or both. This is useful when promoting environment variables between stages (e.g. `DB_HOST` → `STAGING_DB_HOST`) or creating backup copies before destructive operations.

## API

### `cloneEnv(env, options)`

Clones keys in `env` according to the provided options.

```ts
import { cloneEnv } from './clone';

const { result, report } = cloneEnv(
  { DB_HOST: 'localhost', API_KEY: 'secret' },
  { prefix: 'STAGING_', keys: ['DB_HOST'] }
);
// result => { DB_HOST: 'localhost', API_KEY: 'secret', STAGING_DB_HOST: 'localhost' }
```

#### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `prefix` | `string` | `''` | String prepended to each cloned key |
| `suffix` | `string` | `''` | String appended to each cloned key |
| `keys` | `string[]` | all keys | Subset of keys to clone |
| `overwrite` | `boolean` | `false` | Allow overwriting existing destination keys |

### `formatCloneReport(report)`

Returns a human-readable summary of cloned and skipped keys.

## CLI

```bash
envault clone .env --prefix STAGING_ --output .env.staging
envault clone .env --prefix OLD_ --keys DB_HOST,DB_PORT --overwrite
envault clone .env --suffix _BACKUP --dry-run
```

## Behaviour

- Original keys are always preserved in the output.
- Keys whose source and destination names are identical (no prefix/suffix) are skipped.
- Without `--overwrite`, existing destination keys are skipped with a reason in the report.
