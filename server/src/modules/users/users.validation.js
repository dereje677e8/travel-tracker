import { z } from 'zod';

export const createUserSchema = z.object({
  fullName: z.string().min(2).max(150),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['administrator', 'staff']),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(150).optional(),
  role: z.enum(['administrator', 'staff']).optional(),
  isActive: z.boolean().optional(),
});
