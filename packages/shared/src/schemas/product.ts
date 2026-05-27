import { z } from 'zod'

export const productStatus = z.enum(['active', 'inactive', 'archived'])

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  categoryId: z.number().int().positive(),
  description: z.string().nullable().optional(),
  price: z.number().positive(),
  unit: z.string().min(1).max(50),
  quantity: z.number().min(0),
  status: productStatus.optional(),
})

export const updateProductSchema = createProductSchema.partial()

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ProductStatus = z.infer<typeof productStatus>
