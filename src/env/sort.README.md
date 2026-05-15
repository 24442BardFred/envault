# env/sort

Sort environment variable keys in a `.env` file using configurable strategies.

## API

### `sortEnv(input, options?)`

Parses the given `.env` string and returns a sorted version.

**Options:**

| Option     | Type                          | Default   | Description                                |
|------------|-------------------------------|-----------|--------------------------------------------|
| `order`    | `'asc' \| 'desc'`             | `'asc'`   | Sort direction                             |
| `strategy` | `'alpha' \| 'length' \| 'natural'` | `'alpha'` | Comparison strategy                   |

**Returns:** `{ output: string, report: SortReport }`

### `formatSortReport(report)`

Formats a human-readable summary of the sort operation.

## Strategies

- **alpha** — Standard lexicographic comparison (`localeCompare`).
- **length** — Sort by key length (shorter keys first), with alpha as tiebreaker.
- **natural** — Numeric-aware sort (e.g. `KEY1 < KEY2 < KEY10`).

## CLI

```bash
envault sort .env --order asc --strategy natural --write
envault sort .env --dry-run
```

## Example

```ts
import { sortEnv, formatSortReport } from './sort';

const input = 'ZEBRA=1\nAPPLE=2\nMango=3';
const { output, report } = sortEnv(input, { order: 'asc', strategy: 'alpha' });
console.log(formatSortReport(report));
// Sort complete:
//   Before: ZEBRA, APPLE, Mango
//   After:  APPLE, Mango, ZEBRA
```
