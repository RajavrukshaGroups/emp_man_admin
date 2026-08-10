import { z } from "zod";

export const companyAdministratorSchema = z.object({
    firstName: z
        .string()
        .trim()
        .min(2, "First name must contain at least 2 characters.")
        .max(100, "First name cannot exceed 100 characters."),

    middleName: z
        .string()
        .trim()
        .max(100, "Middle name cannot exceed 100 characters.")
        .optional()
        .or(z.literal("")),

    lastName: z
        .string()
        .trim()
        .min(1, "Last name is required.")
        .max(100, "Last name cannot exceed 100 characters."),

    displayName: z
        .string()
        .trim()
        .max(150, "Display name cannot exceed 150 characters.")
        .optional()
        .or(z.literal("")),

    email: z
        .string()
        .trim()
        .email("Enter a valid email address."),

    mobile: z
        .string()
        .trim()
        .max(20, "Mobile number cannot exceed 20 characters.")
        .optional()
        .or(z.literal("")),

    password: z
        .string()
        .min(8, "Password must contain at least 8 characters.")
        .max(128, "Password cannot exceed 128 characters."),

    confirmPassword: z
        .string()
        .min(1, "Confirm password is required."),

    gender: z
        .enum([
            "MALE",
            "FEMALE",
            "OTHER",
            "PREFER_NOT_TO_SAY",
        ])
        .default("PREFER_NOT_TO_SAY"),

    dateOfBirth: z
        .string()
        .optional()
        .or(z.literal("")),

    employeeCode: z
        .string()
        .trim()
        .min(1, "Employee code is required.")
        .max(50, "Employee code cannot exceed 50 characters."),

    designation: z
        .string()
        .trim()
        .max(100, "Designation cannot exceed 100 characters.")
        .default("Company Administrator"),

    employmentType: z
        .enum([
            "FULL_TIME",
            "PART_TIME",
            "CONTRACT",
            "INTERN",
            "CONSULTANT",
            "FREELANCER",
        ])
        .default("FULL_TIME"),

    joiningDate: z
        .string()
        .min(1, "Joining date is required."),

    workLocationType: z
        .enum([
            "HEAD_OFFICE",
            "BRANCH",
            "REMOTE",
            "HYBRID",
            "CLIENT_LOCATION",
        ])
        .default("HEAD_OFFICE"),

    workLocationName: z
        .string()
        .trim()
        .max(150, "Work location cannot exceed 150 characters.")
        .optional()
        .or(z.literal("")),

    notes: z
        .string()
        .trim()
        .max(1000, "Notes cannot exceed 1000 characters.")
        .optional()
        .or(z.literal("")),

    emailVerified: z.boolean().default(true),

    mobileVerified: z.boolean().default(true),

    status: z
        .enum([
            "ACTIVE",
            "INACTIVE",
        ])
        .default("ACTIVE"),
})
    .superRefine((data, context) => {
        if (data.password !== data.confirmPassword) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["confirmPassword"],
                message: "Password and confirmation password do not match.",
            });
        }
    });

export type CompanyAdministratorFormInput =
    z.input<typeof companyAdministratorSchema>;

export type CompanyAdministratorFormValues =
    z.output<typeof companyAdministratorSchema>;