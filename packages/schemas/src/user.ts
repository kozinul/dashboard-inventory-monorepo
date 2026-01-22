import { z } from 'zod';

export const UserRoleSchema = z.enum(['admin', 'manager', 'user', 'auditor']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2),
    role: UserRoleSchema.default('user'),
    isActive: z.boolean().default(true),
    lastLogin: z.date().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.pick({ email: true, password: true, fullName: true, role: true });
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});
