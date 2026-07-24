import { z } from "zod";

const optionalTextField = (maxLength: number, fieldName: string) =>
    z
        .string()
        .trim()
        .max(maxLength, `${fieldName} must not exceed ${maxLength} characters.`)
        .transform((value) => value || undefined)
        .optional();

const optionalMobileSchema = z
    .string()
    .trim()
    .refine(
        (value) => value === "" || /^[6-9]\d{9}$/.test(value),
        "Enter a valid 10-digit Indian mobile number.",
    )
    .transform((value) => value || undefined)
    .optional();

const optionalProfilePhotoSchema = z
    .string()
    .trim()
    .refine(
        (value) => {
            if (!value) {
                return true;
            }

            try {
                const url = new URL(value);

                return url.protocol === "http:" || url.protocol === "https:";
            } catch {
                return false;
            }
        },
        "Enter a valid profile photo URL.",
    )
    .transform((value) => value || undefined)
    .optional();

const optionalDateSchema = z
    .string()
    .trim()
    .refine(
        (value) => {
            if (!value) {
                return true;
            }

            const date = new Date(`${value}T00:00:00`);

            return !Number.isNaN(date.getTime());
        },
        "Enter a valid date of birth.",
    )
    .refine(
        (value) => {
            if (!value) {
                return true;
            }

            const date = new Date(`${value}T00:00:00`);
            const today = new Date();

            date.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);

            return date <= today;
        },
        "Date of birth cannot be in the future.",
    )
    .transform((value) => value || undefined)
    .optional();

export const editUserSchema = z.object({
    firstName: z
        .string()
        .trim()
        .min(2, "First name must contain at least 2 characters.")
        .max(50, "First name must not exceed 50 characters."),

    middleName: optionalTextField(50, "Middle name"),

    lastName: z
        .string()
        .trim()
        .min(1, "Last name is required.")
        .max(50, "Last name must not exceed 50 characters."),

    displayName: optionalTextField(100, "Display name"),

    email: z
        .string()
        .trim()
        .min(1, "Email address is required.")
        .email("Enter a valid email address.")
        .max(150, "Email address must not exceed 150 characters.")
        .transform((value) => value.toLowerCase()),

    mobile: optionalMobileSchema,

    profilePhoto: optionalProfilePhotoSchema,

    gender: z
        .enum([
            "MALE",
            "FEMALE",
            "OTHER",
            "PREFER_NOT_TO_SAY",
        ])
        .optional(),

    dateOfBirth: optionalDateSchema,
});

export type EditUserFormInput = z.input<
    typeof editUserSchema
>;

export type EditUserFormValues = z.output<
    typeof editUserSchema
>;