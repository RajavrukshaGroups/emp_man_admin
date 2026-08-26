import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Role name must contain at least 2 characters.")
    .max(100, "Role name cannot exceed 100 characters."),

  code: z
    .string()
    .trim()
    .min(2, "Role code must contain at least 2 characters.")
    .max(50, "Role code cannot exceed 50 characters.")
    .regex(
      /^[A-Za-z0-9_]+$/,
      "Role code may contain only letters, numbers and underscores.",
    ),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters.")
    .optional()
    .or(z.literal("")),

  scopeType: z.enum([
    "COMPANY",
    "DEPARTMENT",
    "TEAM",
  ]),

  permissionIds: z.array(z.string()),

  status: z.enum([
    "ACTIVE",
    "INACTIVE",
  ]),
});

export type CreateRoleFormValues =
  z.infer<typeof createRoleSchema>;