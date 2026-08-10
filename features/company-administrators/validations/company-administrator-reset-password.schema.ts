import { z } from "zod";

export const companyAdministratorResetPasswordSchema = z
    .object({
        newPassword: z
            .string()
            .min(8, "New password must contain at least 8 characters.")
            .max(128, "New password cannot exceed 128 characters."),

        confirmPassword: z
            .string()
            .min(1, "Confirm password is required."),
    })
    .superRefine((data, context) => {
        if (data.newPassword !== data.confirmPassword) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["confirmPassword"],
                message: "New password and confirmation password do not match.",
            });
        }
    });

export type CompanyAdministratorResetPasswordFormValues =
    z.infer<typeof companyAdministratorResetPasswordSchema>;