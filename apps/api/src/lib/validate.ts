import type { z } from 'zod';

/**
 * Parse `data` against a Zod schema, throwing an error the Fastify error
 * handler renders as `400 { error: { code: 'VALIDATION', message, details } }`.
 */
export function parsed<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues;
    const first = issues[0];
    const where = first?.path.length ? ` (${first.path.join('.')})` : '';
    throw Object.assign(new Error(`${first?.message ?? 'Invalid request'}${where}`), {
      statusCode: 400,
      code: 'VALIDATION',
      validation: issues,
    });
  }
  return result.data;
}
