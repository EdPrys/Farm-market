import { z } from 'zod'

export const categorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
})

export type Category = z.infer<typeof categorySchema>
