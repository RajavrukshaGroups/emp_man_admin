"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  Loader2,
  RefreshCcw,
  Save,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { companyAccessService } from "@/features/company-access/services/company-access.service";
import type { CompanyAccess } from "@/features/company-access/types/company-access.types";

import { departmentService } from "@/features/departments/services/department.service";
import type {
  Department,
  DepartmentHeadReference,
} from "@/features/departments/types/department.types";

import { useAuthStore } from "@/store/auth.store";

interface ManageDepartmentHeadProps {
  departmentId: string;
}

function getErrorMessage(
  error: unknown,
  fallbackMessage = "Unable to manage department head.",
) {
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

function getCurrentDepartmentHeadId(department: Department) {
  const value = department.departmentHeadId;

  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return (value as DepartmentHeadReference)._id;
}

function getCompanyAccessDepartmentId(access: CompanyAccess) {
  if (!access.departmentId) {
    return null;
  }

  if (typeof access.departmentId === "string") {
    return access.departmentId;
  }

  return access.departmentId._id;
}

function getEmployeeName(access: CompanyAccess) {
  if (typeof access.userId === "object" && access.userId !== null) {
    return (
      access.userId.displayName ||
      access.userId.email ||
      access.employeeCode ||
      "Unnamed employee"
    );
  }

  return access.employeeCode || access.designation || "Employee";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function ManageDepartmentHead({
  departmentId,
}: ManageDepartmentHeadProps) {
  const router = useRouter();

  const company = useAuthStore((state) => state.company);

  const [department, setDepartment] = useState<Department | null>(null);

  const [companyAccessRecords, setCompanyAccessRecords] = useState<
    CompanyAccess[]
  >([]);

  const [selectedHeadId, setSelectedHeadId] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!company?._id) {
      setIsLoading(false);

      setLoadError("Active company context is unavailable.");

      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);

      const [departmentData, accessResult] = await Promise.all([
        departmentService.getDepartmentById(company._id, departmentId),

        companyAccessService.getCompanyAccessList(company._id, {
          page: 1,
          limit: 100,
          status: "ACTIVE",
          sortBy: "createdAt",
          sortOrder: "asc",
        }),
      ]);

      setDepartment(departmentData);

      setCompanyAccessRecords(accessResult.records);

      setSelectedHeadId(getCurrentDepartmentHeadId(departmentData));
    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        "Unable to load department-head information.",
      );

      setLoadError(message);

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, departmentId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const eligibleEmployees = useMemo(() => {
    if (!department) {
      return [];
    }

    return companyAccessRecords.filter(
      (access) =>
        access.status === "ACTIVE" &&
        getCompanyAccessDepartmentId(access) === department._id,
    );
  }, [companyAccessRecords, department]);

  async function handleSave() {
    if (!company?._id || !department) {
      return;
    }

    try {
      setIsSaving(true);

      await departmentService.updateDepartment(company._id, department._id, {
        departmentHeadId: selectedHeadId || null,
      });

      toast.success(
        selectedHeadId
          ? "Department head assigned successfully."
          : "Department head removed successfully.",
      );

      router.push(`/departments/${department._id}`);

      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to update department head."));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <ManageDepartmentHeadSkeleton />;
  }

  if (loadError || !department) {
    return (
      <div className="space-y-6">
        <Link
          href={`/departments/${departmentId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to department
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <h1 className="text-xl font-bold text-red-900">
            Unable to load department
          </h1>

          <p className="mt-2 text-sm text-red-700">{loadError}</p>

          <button
            type="button"
            onClick={() => void loadData()}
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href={`/departments/${department._id}`}
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Manage department head
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Assign an active employee from this department as the department
              head.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Department
          </p>

          <p className="mt-1 text-sm font-semibold text-blue-950">
            {department.name}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-950">
                Department information
              </h2>

              <p className="text-sm text-slate-500">
                The selected employee will lead this department.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <InfoCard label="Department" value={department.name} />

          <InfoCard label="Department code" value={department.code} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UsersRound className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-950">
                Eligible employees
              </h2>

              <p className="text-sm text-slate-500">
                Only active employees currently assigned to this department are
                shown.
              </p>
            </div>
          </div>

          <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
            {selectedHeadId ? "1 selected" : "No head selected"}
          </span>
        </div>

        <div className="p-5 sm:p-6">
          {eligibleEmployees.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
              <UsersRound className="mx-auto h-6 w-6 text-slate-400" />

              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                No eligible employees
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Assign an employee to this department first.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {eligibleEmployees.map((access) => {
                const name = getEmployeeName(access);

                const isSelected = selectedHeadId === access._id;

                return (
                  <button
                    key={access._id}
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      setSelectedHeadId(isSelected ? "" : access._id)
                    }
                    className={`relative rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-blue-300 bg-blue-50 ring-2 ring-blue-500/10"
                        : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}

                    <div className="flex items-start gap-3 pr-8">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {getInitials(name)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {name}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {access.designation || "No designation"}
                        </p>

                        <p className="mt-1 text-xs font-medium text-blue-600">
                          {access.employeeCode || "No employee code"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <UserRoundCog className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

              <div>
                <p className="text-xs font-semibold text-slate-700">
                  One department head can be assigned.
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Click the currently selected employee again to remove the
                  department head assignment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex sm:items-center sm:justify-between">
        <div className="mb-3 sm:mb-0">
          <p className="text-xs font-medium text-slate-600">
            {selectedHeadId
              ? "Department head selected."
              : "No department head selected."}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Saving without a selection removes the current department head.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Link
            href={`/departments/${department._id}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Link>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save department head
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ManageDepartmentHeadSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-80 animate-pulse rounded-xl bg-slate-200" />

      <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />

      <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}
