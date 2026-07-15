import { z } from 'zod';

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128);

export const RegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(1).max(100).optional(),
});

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const LogoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
