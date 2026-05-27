import { Exception } from '@adonisjs/core/exceptions'
import type { ZodError } from 'zod'
import type { HttpContext } from '@adonisjs/core/http'

export class ValidationException extends Exception {
  constructor(private readonly zodError: ZodError) {
    super('Validation failed', { status: 422, code: 'E_VALIDATION_ERROR' })
  }

  async handle(error: this, ctx: HttpContext) {
    return ctx.response.status(422).json({
      errors: error.zodError.errors.map((e) => ({
        field: e.path.join('.') || 'root',
        message: e.message,
        rule: e.code,
      })),
    })
  }
}
