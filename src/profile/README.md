# Profile Module

Manages named vault profiles, allowing teams to switch between different environments (e.g. `dev`, `staging`, `prod`) each backed by a separate encrypted vault file.

## API

### `createProfile(name: string): Profile`
Creates a new named profile and persists it to the profile store.

### `switchProfile(name: string): void`
Sets the given profile as active.

### `listProfiles(): Profile[]`
Returns all stored profiles.

### `deleteProfile(name: string): void`
Removes a profile by name (cannot delete the active profile).

### `getActiveProfile(): Profile`
Returns the currently active profile.

### `resolveVaultPath(profile?: string): string`
Returns the vault file path for the given profile name, or the active profile if omitted.

## Profile Store

Profiles are stored in `~/.envault/profiles.json`.

```json
{
  "active": "dev",
  "profiles": [
    { "name": "dev", "vaultPath": "~/.envault/vaults/dev.vault" },
    { "name": "prod", "vaultPath": "~/.envault/vaults/prod.vault" }
  ]
}
```

## Usage

```ts
import { createProfile, switchProfile, resolveVaultPath } from './profile';

createProfile('staging');
switchProfile('staging');
const vaultPath = resolveVaultPath(); // ~/.envault/vaults/staging.vault
```
