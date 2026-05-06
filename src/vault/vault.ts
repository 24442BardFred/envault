import { encrypt, decrypt, deriveKey } from '../crypto/encryption';
import { serialisePayload, deserialisePayload } from '../crypto/index';
import * as fs from 'fs';
import * as path from 'path';

export interface VaultEntry {
  key: string;
  value: string;
  updatedAt: string;
}

export interface VaultData {
  entries: Record<string, VaultEntry>;
  version: number;
}

export class Vault {
  private filePath: string;
  private password: string;

  constructor(filePath: string, password: string) {
    this.filePath = path.resolve(filePath);
    this.password = password;
  }

  async load(): Promise<VaultData> {
    if (!fs.existsSync(this.filePath)) {
      return { entries: {}, version: 1 };
    }
    const raw = fs.readFileSync(this.filePath, 'utf-8');
    const payload = deserialisePayload(raw);
    const key = await deriveKey(this.password, payload.salt);
    const decrypted = await decrypt(payload, key);
    return JSON.parse(decrypted) as VaultData;
  }

  async save(data: VaultData): Promise<void> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(this.password, salt);
    const plaintext = JSON.stringify(data);
    const payload = await encrypt(plaintext, key, salt);
    const serialised = serialisePayload(payload);
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, serialised, 'utf-8');
  }

  async set(envKey: string, envValue: string): Promise<void> {
    const data = await this.load();
    data.entries[envKey] = {
      key: envKey,
      value: envValue,
      updatedAt: new Date().toISOString(),
    };
    await this.save(data);
  }

  async get(envKey: string): Promise<string | undefined> {
    const data = await this.load();
    return data.entries[envKey]?.value;
  }

  async remove(envKey: string): Promise<boolean> {
    const data = await this.load();
    if (!(envKey in data.entries)) return false;
    delete data.entries[envKey];
    await this.save(data);
    return true;
  }

  async list(): Promise<VaultEntry[]> {
    const data = await this.load();
    return Object.values(data.entries);
  }
}
