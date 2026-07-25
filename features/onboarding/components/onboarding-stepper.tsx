import { Building2, Check, IdCard, UserRound } from "lucide-react";

import type { OnboardingStep } from "../types/onboarding.types";

interface OnboardingStepperProps {
  currentStep: OnboardingStep;
}

const steps = [
  {
    id: "USER_ACCOUNT" as const,
    label: "User account",
    description: "Login and identity",
    icon: UserRound,
  },
  {
    id: "COMPANY_ACCESS" as const,
    label: "Company access",
    description: "Role and employment",
    icon: Building2,
  },
  {
    id: "EMPLOYEE_PROFILE" as const,
    label: "Employee profile",
    description: "HR information",
    icon: IdCard,
  },
];

function getStepIndex(step: OnboardingStep) {
  return steps.findIndex((item) => item.id === step);
}

export function OnboardingStepper({ currentStep }: OnboardingStepperProps) {
  const currentStepIndex = getStepIndex(currentStep);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;

          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div
              key={step.id}
              className={`rounded-xl border p-4 transition ${
                isCurrent
                  ? "border-blue-300 bg-blue-50"
                  : isCompleted
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    isCurrent
                      ? "bg-blue-600 text-white"
                      : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-slate-500"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold ${
                      isCurrent
                        ? "text-blue-950"
                        : isCompleted
                          ? "text-emerald-950"
                          : "text-slate-700"
                    }`}
                  >
                    Step {index + 1}: {step.label}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
