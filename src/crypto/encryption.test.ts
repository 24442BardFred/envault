import { encrypt, decrypt, deriveKey } from './encryption';
import crypto from 'crypto';

describe('encryption module', () => {
  const password = 'super-secret-password';
  const plaintext = 'DATABASE_URL=postgres://localhost:5432/mydb\nAPI_KEY=abc123';

  describe('deriveKey', () => {
    it('should return a 32-byte buffer', () => {
      const salt = crypto.randomBytes(32);
      const key = deriveKey(password, salt);
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it('should produce the same key for the same password and salt', () => {
      const salt = crypto.randomBytes(32);
      const key1 = deriveKey(password, salt);
      const key2 = deriveKey(password, salt);
      expect(key1.equals(key2)).toBe(true);
    });

    it('should produce different keys for different salts', () => {
      const key1 = deriveKey(password, crypto.randomBytes(32));
      const key2 = deriveKey(password, crypto.randomBytes(32));
      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe('encrypt', () => {
    it('should return an EncryptedPayload with required fields', () => {
      const payload = encrypt(plaintext, password);
      expect(payload).toHaveProperty('iv');
      expect(payload).toHaveProperty('authTag');
      expect(payload).toHaveProperty('salt');
      expect(payload).toHaveProperty('ciphertext');
    });

    it('should not expose the plaintext in the ciphertext', () => {
      const payload = encrypt(plaintext, password);
      expect(payload.ciphertext).not.toContain('DATABASE_URL');
    });

    it('should produce different ciphertexts on each call', () => {
      const p1 = encrypt(plaintext, password);
      const p2 = encrypt(plaintext, password);
      expect(p1.ciphertext).not.toBe(p2.ciphertext);
    });
  });

  describe('decrypt', () => {
    it('should correctly decrypt an encrypted payload', () => {
      const payload = encrypt(plaintext, password);
      const result = decrypt(payload, password);
      expect(result).toBe(plaintext);
    });

    it('should throw when decrypting with the wrong password', () => {
      const payload = encrypt(plaintext, password);
      expect(() => decrypt(payload, 'wrong-password')).toThrow();
    });

    it('should throw when the auth tag is tampered', () => {
      const payload = encrypt(plaintext, password);
      const tampered = { ...payload, authTag: 'ff'.repeat(16) };
      expect(() => decrypt(tampered, password)).toThrow();
    });
  });
});
