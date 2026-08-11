import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Role name must contain at least 2 characters.")
    .max(100),

  code: z
    .string()
    .trim()
    .min(2)
    .max(50),

  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("")),

  permissionIds: z.array(z.string()),

  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type CreateRoleFormValues =
  z.infer<typeof createRoleSchema>;