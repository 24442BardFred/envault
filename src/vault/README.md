# Vault Module

The `vault` module provides encrypted key-value storage for environment variables.
Each vault is a single encrypted file on disk, protected by a user-supplied password.

## Usage

```typescript
import { Vault } from './vault';

const vault = new Vault('/path/to/my.vault', 'my-strong-password');

// Store a secret
await vault.set('API_KEY', 's3cr3t');

// Retrieve a secret
const apiKey = await vault.get('API_KEY');

// List all stored keys
const entries = await vault.list();

// Remove a key
const removed = await vault.remove('API_KEY');
```

## Default Vault

Use `openDefaultVault` for a zero-config experience:

```typescript
import { openDefaultVault } from './index';

const vault = await openDefaultVault('my-password');
```

The default vault is stored at `~/.envault/default.vault`.
Override by setting the `ENVAULT_PATH` environment variable.

## Data Format

The vault file is an encrypted JSON blob containing:

| Field     | Description                          |
|-----------|--------------------------------------|
| `entries` | Map of key → `VaultEntry` objects    |
| `version` | Schema version (currently `1`)       |

Each `VaultEntry` stores the `key`, `value`, and an ISO `updatedAt` timestamp.

## Security

- Encryption is delegated to `src/crypto/encryption.ts` (AES-GCM).
- The password is never stored; only the derived key is used transiently.
- A fresh random salt is generated on every `save` call.
