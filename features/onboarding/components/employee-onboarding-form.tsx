"use client";

import { useState } from "react";

import { CompanyAccessStep } from "./company-access-step";
import { EmployeeProfileStep } from "./employee-profile-step";
import { OnboardingStepper } from "./onboarding-stepper";
import { UserAccountStep } from "./user-account-step";

import type {
  OnboardingState,
  OnboardingStep,
} from "../types/onboarding.types";

const initialState: OnboardingState = {
  currentStep: "USER_ACCOUNT",
  createdUser: null,
  companyAccess: null,
  employeeId: null,
};

export function EmployeeOnboardingForm() {
  const [onboardingState, setOnboardingState] =
    useState<OnboardingState>(initialState);

  function goToStep(step: OnboardingStep) {
    setOnboardingState((current) => ({
      ...current,
      currentStep: step,
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Employee onboarding
        </h1>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Create the user account, assign company access and complete the
          employee profile.
        </p>
      </div>

      <OnboardingStepper currentStep={onboardingState.currentStep} />

      {onboardingState.currentStep === "USER_ACCOUNT" && (
        <UserAccountStep
          onSuccess={(createdUser) => {
            setOnboardingState((current) => ({
              ...current,
              createdUser,
              currentStep: "COMPANY_ACCESS",
            }));
          }}
        />
      )}

      {onboardingState.currentStep === "COMPANY_ACCESS" &&
        onboardingState.createdUser && (
          <CompanyAccessStep
            user={onboardingState.createdUser}
            onBack={() => goToStep("USER_ACCOUNT")}
            onSuccess={(companyAccess) => {
              setOnboardingState((current) => ({
                ...current,
                companyAccess,
                currentStep: "EMPLOYEE_PROFILE",
              }));
            }}
          />
        )}

      {onboardingState.currentStep === "EMPLOYEE_PROFILE" &&
        onboardingState.createdUser &&
        onboardingState.companyAccess && (
          <EmployeeProfileStep
            user={onboardingState.createdUser}
            companyAccessId={onboardingState.companyAccess._id}
            onBack={() => goToStep("COMPANY_ACCESS")}
            onSuccess={(employeeId) => {
              setOnboardingState((current) => ({
                ...current,
                employeeId,
              }));
            }}
          />
        )}
    </div>
  );
}
