# env/transform

Provides utilities to apply named transformations to env variable values stored in the vault.

## Built-in Transformers

| Name           | Description                                |
|----------------|--------------------------------------------|
| `uppercase`    | Convert value to uppercase                 |
| `lowercase`    | Convert value to lowercase                 |
| `trim`         | Strip leading/trailing whitespace          |
| `base64encode` | Encode value as Base64                     |
| `base64decode` | Decode a Base64-encoded value              |
| `urlencode`    | URL-encode the value                       |
| `urldecode`    | URL-decode the value                       |

## API

### `transformEnv(env, transformerName, keys?, custom?)`

Applies a named or custom transformer to all or specific keys of an env map.

- `env` — source key-value map
- `transformerName` — name of a built-in transformer (or `'custom'` when supplying `custom`)
- `keys` — optional array of keys to target; defaults to all keys
- `custom` — optional `(value: string) => string` function

Returns a `TransformResult` with `transformed`, `skipped`, and `errors`.

### `formatTransformReport(result)`

Formats a `TransformResult` into a human-readable summary string.

### `getBuiltinTransformers()`

Returns the list of available built-in transformer names.

## CLI

```bash
# Apply uppercase to all keys
envault transform uppercase

# Apply base64encode only to specific keys
envault transform base64encode --keys SECRET_KEY,API_TOKEN

# Preview changes without saving
envault transform trim --dry-run

# List available transformers
envault transform uppercase --list
```
