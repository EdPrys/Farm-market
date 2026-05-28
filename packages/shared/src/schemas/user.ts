import { z } from 'zod'

export const signupSchema = z.object({
  fullName: z.string().min(1).max(255).nullable().optional(),
  email: z.string().email().max(254),
  password: z.string().min(8).max(32),
  passwordConfirmation: z.string().min(8).max(32),
  isSeller: z.boolean().optional(),
  farmName: z.string().min(1).max(255).nullable().optional(),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: 'Passwords do not match',
  path: ['passwordConfirmation'],
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1), // min(1) intentional: accepts any stored password regardless of current policy
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>

export const updateSellerProfileSchema = z.object({
  phone: z.string().max(30).nullable().optional(),
  telegram: z.string().max(100).nullable().optional(),
  viber: z.string().max(30).nullable().optional(),
})
export type UpdateSellerProfileInput = z.infer<typeof updateSellerProfileSchema>
