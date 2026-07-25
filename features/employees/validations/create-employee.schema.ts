import { z } from "zod";

const optionalText = (maximumLength: number) =>
    z
        .string()
        .trim()
        .max(maximumLength)
        .transform((value) => value || undefined);

const optionalDate = z
    .string()
    .trim()
    .transform((value) => value || null);

const optionalSelect = z
    .string()
    .trim()
    .transform((value) => value || null);

export const createEmployeeSchema = z
    .object({
        dateOfBirth: optionalDate,

        gender: optionalSelect.pipe(
            z
                .enum([
                    "MALE",
                    "FEMALE",
                    "OTHER",
                    "PREFER_NOT_TO_SAY",
                ])
                .nullable(),
        ),

        maritalStatus: optionalSelect.pipe(
            z
                .enum([
                    "SINGLE",
                    "MARRIED",
                    "DIVORCED",
                    "WIDOWED",
                    "SEPARATED",
                    "OTHER",
                ])
                .nullable(),
        ),

        bloodGroup: optionalSelect.pipe(
            z
                .enum([
                    "A_POSITIVE",
                    "A_NEGATIVE",
                    "B_POSITIVE",
                    "B_NEGATIVE",
                    "AB_POSITIVE",
                    "AB_NEGATIVE",
                    "O_POSITIVE",
                    "O_NEGATIVE",
                    "UNKNOWN",
                ])
                .nullable(),
        ),

        nationality: optionalText(100),

        personalEmail: z
            .string()
            .trim()
            .transform((value) => value || undefined)
            .refine(
                (value) => !value || z.string().email().safeParse(value).success,
                "Enter a valid personal email.",
            ),

        alternateMobile: optionalText(20),

        addressLine1: optionalText(200),
        addressLine2: optionalText(200),
        city: optionalText(100),
        district: optionalText(100),
        state: optionalText(100),
        country: optionalText(100),
        postalCode: optionalText(20),

        permanentAddressLine1: optionalText(200),
        permanentAddressLine2: optionalText(200),
        permanentCity: optionalText(100),
        permanentDistrict: optionalText(100),
        permanentState: optionalText(100),
        permanentCountry: optionalText(100),
        permanentPostalCode: optionalText(20),

        isPermanentAddressSame: z.boolean(),

        emergencyContactName: optionalText(150),
        emergencyContactRelationship: optionalText(100),
        emergencyContactMobile: optionalText(20),
        emergencyContactAlternateMobile: optionalText(20),

        accountHolderName: optionalText(200),
        bankName: optionalText(200),
        accountNumber: optionalText(50),

        ifscCode: optionalText(20).transform((value) =>
            value?.toUpperCase(),
        ),

        branchName: optionalText(200),

        accountType: optionalSelect.pipe(
            z
                .enum(["SAVINGS", "CURRENT", "SALARY", "OTHER"])
                .nullable(),
        ),

        panNumber: optionalText(20).transform((value) =>
            value?.toUpperCase(),
        ),

        aadhaarNumber: optionalText(20),
        uanNumber: optionalText(30),
        esiNumber: optionalText(30),
        pfNumber: optionalText(50),

        taxRegime: optionalSelect.pipe(
            z.enum(["OLD", "NEW"]).nullable(),
        ),
    })
    .superRefine((values, context) => {
        const emergencyFields = [
            values.emergencyContactName,
            values.emergencyContactRelationship,
            values.emergencyContactMobile,
            values.emergencyContactAlternateMobile,
        ];

        const hasAnyEmergencyValue = emergencyFields.some(Boolean);

        if (hasAnyEmergencyValue) {
            if (!values.emergencyContactName) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["emergencyContactName"],
                    message: "Emergency contact name is required.",
                });
            }

            if (!values.emergencyContactRelationship) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["emergencyContactRelationship"],
                    message: "Relationship is required.",
                });
            }

            if (!values.emergencyContactMobile) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["emergencyContactMobile"],
                    message: "Emergency mobile number is required.",
                });
            }
        }

        if (
            values.dateOfBirth &&
            new Date(values.dateOfBirth) > new Date()
        ) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["dateOfBirth"],
                message: "Date of birth cannot be in the future.",
            });
        }
    });

export type CreateEmployeeFormInput = z.input<
    typeof createEmployeeSchema
>;

export type CreateEmployeeFormValues = z.output<
    typeof createEmployeeSchema
>;