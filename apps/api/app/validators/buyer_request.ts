import { z } from 'zod'

export const createBuyerRequestSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().max(2000).optional(),
  categoryId: z.number().int().positive({ message: 'Необхідно вибрати категорію' }),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(50),
  location: z.string().min(2).max(255),
  budget: z.number().positive().optional(),
  expiresAt: z.string().datetime().optional(),
})

export const updateBuyerRequestSchema = z.object({
  status: z.enum(['active', 'closed']).optional(),
  title: z.string().min(3).max(255).optional(),
  description: z.string().max(2000).optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).max(50).optional(),
  location: z.string().min(2).max(255).optional(),
  budget: z.number().positive().optional(),
  expiresAt: z.string().datetime().optional(),
})

export type CreateBuyerRequestInput = z.infer<typeof createBuyerRequestSchema>
export type UpdateBuyerRequestInput = z.infer<typeof updateBuyerRequestSchema>
