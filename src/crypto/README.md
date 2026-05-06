# `src/crypto` — Encryption Module

This module provides **AES-256-GCM** authenticated encryption for envault's
secure local storage and team-sharing features.

## API

### `encrypt(plaintext: string, password: string): EncryptedPayload`

Encrypts a UTF-8 string using a password-derived key.

- A random **salt** (32 bytes) is generated per call and used with PBKDF2
  (100 000 iterations, SHA-256) to derive a 256-bit key.
- A random **IV** (16 bytes) is generated per call.
- Returns an `EncryptedPayload` containing `iv`, `authTag`, `salt`, and
  `ciphertext` — all hex-encoded.

### `decrypt(payload: EncryptedPayload, password: string): string`

Decrypts an `EncryptedPayload` back to its original UTF-8 string.

Throws if the password is wrong or the payload has been tampered with
(GCM auth-tag verification).

### `serialisePayload(payload) / deserialisePayload(raw)`

Helpers to convert between `EncryptedPayload` objects and JSON strings for
persistence.

## Security notes

| Property | Value |
|---|---|
| Algorithm | AES-256-GCM |
| Key derivation | PBKDF2-SHA256, 100 000 iterations |
| IV | 16 bytes, random per encryption |
| Salt | 32 bytes, random per encryption |
| Auth tag | 16 bytes (GCM) |

> **Never** reuse a password without a unique salt. The module enforces this
> automatically by generating a fresh salt on every `encrypt` call.
