import { z } from 'zod'

export const createFarmSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  location: z.string().max(255).nullable().optional(),
  activities: z.array(z.string().max(100)).max(20).optional(),
  instagram: z.string().max(255).nullable().optional(),
})

export const updateFarmSchema = createFarmSchema.partial()

export type CreateFarmInput = z.infer<typeof createFarmSchema>
export type UpdateFarmInput = z.infer<typeof updateFarmSchema>
