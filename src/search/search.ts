import { readVault } from '../vault/vault';
import { defaultVaultPath } from '../vault/index';
import { resolveVaultPath } from '../profile/index';

export interface SearchResult {
  key: string;
  value: string;
  matchedOn: 'key' | 'value' | 'both';
}

export interface SearchOptions {
  caseSensitive?: boolean;
  searchValues?: boolean;
  exactMatch?: boolean;
}

export function searchEnv(
  entries: Record<string, string>,
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const { caseSensitive = false, searchValues = false, exactMatch = false } = options;

  const normalise = (s: string) => (caseSensitive ? s : s.toLowerCase());
  const normQuery = normalise(query);

  const results: SearchResult[] = [];

  for (const [key, value] of Object.entries(entries)) {
    const normKey = normalise(key);
    const normValue = normalise(value);

    const keyMatch = exactMatch ? normKey === normQuery : normKey.includes(normQuery);
    const valueMatch =
      searchValues && (exactMatch ? normValue === normQuery : normValue.includes(normQuery));

    if (keyMatch || valueMatch) {
      results.push({
        key,
        value,
        matchedOn: keyMatch && valueMatch ? 'both' : keyMatch ? 'key' : 'value',
      });
    }
  }

  return results;
}

export async function searchVault(
  query: string,
  password: string,
  options: SearchOptions = {},
  vaultPath?: string
): Promise<SearchResult[]> {
  const resolvedPath = vaultPath ?? resolveVaultPath(defaultVaultPath);
  const entries = await readVault(resolvedPath, password);
  return searchEnv(entries, query, options);
}
