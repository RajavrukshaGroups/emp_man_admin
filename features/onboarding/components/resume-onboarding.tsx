"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Loader2, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { CompanyAccessStep } from "./company-access-step";
import { EmployeeProfileStep } from "./employee-profile-step";
import { OnboardingStepper } from "./onboarding-stepper";

import { onboardingService } from "@/features/onboarding/services/onboarding.service";

import type { OnboardingRecord } from "@/features/onboarding/types/onboarding.types";
import type { CompanyAccess } from "@/features/company-access/types/company-access.types";

interface ResumeOnboardingProps {
  userId: string;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error?.message ??
      fallbackMessage
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

export function ResumeOnboarding({ userId }: ResumeOnboardingProps) {
  const router = useRouter();

  const [record, setRecord] = useState<OnboardingRecord | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOnboarding = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const data = await onboardingService.getOnboardingByUserId(userId);

      setRecord(data);

      if (data.nextStep === "COMPLETED" && data.employee) {
        router.replace(`/employees/${data.employee._id}`);
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Unable to resume onboarding.");

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [router, userId]);

  useEffect(() => {
    void loadOnboarding();
  }, [loadOnboarding]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading onboarding progress...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage || !record) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-600" />

        <h2 className="mt-4 text-xl font-semibold text-slate-950">
          Unable to resume onboarding
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          {errorMessage ?? "The onboarding record could not be found."}
        </p>

        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            type="button"
            onClick={() => void loadOnboarding()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white"
          >
            <RefreshCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { user, companyAccess, nextStep } = record;

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => router.push("/onboarding")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to onboarding
        </button>

        <div className="mt-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Resume employee onboarding
          </h1>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Continue onboarding for{" "}
            <span className="font-semibold text-slate-700">
              {user.displayName}
            </span>
            .
          </p>
        </div>
      </div>

      <OnboardingStepper
        currentStep={
          nextStep === "COMPANY_ACCESS" ? "COMPANY_ACCESS" : "EMPLOYEE_PROFILE"
        }
      />

      {nextStep === "COMPANY_ACCESS" && (
        <CompanyAccessStep
          user={user}
          onBack={() => router.push("/onboarding")}
          onSuccess={(createdCompanyAccess: CompanyAccess) => {
            setRecord((current) => {
              if (!current) {
                return current;
              }

              return {
                ...current,
                companyAccess: createdCompanyAccess,
                nextStep: "EMPLOYEE_PROFILE",
                user: {
                  ...current.user,
                  onboardingStatus: "COMPANY_ACCESS_CREATED",
                },
              };
            });

            toast.success(
              "Company access completed. Continue with the employee profile.",
            );
          }}
        />
      )}

      {nextStep === "EMPLOYEE_PROFILE" && companyAccess && (
        // <EmployeeProfileStep
        //   user={user}
        //   companyAccessId={companyAccess._id}
        //   onBack={() => router.push("/onboarding")}
        //   onSuccess={(employeeId) => {
        //     toast.success("Employee onboarding completed successfully.");

        //     router.push(`/employees/${employeeId}`);

        //     router.refresh();
        //   }}
        // />
        <EmployeeProfileStep
          user={user}
          companyAccessId={companyAccess._id}
          onBack={() => {
            router.push("/onboarding");
          }}
          onSuccess={(employeeId) => {
            router.replace(`/employees/${employeeId}`);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
