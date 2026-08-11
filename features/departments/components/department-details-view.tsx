"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Edit3,
  Network,
  Power,
  RefreshCcw,
  Trash2,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { departmentService } from "@/features/departments/services/department.service";
import type {
  Department,
  DepartmentAuditUser,
  DepartmentHeadReference,
  ParentDepartmentReference,
} from "@/features/departments/types/department.types";
import { useAuthStore } from "@/store/auth.store";

interface DepartmentDetailsViewProps {
  departmentId: string;
}

function getErrorMessage(
  error: unknown,
  fallbackMessage = "Unable to retrieve department details.",
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

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isObjectReference<T extends { _id: string }>(
  value: T | string | null | undefined,
): value is T {
  return typeof value === "object" && value !== null && "_id" in value;
}

function getDepartmentHead(value?: DepartmentHeadReference | string | null) {
  if (!isObjectReference<DepartmentHeadReference>(value)) {
    return null;
  }

  return value;
}

function getDepartmentHeadName(
  value?: DepartmentHeadReference | string | null,
) {
  const head = getDepartmentHead(value);

  if (!head) {
    return "—";
  }

  if (typeof head.userId === "object" && head.userId !== null) {
    return (
      head.userId.displayName || head.userId.email || head.employeeCode || "—"
    );
  }

  return head.employeeCode || head.designation || "—";
}

function getParentDepartment(
  value?: ParentDepartmentReference | string | null,
) {
  if (!isObjectReference<ParentDepartmentReference>(value)) {
    return null;
  }

  return value;
}

function getAuditUserName(value?: DepartmentAuditUser | string | null) {
  if (!isObjectReference<DepartmentAuditUser>(value)) {
    return "—";
  }

  return (
    value.displayName ||
    [value.firstName, value.lastName].filter(Boolean).join(" ") ||
    value.email ||
    "—"
  );
}

const statusClassNames = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  INACTIVE: "border-amber-200 bg-amber-50 text-amber-700",
};

export function DepartmentDetailsView({
  departmentId,
}: DepartmentDetailsViewProps) {
  const router = useRouter();
  const company = useAuthStore((state) => state.company);

  const permissions = useAuthStore((state) => state.permissions);

  const canUpdateDepartment = permissions.includes("department.update");
  const canDeleteDepartment = permissions.includes("department.delete");

  const [department, setDepartment] = useState<Department | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  async function handleStatusChange() {
    if (!company?._id || !department) {
      return;
    }

    const nextStatus = department.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      setIsUpdatingStatus(true);

      const updatedDepartment = await departmentService.updateDepartmentStatus(
        company._id,
        department._id,
        nextStatus,
      );

      setDepartment(updatedDepartment);

      toast.success(
        nextStatus === "ACTIVE"
          ? "Department activated successfully."
          : "Department inactivated successfully.",
      );

      setShowStatusConfirmation(false);
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Unable to update department status."),
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleDeleteDepartment() {
    if (!company?._id || !department) {
      return;
    }

    try {
      setIsDeleting(true);

      await departmentService.deleteDepartment(company._id, department._id);

      toast.success("Department deleted successfully.");

      router.push("/departments");
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to delete department."));
    } finally {
      setIsDeleting(false);
    }
  }

  const loadDepartment = useCallback(async () => {
    if (!company?._id) {
      setIsLoading(false);
      setErrorMessage("Active company context is unavailable.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const data = await departmentService.getDepartmentById(
        company._id,
        departmentId,
      );

      setDepartment(data);
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      setDepartment(null);
      setErrorMessage(message);

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, departmentId]);

  useEffect(() => {
    void loadDepartment();
  }, [loadDepartment]);

  if (isLoading) {
    return <DepartmentDetailsSkeleton />;
  }

  if (errorMessage || !department) {
    return (
      <div className="space-y-6">
        <Link
          href="/departments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to departments
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <h1 className="text-xl font-bold text-red-900">
            Unable to load department
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {errorMessage ?? "Department details are unavailable."}
          </p>

          <button
            type="button"
            onClick={() => void loadDepartment()}
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const head = getDepartmentHead(department.departmentHeadId);

  const parent = getParentDepartment(department.parentDepartmentId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <Link
            href="/departments"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to departments
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Department details
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View department structure, leadership and assigned employees.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadDepartment()}
            disabled={isUpdatingStatus || isDeleting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          {canUpdateDepartment && (
            <Link
              href={`/departments/${department._id}/edit`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Edit3 className="h-4 w-4" />
              Edit department
            </Link>
          )}
          {canUpdateDepartment && (
            <Link
              href={`/departments/${department._id}/head`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <UserRoundCog className="h-4 w-4" />
              Manage head
            </Link>
          )}
          {canUpdateDepartment && (
            <button
              type="button"
              onClick={() => setShowStatusConfirmation(true)}
              disabled={isUpdatingStatus || isDeleting}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                department.status === "ACTIVE"
                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <Power className="h-4 w-4" />

              {department.status === "ACTIVE" ? "Inactivate" : "Activate"}
            </button>
          )}
          {canDeleteDepartment && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirmation(true)}
              disabled={isDeleting || isUpdatingStatus}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-8 text-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
              <Building2 className="h-9 w-9" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold">{department.name}</h2>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                    statusClassNames[department.status]
                  }`}
                >
                  {department.status}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-300">
                Department code: {department.code}
              </p>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                {department.description ||
                  "No department description available."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-slate-200 sm:grid-cols-3">
          <SummaryItem
            label="Department head"
            value={getDepartmentHeadName(department.departmentHeadId)}
          />

          <SummaryItem
            label="Assigned employees"
            value={department.statistics?.assignedEmployeeCount ?? 0}
          />

          <SummaryItem
            label="Child departments"
            value={department.statistics?.childDepartmentCount ?? 0}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <DetailsSection
          icon={Network}
          title="Organisation structure"
          description="Department hierarchy and leadership information."
        >
          <DetailsGrid>
            <DetailItem label="Department name" value={department.name} />

            <DetailItem label="Department code" value={department.code} />

            <DetailItem
              label="Department head"
              value={getDepartmentHeadName(department.departmentHeadId)}
            />

            <DetailItem label="Head designation" value={head?.designation} />

            <DetailItem label="Parent department" value={parent?.name} />

            <DetailItem label="Parent department code" value={parent?.code} />
          </DetailsGrid>
        </DetailsSection>

        <DetailsSection
          icon={UsersRound}
          title="Department statistics"
          description="Current assignment summary for this department."
        >
          <DetailsGrid>
            <DetailItem
              label="Assigned employees"
              value={department.statistics?.assignedEmployeeCount ?? 0}
            />

            <DetailItem
              label="Child departments"
              value={department.statistics?.childDepartmentCount ?? 0}
            />

            <DetailItem label="Department status" value={department.status} />
          </DetailsGrid>
        </DetailsSection>

        <DetailsSection
          icon={UserRoundCog}
          title="Department head information"
          description="Employment information for the assigned department head."
        >
          {head ? (
            <DetailsGrid>
              <DetailItem label="Name" value={getDepartmentHeadName(head)} />

              <DetailItem label="Employee code" value={head.employeeCode} />

              <DetailItem label="Designation" value={head.designation} />

              <DetailItem label="Employment type" value={head.employmentType} />
            </DetailsGrid>
          ) : (
            <EmptyValue message="No department head has been assigned." />
          )}
        </DetailsSection>

        <DetailsSection
          icon={CalendarDays}
          title="Record information"
          description="System-generated department audit details."
        >
          <DetailsGrid>
            <DetailItem
              label="Department ID"
              value={department._id}
              breakWords
            />

            <DetailItem
              label="Created at"
              value={formatDate(department.createdAt)}
            />

            <DetailItem
              label="Updated at"
              value={formatDate(department.updatedAt)}
            />

            <DetailItem
              label="Created by"
              value={getAuditUserName(department.createdBy)}
            />

            <DetailItem
              label="Updated by"
              value={getAuditUserName(department.updatedBy)}
            />
          </DetailsGrid>
        </DetailsSection>
      </div>
      {canUpdateDepartment && showStatusConfirmation && (
        <ConfirmationModal
          title={
            department.status === "ACTIVE"
              ? "Inactivate department?"
              : "Activate department?"
          }
          description={
            department.status === "ACTIVE"
              ? "This department will no longer be available for new employee or team assignments. Existing employee assignments will remain unchanged."
              : "This department will become available again for employee and team assignments."
          }
          confirmLabel={
            department.status === "ACTIVE"
              ? "Inactivate department"
              : "Activate department"
          }
          variant={department.status === "ACTIVE" ? "warning" : "success"}
          isLoading={isUpdatingStatus}
          onCancel={() => setShowStatusConfirmation(false)}
          onConfirm={() => void handleStatusChange()}
        />
      )}

      {canDeleteDepartment && showDeleteConfirmation && (
        <ConfirmationModal
          title="Delete department?"
          description="This action soft-deletes the department. The department cannot be deleted while active employees or child departments are assigned to it."
          confirmLabel="Delete department"
          variant="danger"
          isLoading={isDeleting}
          onCancel={() => setShowDeleteConfirmation(false)}
          onConfirm={() => void handleDeleteDepartment()}
        />
      )}
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white px-6 py-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function DetailsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>

          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

function DetailsGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}

function DetailItem({
  label,
  value,
  breakWords = false,
}: {
  label: string;
  value?: string | number | null;
  breakWords?: boolean;
}) {
  const displayValue =
    value === undefined || value === null || value === "" ? "—" : String(value);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1.5 text-sm font-medium text-slate-800 ${
          breakWords ? "break-all" : ""
        }`}
      >
        {displayValue}
      </p>
    </div>
  );
}

function EmptyValue({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function DepartmentDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-60 animate-pulse rounded-xl bg-slate-200" />

      <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />

      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>
    </div>
  );
}

interface ConfirmationModalProps {
  title: string;
  description: string;
  confirmLabel: string;

  variant: "danger" | "warning" | "success";

  isLoading: boolean;

  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationModal({
  title,
  description,
  confirmLabel,
  variant,
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const confirmClassNames = {
    danger: "bg-red-600 hover:bg-red-700",

    warning: "bg-amber-600 hover:bg-amber-700",

    success: "bg-emerald-600 hover:bg-emerald-700",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{title}</h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              confirmClassNames[variant]
            }`}
          >
            {isLoading && <RefreshCcw className="h-4 w-4 animate-spin" />}

            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
