export interface ApiFieldError {
  field: string
  message: string
  rule: string
}

export class ApiValidationError extends Error {
  constructor(public readonly fieldErrors: ApiFieldError[]) {
    super(fieldErrors[0]?.message ?? 'Validation failed')
    this.name = 'ApiValidationError'
  }
}

export function getFieldError(error: unknown, field: string): string | undefined {
  if (error instanceof ApiValidationError) {
    return error.fieldErrors.find((e) => e.field === field)?.message
  }
  return undefined
}
