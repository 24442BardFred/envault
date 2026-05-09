import { z } from 'zod';

export type FieldType = 'string' | 'number' | 'boolean' | 'url' | 'email';

export interface SchemaField {
  type: FieldType;
  required?: boolean;
  description?: string;
  pattern?: string;
}

export type EnvSchema = Record<string, SchemaField>;

const fieldValidators: Record<FieldType, (value: string) => boolean> = {
  string: () => true,
  number: (v) => !isNaN(Number(v)),
  boolean: (v) => v === 'true' || v === 'false' || v === '1' || v === '0',
  url: (v) => { try { new URL(v); return true; } catch { return false; } },
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
};

export interface SchemaViolation {
  key: string;
  reason: string;
}

export function validateWithSchema(
  env: Record<string, string>,
  schema: EnvSchema
): SchemaViolation[] {
  const violations: SchemaViolation[] = [];

  for (const [key, field] of Object.entries(schema)) {
    const value = env[key];

    if (value === undefined || value === '') {
      if (field.required !== false) {
        violations.push({ key, reason: `Required field "${key}" is missing` });
      }
      continue;
    }

    if (!fieldValidators[field.type](value)) {
      violations.push({ key, reason: `Field "${key}" must be of type ${field.type}` });
      continue;
    }

    if (field.pattern) {
      const regex = new RegExp(field.pattern);
      if (!regex.test(value)) {
        violations.push({ key, reason: `Field "${key}" does not match pattern ${field.pattern}` });
      }
    }
  }

  return violations;
}

export function formatSchemaReport(violations: SchemaViolation[]): string {
  if (violations.length === 0) return 'Schema validation passed.';
  const lines = violations.map((v) => `  ✗ ${v.reason}`);
  return `Schema validation failed:\n${lines.join('\n')}`;
}
