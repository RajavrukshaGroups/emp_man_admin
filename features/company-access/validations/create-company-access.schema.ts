import { z } from "zod";

const objectIdRegex = /^[a-f\d]{24}$/i;

const optionalTrimmedString = z
    .string()
    .trim()
    .transform((value) => value || undefined);

const nullableObjectId = z
    .string()
    .trim()
    .transform((value) => value || null)
    .refine(
        (value) => value === null || objectIdRegex.test(value),
        "Invalid selection.",
    );

const nullableDate = z
    .string()
    .trim()
    .transform((value) => value || null);

export const createCompanyAccessSchema = z
    .object({
        roleId: z
            .string()
            .trim()
            .min(1, "Role is required.")
            .regex(objectIdRegex, "Select a valid role."),

        employeeCode: z
            .string()
            .trim()
            .max(50, "Employee code must not exceed 50 characters.")
            .regex(
                /^[A-Za-z0-9_/-]*$/,
                "Employee code can contain only letters, numbers, underscores, hyphens and slashes.",
            )
            .transform((value) => value.toUpperCase() || null),

        designation: optionalTrimmedString.refine(
            (value) => !value || value.length <= 100,
            "Designation must not exceed 100 characters.",
        ),

        employmentType: z.enum([
            "FULL_TIME",
            "PART_TIME",
            "CONTRACT",
            "INTERN",
            "CONSULTANT",
            "FREELANCER",
        ]),

        departmentId: nullableObjectId,

        teamId: nullableObjectId,

        reportingManagerId: nullableObjectId,

        joiningDate: nullableDate,

        probationEndDate: nullableDate,

        workLocationType: z.enum([
            "HEAD_OFFICE",
            "BRANCH",
            "REMOTE",
            "HYBRID",
            "CLIENT_LOCATION",
        ]),

        workLocationName: optionalTrimmedString.refine(
            (value) => !value || value.length <= 150,
            "Work location name must not exceed 150 characters.",
        ),

        isPrimaryCompany: z.boolean(),

        status: z.enum([
            "ONBOARDING",
            "ACTIVE",
            "INACTIVE",
            "RESIGNED",
            "TERMINATED",
        ]),

        notes: optionalTrimmedString.refine(
            (value) => !value || value.length <= 1000,
            "Notes must not exceed 1000 characters.",
        ),
    })
    .superRefine((values, context) => {
        if (values.joiningDate && values.probationEndDate) {
            const joiningDate = new Date(values.joiningDate);
            const probationEndDate = new Date(values.probationEndDate);

            if (probationEndDate < joiningDate) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["probationEndDate"],
                    message:
                        "Probation end date cannot be earlier than joining date.",
                });
            }
        }

        if (
            ["RESIGNED", "TERMINATED"].includes(values.status)
        ) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["status"],
                message:
                    "New employee onboarding cannot begin with resigned or terminated status.",
            });
        }
    });

export type CreateCompanyAccessFormInput = z.input<
    typeof createCompanyAccessSchema
>;

export type CreateCompanyAccessFormValues = z.output<
    typeof createCompanyAccessSchema
>;