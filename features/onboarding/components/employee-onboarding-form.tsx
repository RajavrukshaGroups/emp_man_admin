"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  ContactRound,
  UserRound,
} from "lucide-react";
import { useState } from "react";

import type { CompanyAccess } from "@/features/company-access/types/company-access.types";
import type { User } from "@/features/users/types/user.types";

import { CompanyAccessStep } from "./company-access-step";
import { EmployeeProfileStep } from "./employee-profile-step";
import { UserAccountStep } from "./user-account-step";

type OnboardingStep = "USER_ACCOUNT" | "COMPANY_ACCESS" | "EMPLOYEE_PROFILE";

interface OnboardingState {
  currentStep: OnboardingStep;
  createdUser: User | null;
  companyAccess: CompanyAccess | null;
  employeeId: string | null;
}

const initialState: OnboardingState = {
  currentStep: "USER_ACCOUNT",
  createdUser: null,
  companyAccess: null,
  employeeId: null,
};

const stepNumber: Record<OnboardingStep, number> = {
  USER_ACCOUNT: 1,
  COMPANY_ACCESS: 2,
  EMPLOYEE_PROFILE: 3,
};

export function EmployeeOnboardingForm() {
  const [state, setState] = useState<OnboardingState>(initialState);
  const router = useRouter();

  const currentStepNumber = stepNumber[state.currentStep];

  function handleUserCreated(user: User) {
    setState((currentState) => ({
      ...currentState,
      createdUser: user,
      currentStep: "COMPANY_ACCESS",
    }));
  }

  function handleCompanyAccessCreated(companyAccess: CompanyAccess) {
    setState((currentState) => ({
      ...currentState,
      companyAccess,
      currentStep: "EMPLOYEE_PROFILE",
    }));
  }

  function handleEmployeeCreated(employeeId: string) {
    setState((currentState) => ({
      ...currentState,
      employeeId,
    }));

    // router.replace(`/employees/${employeeId}`);
    router.replace(`/employees/${employeeId}/edit`);
    router.refresh();
  }

  function goToUserAccount() {
    setState((currentState) => ({
      ...currentState,
      currentStep: "USER_ACCOUNT",
    }));
  }

  function goToCompanyAccess() {
    if (!state.createdUser) {
      return;
    }

    setState((currentState) => ({
      ...currentState,
      currentStep: "COMPANY_ACCESS",
    }));
  }

  function handleStepClick(step: OnboardingStep) {
    if (step === "USER_ACCOUNT") {
      goToUserAccount();
      return;
    }

    if (step === "COMPANY_ACCESS" && state.createdUser) {
      goToCompanyAccess();
      return;
    }

    if (
      step === "EMPLOYEE_PROFILE" &&
      state.createdUser &&
      state.companyAccess
    ) {
      setState((currentState) => ({
        ...currentState,
        currentStep: "EMPLOYEE_PROFILE",
      }));
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/employees"
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
            aria-label="Back to employees"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Employee onboarding
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create the user account, assign company access and complete the
              employee profile.
            </p>
          </div>
        </div>

        {state.createdUser && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Employee being onboarded
            </p>

            <p className="mt-1 text-sm font-semibold text-blue-950">
              {state.createdUser.displayName}
            </p>

            <p className="mt-0.5 text-xs text-blue-700">
              {state.companyAccess?.employeeCode || state.createdUser.email}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StepCard
            step={1}
            title="User account"
            subtitle={
              state.createdUser
                ? `${state.createdUser.displayName} · ${state.createdUser.email}`
                : "Login and identity"
            }
            icon={UserRound}
            isActive={state.currentStep === "USER_ACCOUNT"}
            isCompleted={Boolean(state.createdUser)}
            isDisabled={false}
            onClick={() => handleStepClick("USER_ACCOUNT")}
          />

          <StepCard
            step={2}
            title="Company access"
            subtitle={
              state.companyAccess
                ? `${state.companyAccess.employeeCode || "Employee"} · ${
                    state.companyAccess.designation || "Employment assigned"
                  }`
                : state.createdUser
                  ? `Assign access to ${state.createdUser.displayName}`
                  : "Role and employment"
            }
            icon={Building2}
            isActive={state.currentStep === "COMPANY_ACCESS"}
            isCompleted={Boolean(state.companyAccess)}
            isDisabled={!state.createdUser}
            onClick={() => handleStepClick("COMPANY_ACCESS")}
          />

          <StepCard
            step={3}
            title="Employee profile"
            subtitle={
              state.employeeId
                ? "Employee profile completed"
                : state.createdUser && state.companyAccess
                  ? `${state.createdUser.displayName} · ${
                      state.companyAccess.employeeCode || "HR information"
                    }`
                  : "HR information"
            }
            icon={ContactRound}
            isActive={state.currentStep === "EMPLOYEE_PROFILE"}
            isCompleted={Boolean(state.employeeId)}
            isDisabled={!state.createdUser || !state.companyAccess}
            onClick={() => handleStepClick("EMPLOYEE_PROFILE")}
          />
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{
              width: `${(currentStepNumber / 3) * 100}%`,
            }}
          />
        </div>
      </div>

      {state.currentStep === "USER_ACCOUNT" && (
        <>
          {state.createdUser ? (
            <CompletedUserStep
              user={state.createdUser}
              onContinue={() =>
                setState((currentState) => ({
                  ...currentState,
                  currentStep: "COMPANY_ACCESS",
                }))
              }
            />
          ) : (
            <UserAccountStep onSuccess={handleUserCreated} />
          )}
        </>
      )}

      {state.currentStep === "COMPANY_ACCESS" && state.createdUser && (
        <>
          {state.companyAccess ? (
            <CompletedCompanyAccessStep
              user={state.createdUser}
              companyAccess={state.companyAccess}
              onBack={goToUserAccount}
              onContinue={() =>
                setState((currentState) => ({
                  ...currentState,
                  currentStep: "EMPLOYEE_PROFILE",
                }))
              }
            />
          ) : (
            <CompanyAccessStep
              user={state.createdUser}
              onBack={goToUserAccount}
              onSuccess={handleCompanyAccessCreated}
            />
          )}
        </>
      )}

      {state.currentStep === "EMPLOYEE_PROFILE" &&
        state.createdUser &&
        state.companyAccess && (
          <EmployeeProfileStep
            user={state.createdUser}
            companyAccessId={state.companyAccess._id}
            onBack={goToCompanyAccess}
            onSuccess={handleEmployeeCreated}
          />
        )}
    </div>
  );
}

interface StepCardProps {
  step: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  isActive: boolean;
  isCompleted: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

function StepCard({
  step,
  title,
  subtitle,
  icon: Icon,
  isActive,
  isCompleted,
  isDisabled,
  onClick,
}: StepCardProps) {
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition ${
        isActive
          ? "border-blue-300 bg-blue-50 shadow-sm"
          : isCompleted
            ? "border-emerald-200 bg-emerald-50"
            : "border-slate-200 bg-slate-50"
      } ${
        isDisabled
          ? "cursor-not-allowed opacity-60"
          : "hover:border-blue-300 hover:bg-blue-50"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            isCompleted
              ? "bg-emerald-600 text-white"
              : isActive
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-500"
          }`}
        >
          {isCompleted ? (
            <BadgeCheck className="h-6 w-6" />
          ) : (
            <Icon className="h-6 w-6" />
          )}
        </div>

        <div className="min-w-0">
          <p
            className={`font-semibold ${
              isActive
                ? "text-blue-950"
                : isCompleted
                  ? "text-emerald-950"
                  : "text-slate-800"
            }`}
          >
            Step {step}: {title}
          </p>

          <p
            className={`mt-1 truncate text-sm ${
              isCompleted
                ? "text-emerald-700"
                : isActive
                  ? "text-blue-700"
                  : "text-slate-500"
            }`}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </button>
  );
}

function CompletedUserStep({
  user,
  onContinue,
}: {
  user: User;
  onContinue: () => void;
}) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
            {getInitials(user.displayName)}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-950">
                {user.displayName}
              </h2>

              <BadgeCheck className="h-5 w-5 text-emerald-600" />
            </div>

            <p className="mt-1 text-sm text-slate-500">{user.email}</p>

            {user.mobile && (
              <p className="mt-0.5 text-sm text-slate-500">{user.mobile}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Continue to company access
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-sm font-semibold text-emerald-900">
          User account already created
        </p>

        <p className="mt-1 text-xs leading-5 text-emerald-700">
          This step will not create another user account. Continue to assign
          company access.
        </p>
      </div>
    </div>
  );
}

function CompletedCompanyAccessStep({
  user,
  companyAccess,
  onBack,
  onContinue,
}: {
  user: User;
  companyAccess: CompanyAccess;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-950">
              Company access assigned
            </h2>

            <BadgeCheck className="h-5 w-5 text-emerald-600" />
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Employment access for {user.displayName} has already been created.
          </p>
        </div>

        <span className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {companyAccess.status}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryItem label="Employee code" value={companyAccess.employeeCode} />

        <SummaryItem label="Designation" value={companyAccess.designation} />

        <SummaryItem
          label="Employment type"
          value={formatEnum(companyAccess.employmentType)}
        />

        <SummaryItem
          label="Work location"
          value={companyAccess.workLocationName}
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to user
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Continue to employee profile
        </button>
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatEnum(value?: string | null) {
  if (!value) {
    return "Not provided";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
