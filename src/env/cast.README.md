# env/cast

Type-casting utilities for raw `.env` string values.

## Overview

Environment variables are always strings. The `cast` module lets you define rules to coerce values into typed primitives: `number`, `boolean`, `json`, or keep them as `string`.

## API

### `castValue(value: string, type: CastType)`

Casts a single string value to the given type. Returns `{ casted, error? }`.

```ts
castValue('3000', 'number');   // { casted: 3000 }
castValue('true', 'boolean');  // { casted: true }
castValue('{"a":1}', 'json'); // { casted: { a: 1 } }
```

### `castEnv(env, rules)`

Applies an array of `CastRule` objects to an env record.

```ts
const { casted, report } = castEnv(env, [
  { key: 'PORT', type: 'number' },
  { key: 'DEBUG', type: 'boolean' },
]);
```

Returns:
- `casted` — env record with typed values replacing string originals (on success)
- `report` — full results including any errors

### `formatCastReport(report)`

Returns a human-readable summary of cast results.

## CLI

```bash
envault cast .env --rule PORT:number DEBUG:boolean CONFIG:json
envault cast .env --rule PORT:number --json
envault cast .env --rule NAME:number --report
```

## Boolean truthy values

`true`, `1`, `yes`, `on` → `true`  
`false`, `0`, `no`, `off` → `false`
