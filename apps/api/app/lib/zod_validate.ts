import type { ZodSchema } from 'zod'
import { ValidationException } from '#exceptions/validation_exception'

export function zodValidate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ValidationException(result.error)
  }
  return result.data
}
