import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Role name must be at least 3 characters.")
    .max(100, "Role name cannot exceed 100 characters."),

  code: z
    .string()
    .trim()
    .min(2, "Role code is required.")
    .max(50, "Role code cannot exceed 50 characters.")
    .regex(
      /^[A-Z0-9_]+$/,
      "Role code must contain only uppercase letters, numbers, and underscores.",
    ),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters.")
    .optional()
    .or(z.literal("")),

  scopeType: z.literal("COMPANY"),

  permissionIds: z
    .array(z.string())
    .min(1, "Select at least one permission."),

  status: z.enum([
    "ACTIVE",
    "INACTIVE",
  ]),
});

export type CreateRoleFormValues =
  z.infer<typeof createRoleSchema>;