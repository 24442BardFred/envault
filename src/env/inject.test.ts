import { injectEnvIntoProcess, ejectEnvFromProcess, withInjectedEnv } from './inject';
import * as indexModule from './index';
import * as profileModule from '../profile/index';

jest.mock('./index');
jest.mock('../profile/index');

const mockReadEnvFile = indexModule.readEnvFile as jest.MockedFunction<typeof indexModule.readEnvFile>;
const mockResolveVaultPath = profileModule.resolveVaultPath as jest.MockedFunction<typeof profileModule.resolveVaultPath>;

beforeEach(() => {
  jest.clearAllMocks();
  mockResolveVaultPath.mockReturnValue('/mock/vault.enc');
  mockReadEnvFile.mockResolvedValue({ API_KEY: 'abc123', DB_URL: 'postgres://localhost' });
  delete process.env['API_KEY'];
  delete process.env['DB_URL'];
  delete process.env['TEST_API_KEY'];
  delete process.env['TEST_DB_URL'];
});

describe('injectEnvIntoProcess', () => {
  it('injects keys into process.env', async () => {
    const keys = await injectEnvIntoProcess('secret');
    expect(process.env['API_KEY']).toBe('abc123');
    expect(process.env['DB_URL']).toBe('postgres://localhost');
    expect(keys).toEqual(['API_KEY', 'DB_URL']);
  });

  it('does not overwrite existing keys by default', async () => {
    process.env['API_KEY'] = 'existing';
    const keys = await injectEnvIntoProcess('secret');
    expect(process.env['API_KEY']).toBe('existing');
    expect(keys).not.toContain('API_KEY');
  });

  it('overwrites existing keys when overwrite is true', async () => {
    process.env['API_KEY'] = 'existing';
    const keys = await injectEnvIntoProcess('secret', { overwrite: true });
    expect(process.env['API_KEY']).toBe('abc123');
    expect(keys).toContain('API_KEY');
  });

  it('applies prefix to injected keys', async () => {
    const keys = await injectEnvIntoProcess('secret', { prefix: 'TEST_' });
    expect(process.env['TEST_API_KEY']).toBe('abc123');
    expect(process.env['TEST_DB_URL']).toBe('postgres://localhost');
    expect(keys).toEqual(['TEST_API_KEY', 'TEST_DB_URL']);
  });
});

describe('ejectEnvFromProcess', () => {
  it('removes specified keys from process.env', () => {
    process.env['API_KEY'] = 'abc123';
    ejectEnvFromProcess(['API_KEY']);
    expect(process.env['API_KEY']).toBeUndefined();
  });
});

describe('withInjectedEnv', () => {
  it('injects env, runs callback, then cleans up', async () => {
    let capturedKey: string | undefined;
    await withInjectedEnv('secret', async () => {
      capturedKey = process.env['API_KEY'];
    });
    expect(capturedKey).toBe('abc123');
    expect(process.env['API_KEY']).toBeUndefined();
  });

  it('cleans up even if callback throws', async () => {
    await expect(
      withInjectedEnv('secret', async () => { throw new Error('boom'); })
    ).rejects.toThrow('boom');
    expect(process.env['API_KEY']).toBeUndefined();
  });
});
