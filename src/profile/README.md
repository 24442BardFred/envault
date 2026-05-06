# Profile Module

The **profile** module allows users to manage multiple named envault profiles, each pointing to a different vault file. This is useful for switching between different projects or environments (e.g. `dev`, `staging`, `prod`).

## Storage

Profiles are stored in `~/.envault/profiles.json` as a JSON file containing:

- `active` — the name of the currently active profile (or `null`)
- `profiles` — a map of profile name → profile metadata

## API

### `createProfile(name, vaultPath): EnvaultProfile`

Creates a new named profile pointing to the given vault file path. If this is the first profile, it is automatically set as active.

### `switchProfile(name): void`

Sets the named profile as the active profile and updates its `lastUsed` timestamp.

### `deleteProfile(name): void`

Removes a profile. If the deleted profile was active, the next available profile is promoted, or `active` is set to `null`.

### `getActiveProfile(): EnvaultProfile | null`

Returns the currently active profile, or `null` if none is set.

### `listProfiles(): EnvaultProfile[]`

Returns all registered profiles.

### `resolveVaultPath(): string` (from `index.ts`)

Convenience helper that returns the vault path of the active profile, or falls back to `defaultVaultPath` if no profile is active.

## CLI Usage

```bash
# Create a new profile
envault profile create --name dev --vault ~/.envault/dev.vault

# Switch active profile
envault profile switch --name prod

# List all profiles (* marks active)
envault profile list

# Show active profile
envault profile active

# Delete a profile
envault profile delete --name staging
```
