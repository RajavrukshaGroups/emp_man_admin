import { z } from "zod";

const optionalTrimmedString = z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined);

const optionalUrl = z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine(
        (value) => {
            if (!value) {
                return true;
            }

            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        },
        {
            message: "Enter a valid profile photo URL.",
        },
    );

export const createUserSchema = z
    .object({
        firstName: z
            .string()
            .trim()
            .min(1, "First name is required.")
            .min(
                2,
                "First name must contain at least 2 characters.",
            )
            .max(
                50,
                "First name must not exceed 50 characters.",
            )
            .regex(
                /^[A-Za-z][A-Za-z\s'-]*$/,
                "First name can contain only letters, spaces, apostrophes and hyphens.",
            ),

        middleName: optionalTrimmedString.refine(
            (value) =>
                !value ||
                /^[A-Za-z][A-Za-z\s'-]*$/.test(value),
            {
                message:
                    "Middle name can contain only letters, spaces, apostrophes and hyphens.",
            },
        ),

        lastName: z
            .string()
            .trim()
            .min(1, "Last name is required.")
            .min(
                2,
                "Last name must contain at least 2 characters.",
            )
            .max(
                50,
                "Last name must not exceed 50 characters.",
            )
            .regex(
                /^[A-Za-z][A-Za-z\s'-]*$/,
                "Last name can contain only letters, spaces, apostrophes and hyphens.",
            ),

        displayName: optionalTrimmedString.refine(
            (value) => !value || value.length <= 120,
            {
                message:
                    "Display name must not exceed 120 characters.",
            },
        ),

        email: z
            .string()
            .trim()
            .min(1, "Email address is required.")
            .email("Enter a valid email address.")
            .max(
                150,
                "Email address must not exceed 150 characters.",
            )
            .transform((value) => value.toLowerCase()),

        mobile: optionalTrimmedString.refine(
            (value) =>
                !value || /^[6-9]\d{9}$/.test(value),
            {
                message:
                    "Enter a valid 10-digit Indian mobile number.",
            },
        ),

        profilePhoto: optionalUrl,

        gender: z
            .enum([
                "MALE",
                "FEMALE",
                "OTHER",
                "PREFER_NOT_TO_SAY",
            ])
            .optional(),

        dateOfBirth: optionalTrimmedString.refine(
            (value) => {
                if (!value) {
                    return true;
                }

                const selectedDate = new Date(value);

                return (
                    !Number.isNaN(selectedDate.getTime()) &&
                    selectedDate <= new Date()
                );
            },
            {
                message:
                    "Date of birth cannot be in the future.",
            },
        ),

        password: z
            .string()
            .min(1, "Password is required.")
            .min(
                8,
                "Password must contain at least 8 characters.",
            )
            .max(
                72,
                "Password must not exceed 72 characters.",
            )
            .regex(
                /[a-z]/,
                "Password must contain at least one lowercase letter.",
            )
            .regex(
                /[A-Z]/,
                "Password must contain at least one uppercase letter.",
            )
            .regex(
                /\d/,
                "Password must contain at least one number.",
            )
            .regex(
                /[^A-Za-z0-9]/,
                "Password must contain at least one special character.",
            ),

        confirmPassword: z
            .string()
            .min(
                1,
                "Please confirm the password.",
            ),

        status: z.enum([
            "ACTIVE",
            "INACTIVE",
            "SUSPENDED",
        ]),
    })
    .superRefine((values, context) => {
        if (
            values.password !==
            values.confirmPassword
        ) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["confirmPassword"],
                message: "Passwords do not match.",
            });
        }

        if (values.dateOfBirth) {
            const dateOfBirth = new Date(
                values.dateOfBirth,
            );

            const today = new Date();

            const minimumDate = new Date(
                today.getFullYear() - 100,
                today.getMonth(),
                today.getDate(),
            );

            if (dateOfBirth < minimumDate) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["dateOfBirth"],
                    message:
                        "Date of birth must be within the last 100 years.",
                });
            }
        }
    });

export type CreateUserFormInput = z.input<
    typeof createUserSchema
>;

export type CreateUserFormValues = z.output<
    typeof createUserSchema
>;