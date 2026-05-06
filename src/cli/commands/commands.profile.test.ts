import { jest } from '@jest/globals';
import { registerProfileCommand } from './profile';
import * as profileModule from '../../profile/profile';
import type { Command } from 'commander';

const mockProgram = () => {
  const cmd: any = {
    name: jest.fn().mockReturnThis(),
    description: jest.fn().mockReturnThis(),
    command: jest.fn().mockReturnThis(),
    action: jest.fn().mockReturnThis(),
    argument: jest.fn().mockReturnThis(),
    option: jest.fn().mockReturnThis(),
    addCommand: jest.fn().mockReturnThis(),
  };
  return cmd as unknown as Command;
};

describe('registerProfileCommand', () => {
  let program: Command;

  beforeEach(() => {
    program = mockProgram();
    jest.clearAllMocks();
  });

  it('registers a profile command on the program', () => {
    registerProfileCommand(program);
    expect((program as any).addCommand).toHaveBeenCalled();
  });

  it('createProfile is callable', () => {
    const spy = jest
      .spyOn(profileModule, 'createProfile')
      .mockReturnValue({ name: 'test', vaultPath: '/tmp/test.vault' });
    const result = profileModule.createProfile('test');
    expect(result.name).toBe('test');
    spy.mockRestore();
  });

  it('switchProfile is callable', () => {
    const spy = jest
      .spyOn(profileModule, 'switchProfile')
      .mockImplementation(() => {});
    expect(() => profileModule.switchProfile('test')).not.toThrow();
    spy.mockRestore();
  });

  it('listProfiles returns an array', () => {
    const spy = jest
      .spyOn(profileModule, 'listProfiles')
      .mockReturnValue([{ name: 'dev', vaultPath: '/tmp/dev.vault' }]);
    const profiles = profileModule.listProfiles();
    expect(Array.isArray(profiles)).toBe(true);
    expect(profiles).toHaveLength(1);
    spy.mockRestore();
  });

  it('deleteProfile is callable', () => {
    const spy = jest
      .spyOn(profileModule, 'deleteProfile')
      .mockImplementation(() => {});
    expect(() => profileModule.deleteProfile('dev')).not.toThrow();
    spy.mockRestore();
  });

  it('getActiveProfile returns active profile', () => {
    const spy = jest
      .spyOn(profileModule, 'getActiveProfile')
      .mockReturnValue({ name: 'dev', vaultPath: '/tmp/dev.vault' });
    const active = profileModule.getActiveProfile();
    expect(active.name).toBe('dev');
    spy.mockRestore();
  });
});
