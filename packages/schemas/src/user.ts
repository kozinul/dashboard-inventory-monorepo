import { z } from 'zod';

export const UserRoleSchema = z.enum(['superuser', 'system_admin', 'admin', 'manager', 'dept_admin', 'supervisor', 'technician', 'user', 'auditor']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
    _id: z.string().optional(),
    id: z.string().optional(), // For backward compatibility if needed
    email: z.string().email(),
    password: z.string().min(8).optional(), // Password optional for updates/retrieval
    username: z.string().min(3),
    name: z.string().min(2),
    role: UserRoleSchema.default('user'),
    department: z.string().optional(),
    departmentId: z.string().optional(),
    designation: z.string().optional(),
    status: z.enum(['Active', 'Inactive', 'Offline', 'Away']).default('Active'),
    branchId: z.string().optional(),
    avatarUrl: z.string().optional(),
    isActive: z.boolean().default(true),
    lastLogin: z.date().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.pick({
    email: true,
    password: true,
    username: true,
    name: true,
    role: true,
    department: true,
    departmentId: true,
    designation: true,
    status: true,
    branchId: true,
    avatarUrl: true
});
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});
