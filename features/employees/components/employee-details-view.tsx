"use client";

import axios from "axios";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ContactRound,
  CreditCard,
  FileText,
  HeartPulse,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCcw,
  ShieldCheck,
  UserRound,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { employeeService } from "@/features/employees/services/employee.service";
import type {
  Employee,
  EmployeeAddress,
  EmployeeAuditUser,
  EmployeeCompanyAccessReference,
  EmployeeCompanyReference,
  EmployeeDepartmentReference,
  EmployeeReportingManagerReference,
  EmployeeRoleReference,
  EmployeeTeamReference,
  EmployeeUserReference,
} from "@/features/employees/types/employee.types";
import { useAuthStore } from "@/store/auth.store";

interface EmployeeDetailsViewProps {
  employeeId: string;
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error?.message ??
      "Unable to retrieve employee details."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to retrieve employee details.";
}

function isObjectReference<T extends { _id: string }>(
  value: T | string | null | undefined,
): value is T {
  return typeof value === "object" && value !== null && "_id" in value;
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

function formatDateTime(value?: string | null) {
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatEnumValue(value?: string | null) {
  if (!value) {
    return "—";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name?: string) {
  if (!name) {
    return "NA";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

// function maskAccountNumber(value?: string) {
//   if (!value) {
//     return "—";
//   }

//   if (value.length <= 4) {
//     return value;
//   }

//   return `${"•".repeat(Math.max(value.length - 4, 4))}${value.slice(-4)}`;
// }

// function maskAadhaarNumber(value?: string) {
//   if (!value) {
//     return "—";
//   }

//   if (value.length <= 4) {
//     return value;
//   }

//   return `XXXX XXXX ${value.slice(-4)}`;
// }

function displayMaskedValue(value?: string) {
  return value || "—";
}

function formatAddress(address?: EmployeeAddress) {
  if (!address) {
    return "—";
  }

  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.district,
    address.state,
    address.country,
    address.postalCode,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "—";
}

function getUser(employee: Employee) {
  return isObjectReference<EmployeeUserReference>(employee.userId)
    ? employee.userId
    : null;
}

function getCompany(employee: Employee) {
  return isObjectReference<EmployeeCompanyReference>(employee.companyId)
    ? employee.companyId
    : null;
}

function getCompanyAccess(employee: Employee) {
  return isObjectReference<EmployeeCompanyAccessReference>(
    employee.companyAccessId,
  )
    ? employee.companyAccessId
    : null;
}

function getDepartment(value: EmployeeCompanyAccessReference["departmentId"]) {
  return isObjectReference<EmployeeDepartmentReference>(value) ? value : null;
}

function getTeam(value: EmployeeCompanyAccessReference["teamId"]) {
  return isObjectReference<EmployeeTeamReference>(value) ? value : null;
}

function getRole(value: EmployeeCompanyAccessReference["roleId"]) {
  return isObjectReference<EmployeeRoleReference>(value) ? value : null;
}

function getReportingManager(
  value: EmployeeCompanyAccessReference["reportingManagerId"],
) {
  return isObjectReference<EmployeeReportingManagerReference>(value)
    ? value
    : null;
}

function getReportingManagerName(
  manager: EmployeeReportingManagerReference | null,
) {
  if (!manager) {
    return "—";
  }

  if (isObjectReference<EmployeeUserReference>(manager.userId)) {
    return manager.userId.displayName || manager.userId.email || "—";
  }

  return manager.employeeCode || "—";
}

function getAuditUserName(value?: EmployeeAuditUser | string | null) {
  if (!isObjectReference<EmployeeAuditUser>(value)) {
    return "—";
  }

  return (
    value.displayName ||
    [value.firstName, value.lastName].filter(Boolean).join(" ") ||
    value.email ||
    "—"
  );
}

const employeeStatusClassNames = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  INACTIVE: "border-amber-200 bg-amber-50 text-amber-700",
  ARCHIVED: "border-slate-200 bg-slate-100 text-slate-600",
};

export function EmployeeDetailsView({ employeeId }: EmployeeDetailsViewProps) {
  const company = useAuthStore((state) => state.company);
  const permissions = useAuthStore((state) => state.permissions);

  const canUpdateEmployee = permissions.includes("employee.update");

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadEmployee = useCallback(async () => {
    if (!company?._id) {
      setIsLoading(false);
      setErrorMessage("Active company context is unavailable.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const employeeData = await employeeService.getEmployeeById(
        company._id,
        employeeId,
      );

      setEmployee(employeeData);
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      setEmployee(null);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, employeeId]);

  useEffect(() => {
    void loadEmployee();
  }, [loadEmployee]);

  if (isLoading) {
    return <EmployeeDetailsSkeleton />;
  }

  if (errorMessage || !employee) {
    return (
      <div className="space-y-6">
        <Link
          href="/employees"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to employees
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <h1 className="text-xl font-bold text-red-900">
            Unable to load employee
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {errorMessage ?? "Employee details are unavailable."}
          </p>

          <button
            type="button"
            onClick={() => void loadEmployee()}
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const user = getUser(employee);
  const employeeCompany = getCompany(employee);
  const companyAccess = getCompanyAccess(employee);

  const department = getDepartment(companyAccess?.departmentId);
  const team = getTeam(companyAccess?.teamId);
  const role = getRole(companyAccess?.roleId);
  const reportingManager = getReportingManager(
    companyAccess?.reportingManagerId,
  );

  const employeeName = user?.displayName || "Unnamed employee";
  const personalDetails = employee.personalDetails;
  const contactDetails = employee.contactDetails;
  const bankDetails = employee.bankDetails;
  const statutoryDetails = employee.statutoryDetails;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <Link
            href="/employees"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to employees
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Employee details
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View the employee’s personal, employment and statutory information.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadEmployee()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>

          {canUpdateEmployee && (
            <>
              <Link
                href={`/employees/${employee._id}/edit`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Pencil className="h-4 w-4" />
                Edit employee
              </Link>

              <Link
                href={`/employees/${employee._id}/employment/edit`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <UserRoundCog className="h-4 w-4" />
                Edit employment
              </Link>
            </>
          )}
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-8 text-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {user?.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={employeeName}
                className="h-24 w-24 rounded-2xl border-4 border-white/20 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white/10 bg-white/10 text-2xl font-bold">
                {getInitials(employeeName)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="truncate text-2xl font-bold">{employeeName}</h2>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                    employeeStatusClassNames[employee.status]
                  }`}
                >
                  {employee.status}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-300">
                {companyAccess?.designation || "Designation not assigned"}
              </p>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" />
                  {companyAccess?.employeeCode || "No employee code"}
                </span>

                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user?.email || "No official email"}
                </span>

                <span className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {user?.mobile || "No mobile number"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
          <ProfileSummaryItem
            label="Company"
            value={employeeCompany?.name || "—"}
          />

          <ProfileSummaryItem
            label="Department"
            value={department?.name || "—"}
          />

          <ProfileSummaryItem
            label="Employment type"
            value={formatEnumValue(companyAccess?.employmentType)}
          />

          <ProfileSummaryItem
            label="Joining date"
            value={formatDate(companyAccess?.joiningDate)}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <DetailsSection
          icon={BriefcaseBusiness}
          title="Employment information"
          description="Company access and employment assignment details."
        >
          <DetailsGrid>
            <DetailItem
              label="Employee code"
              value={companyAccess?.employeeCode}
            />

            <DetailItem
              label="Designation"
              value={companyAccess?.designation}
            />

            <DetailItem label="Department" value={department?.name} />

            <DetailItem label="Team" value={team?.name} />

            <DetailItem label="Role" value={role?.name} />

            <DetailItem
              label="Employment type"
              value={formatEnumValue(companyAccess?.employmentType)}
            />

            <DetailItem
              label="Reporting manager"
              value={getReportingManagerName(reportingManager)}
            />

            <DetailItem
              label="Joining date"
              value={formatDate(companyAccess?.joiningDate)}
            />

            <DetailItem
              label="Probation end date"
              value={formatDate(companyAccess?.probationEndDate)}
            />

            <DetailItem
              label="Last working date"
              value={formatDate(companyAccess?.lastWorkingDate)}
            />

            <DetailItem
              label="Work location type"
              value={formatEnumValue(companyAccess?.workLocationType)}
            />

            <DetailItem
              label="Work location"
              value={companyAccess?.workLocationName}
            />

            <DetailItem
              label="Company access status"
              value={formatEnumValue(companyAccess?.status)}
            />
          </DetailsGrid>
        </DetailsSection>

        <DetailsSection
          icon={UserRound}
          title="Personal information"
          description="Personal and demographic employee information."
        >
          <DetailsGrid>
            <DetailItem label="Full name" value={employeeName} />

            <DetailItem
              label="Date of birth"
              value={formatDate(personalDetails?.dateOfBirth)}
            />

            <DetailItem
              label="Gender"
              value={formatEnumValue(personalDetails?.gender)}
            />

            <DetailItem
              label="Marital status"
              value={formatEnumValue(personalDetails?.maritalStatus)}
            />

            <DetailItem
              label="Blood group"
              value={formatEnumValue(personalDetails?.bloodGroup)}
            />

            <DetailItem
              label="Nationality"
              value={personalDetails?.nationality}
            />

            <DetailItem label="Official email" value={user?.email} breakWords />

            <DetailItem label="Official mobile" value={user?.mobile} />
          </DetailsGrid>
        </DetailsSection>

        <DetailsSection
          icon={ContactRound}
          title="Contact information"
          description="Personal contact details and residential addresses."
        >
          <DetailsGrid>
            <DetailItem
              label="Personal email"
              value={contactDetails?.personalEmail}
              breakWords
            />

            <DetailItem
              label="Alternate mobile"
              value={contactDetails?.alternateMobile}
            />

            <DetailItem
              label="Permanent address same as current"
              value={
                contactDetails?.isPermanentAddressSame === undefined
                  ? "—"
                  : contactDetails.isPermanentAddressSame
                    ? "Yes"
                    : "No"
              }
            />
          </DetailsGrid>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <AddressCard
              title="Current address"
              address={contactDetails?.currentAddress}
            />

            <AddressCard
              title="Permanent address"
              address={contactDetails?.permanentAddress}
            />
          </div>
        </DetailsSection>

        <DetailsSection
          icon={UsersRound}
          title="Emergency contacts"
          description="People to contact in case of an emergency."
        >
          {employee.emergencyContacts?.length ? (
            <div className="space-y-4">
              {employee.emergencyContacts.map((contact, index) => (
                <div
                  key={`${contact.mobile}-${index}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {contact.name}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {contact.relationship}
                      </p>
                    </div>

                    <HeartPulse className="h-5 w-5 text-red-500" />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <DetailItem label="Mobile" value={contact.mobile} />

                    <DetailItem
                      label="Alternate mobile"
                      value={contact.alternateMobile}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyValue message="No emergency contacts have been added." />
          )}
        </DetailsSection>

        <DetailsSection
          icon={Banknote}
          title="Bank information"
          description="Employee salary account and banking details."
        >
          <DetailsGrid>
            <DetailItem
              label="Account holder"
              value={bankDetails?.accountHolderName}
            />

            <DetailItem label="Bank name" value={bankDetails?.bankName} />

            <DetailItem label="Branch" value={bankDetails?.branchName} />

            <DetailItem
              label="Account number"
              value={displayMaskedValue(bankDetails?.accountNumber)}
            />

            <DetailItem label="IFSC code" value={bankDetails?.ifscCode} />

            <DetailItem
              label="Account type"
              value={formatEnumValue(bankDetails?.accountType)}
            />
          </DetailsGrid>
        </DetailsSection>

        <DetailsSection
          icon={ShieldCheck}
          title="Statutory information"
          description="Government and employment statutory identifiers."
        >
          <DetailsGrid>
            <DetailItem
              label="PAN number"
              value={statutoryDetails?.panNumber}
            />

            <DetailItem
              label="Aadhaar number"
              value={displayMaskedValue(statutoryDetails?.aadhaarNumber)}
            />

            <DetailItem
              label="UAN number"
              value={statutoryDetails?.uanNumber}
            />

            <DetailItem label="PF number" value={statutoryDetails?.pfNumber} />

            <DetailItem
              label="ESI number"
              value={statutoryDetails?.esiNumber}
            />

            <DetailItem
              label="Tax regime"
              value={formatEnumValue(statutoryDetails?.taxRegime)}
            />
          </DetailsGrid>
        </DetailsSection>
      </div>

      <DetailsSection
        icon={FileText}
        title="Employee documents"
        description="Uploaded identity, qualification and employment documents."
      >
        {employee.documents?.length ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-[850px] w-full">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <TableHeading>Document</TableHeading>
                  <TableHeading>Document number</TableHeading>
                  <TableHeading>Expiry date</TableHeading>
                  <TableHeading>Verification</TableHeading>
                  <TableHeading>Verified by</TableHeading>
                  <TableHeading align="right">File</TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {employee.documents.map((document, index) => (
                  <tr key={document._id ?? `${document.documentType}-${index}`}>
                    <TableCell>
                      <p className="font-semibold text-slate-800">
                        {document.documentName ||
                          formatEnumValue(document.documentType)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatEnumValue(document.documentType)}
                      </p>
                    </TableCell>

                    <TableCell>{document.documentNumber || "—"}</TableCell>

                    <TableCell>{formatDate(document.expiryDate)}</TableCell>

                    <TableCell>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          document.isVerified
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {document.isVerified ? "Verified" : "Pending"}
                      </span>
                    </TableCell>

                    <TableCell>
                      {getAuditUserName(document.verifiedBy)}
                    </TableCell>

                    <TableCell align="right">
                      {document.fileUrl ? (
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                        >
                          View file
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyValue message="No employee documents have been uploaded." />
        )}
      </DetailsSection>

      <DetailsSection
        icon={CalendarDays}
        title="Record information"
        description="System-generated employee record and audit details."
      >
        <DetailsGrid>
          <DetailItem label="Employee ID" value={employee._id} breakWords />

          <DetailItem
            label="Company"
            value={
              employeeCompany
                ? `${employeeCompany.name} (${employeeCompany.code})`
                : "—"
            }
          />

          <DetailItem
            label="Created at"
            value={formatDateTime(employee.createdAt)}
          />

          <DetailItem
            label="Updated at"
            value={formatDateTime(employee.updatedAt)}
          />

          <DetailItem
            label="Created by"
            value={getAuditUserName(employee.createdBy)}
          />

          <DetailItem
            label="Updated by"
            value={getAuditUserName(employee.updatedBy)}
          />
        </DetailsGrid>
      </DetailsSection>
    </div>
  );
}

interface ProfileSummaryItemProps {
  label: string;
  value: string;
}

function ProfileSummaryItem({ label, value }: ProfileSummaryItemProps) {
  return (
    <div className="bg-white px-6 py-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

interface DetailsSectionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}

function DetailsSection({
  icon: Icon,
  title,
  description,
  children,
}: DetailsSectionProps) {
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

interface DetailItemProps {
  label: string;
  value?: string | number | null;
  breakWords?: boolean;
}

function DetailItem({ label, value, breakWords = false }: DetailItemProps) {
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

interface AddressCardProps {
  title: string;
  address?: EmployeeAddress;
}

function AddressCard({ title, address }: AddressCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-blue-600" />

        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {formatAddress(address)}
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

interface TableHeadingProps {
  children: React.ReactNode;
  align?: "left" | "right";
}

function TableHeading({ children, align = "left" }: TableHeadingProps) {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

interface TableCellProps {
  children: React.ReactNode;
  align?: "left" | "right";
}

function TableCell({ children, align = "left" }: TableCellProps) {
  return (
    <td
      className={`px-4 py-4 text-sm text-slate-600 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}

function EmployeeDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-52 animate-pulse rounded-lg bg-slate-200" />

      <div className="h-52 animate-pulse rounded-2xl bg-slate-200" />

      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>
    </div>
  );
}
