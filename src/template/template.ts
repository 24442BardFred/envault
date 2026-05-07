import * as fs from 'fs';
import * as path from 'path';

export interface TemplateVariable {
  key: string;
  description?: string;
  required: boolean;
  defaultValue?: string;
}

export interface EnvTemplate {
  name: string;
  version: string;
  variables: TemplateVariable[];
}

/**
 * Parse a .env.template file into a structured EnvTemplate object.
 * Lines starting with # are treated as descriptions for the next variable.
 */
export function parseTemplate(content: string): EnvTemplate {
  const lines = content.split('\n');
  const variables: TemplateVariable[] = [];
  let pendingDescription: string | undefined;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      pendingDescription = undefined;
      continue;
    }
    if (line.startsWith('#')) {
      pendingDescription = line.slice(1).trim();
      continue;
    }
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    const rawValue = line.slice(eqIndex + 1).trim();
    const defaultValue = rawValue.length > 0 ? rawValue : undefined;
    const required = rawValue === '';

    variables.push({ key, description: pendingDescription, required, defaultValue });
    pendingDescription = undefined;
  }

  return { name: '', version: '1.0.0', variables };
}

/**
 * Serialise an EnvTemplate back to a .env.template string.
 */
export function serialiseTemplate(template: EnvTemplate): string {
  return template.variables
    .map((v) => {
      const comment = v.description ? `# ${v.description}\n` : '';
      const value = v.defaultValue ?? '';
      return `${comment}${v.key}=${value}`;
    })
    .join('\n\n');
}

/**
 * Generate a template from an existing set of env key-value pairs.
 * All values are stripped; keys are preserved as required variables.
 */
export function generateTemplate(envMap: Record<string, string>): EnvTemplate {
  const variables: TemplateVariable[] = Object.keys(envMap).map((key) => ({
    key,
    required: true,
  }));
  return { name: '', version: '1.0.0', variables };
}

/**
 * Validate an env map against a template, returning missing required keys.
 */
export function validateAgainstTemplate(
  envMap: Record<string, string>,
  template: EnvTemplate
): string[] {
  return template.variables
    .filter((v) => v.required && !(v.key in envMap))
    .map((v) => v.key);
}
