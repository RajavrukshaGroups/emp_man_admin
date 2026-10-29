import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Email or mobile number is required.")
    .max(150, "Email or mobile number cannot exceed 150 characters."),

  password: z
    .string()
    .min(1, "Password is required.")
    .max(128, "Password cannot exceed 128 characters."),

  companyId: z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, "Invalid company ID.")
    .optional()
    .or(z.literal("")),

  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, "Current password is required."),

        newPassword: z
            .string()
            .min(
                8,
                "New password must contain at least 8 characters.",
            )
            .regex(
                /[A-Z]/,
                "New password must contain an uppercase letter.",
            )
            .regex(
                /[a-z]/,
                "New password must contain a lowercase letter.",
            )
            .regex(
                /\d/,
                "New password must contain a number.",
            )
            .regex(
                /[^A-Za-z0-9]/,
                "New password must contain a special character.",
            ),

        confirmPassword: z
            .string()
            .min(1, "Please confirm your new password."),
    })
    .refine(
        (values) =>
            values.newPassword === values.confirmPassword,
        {
            message: "Passwords do not match.",
            path: ["confirmPassword"],
        },
    )
    .refine(
        (values) =>
            values.currentPassword !== values.newPassword,
        {
            message:
                "New password must be different from the current password.",
            path: ["newPassword"],
        },
    );

export type ChangePasswordFormValues = z.infer<
    typeof changePasswordSchema
>;



/**
 * Forgot Password Validation
 */
/**
 * Forgot Password Validation
 * Employees only need their registered email address.
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required.")
    .email("Please enter a valid email address.")
    .max(150, "Email address cannot exceed 150 characters."),
});

export type ForgotPasswordFormValues = z.infer<
  typeof forgotPasswordSchema
>;

/**
 * Reset Password Validation
 */
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "New password must contain at least 8 characters.")
      .max(128, "New password cannot exceed 128 characters.")
      .regex(/[A-Z]/, "New password must contain an uppercase letter.")
      .regex(/[a-z]/, "New password must contain a lowercase letter.")
      .regex(/\d/, "New password must contain a number.")
      .regex(
        /[^A-Za-z0-9]/,
        "New password must contain a special character.",
      ),

    confirmPassword: z
      .string()
      .min(1, "Please confirm your new password."),
  })
  .refine(
    (values) => values.newPassword === values.confirmPassword,
    {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    },
  );

export type ResetPasswordFormValues = z.infer<
  typeof resetPasswordSchema
>;
