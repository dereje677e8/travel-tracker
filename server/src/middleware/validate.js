import { AppError } from '../utils/AppError.js';

/**
 * Wraps a Zod schema as Express middleware. Validates req.body (default)
 * or another part of the request, and rejects with a 400 + field-level
 * errors before the request ever reaches business logic.
 */
export function validate(schema, part = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const fields = {};
      for (const issue of result.error.issues) {
        fields[issue.path.join('.') || '_'] = issue.message;
      }
      return next(AppError.validation('Validation failed', fields));
    }
    req[part] = result.data;
    next();
  };
}
