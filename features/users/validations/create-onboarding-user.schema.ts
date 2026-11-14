
import { z } from "zod";

import {
    createUserBaseSchema,
    createUserSchema,
} from "./create-user.schema";
const onboardingUserBaseSchema = createUserBaseSchema.safeExtend({
    accountSetupMethod: z
        .enum(["PASSWORD", "EMAIL_INVITATION"])
        .default("EMAIL_INVITATION"),
})
    .omit({
        password: true,
        confirmPassword: true,
    })
    .safeExtend({
        password: z.string().optional(),
        confirmPassword: z.string().optional(),
    });

export const createOnboardingUserSchema =
    onboardingUserBaseSchema.superRefine((values, context) => {
        if (values.accountSetupMethod === "EMAIL_INVITATION") {
            if (values.password || values.confirmPassword) {
                context.addIssue({
                    code: "custom",
                    path: ["password"],
                    message: "Leave password fields empty for email invitations.",
                });
            }

            if (values.status !== "ACTIVE") {
                context.addIssue({
                    code: "custom",
                    path: ["status"],
                    message: "Invitation-based accounts must be active.",
                });
            }

            return;
        }

        const result = createUserSchema.safeParse({
            ...values,
            password: values.password ?? "",
            confirmPassword: values.confirmPassword ?? "",
        });

        if (!result.success) {
            for (const issue of result.error.issues) {
                if (
                    issue.path[0] === "password" ||
                    issue.path[0] === "confirmPassword"
                ) {
                    context.addIssue({
                        code: "custom",
                        path: issue.path,
                        message: issue.message,
                    });
                }
            }
        }
    });

export type CreateOnboardingUserFormInput = z.input<
    typeof createOnboardingUserSchema
>;

export type CreateOnboardingUserFormValues = z.output<
    typeof createOnboardingUserSchema
>;
