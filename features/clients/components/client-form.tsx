"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { clientService } from "@/features/clients/services/client.service";

import type {
  Client,
  ClientEngagementType,
  ClientStatus,
  ClientType,
  CreateClientRequest,
  UpdateClientRequest,
} from "@/features/clients/types/client.types";

import { useAuthStore } from "@/store/auth.store";

interface ClientFormProps {
  mode: "create" | "edit";
  initialData?: Client | null;
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error?.message ??
      "Unable to save client."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to save client.";
}

function normalizeCode(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toUpperCase();
}

export function ClientForm({ mode, initialData }: ClientFormProps) {
  const router = useRouter();

  const company = useAuthStore((state) => state.company);
  const permissions = useAuthStore((state) => state.permissions);

  const canCreate = permissions.includes("client.create");
  const canUpdate = permissions.includes("client.update");

  const canSubmit = mode === "create" ? canCreate : canUpdate;

  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * ==========================================================
   * BASIC DETAILS
   * ==========================================================
   */

  const [name, setName] = useState(initialData?.name ?? "");

  const [code, setCode] = useState(initialData?.code ?? "");

  const [clientType, setClientType] = useState<ClientType>(
    initialData?.clientType ?? "EXTERNAL",
  );

  const [engagementType, setEngagementType] = useState<ClientEngagementType>(
    initialData?.engagementType ?? "PROJECT",
  );

  const [industry, setIndustry] = useState(initialData?.industry ?? "");

  /**
   * Backend create supports status.
   *
   * For edit, status is handled separately from the
   * dedicated status endpoint.
   */
  const [status, setStatus] = useState<ClientStatus>(
    initialData?.status ?? "ACTIVE",
  );

  /**
   * ==========================================================
   * CONTACT
   * ==========================================================
   */

  const [contactPerson, setContactPerson] = useState(
    initialData?.contactPerson ?? "",
  );

  const [email, setEmail] = useState(initialData?.email ?? "");

  const [mobile, setMobile] = useState(initialData?.mobile ?? "");

  const [alternateMobile, setAlternateMobile] = useState(
    initialData?.alternateMobile ?? "",
  );

  const [website, setWebsite] = useState(initialData?.website ?? "");

  /**
   * ==========================================================
   * ADDRESS
   * ==========================================================
   */

  const [addressLine1, setAddressLine1] = useState(
    initialData?.address?.addressLine1 ?? "",
  );

  const [addressLine2, setAddressLine2] = useState(
    initialData?.address?.addressLine2 ?? "",
  );

  const [city, setCity] = useState(initialData?.address?.city ?? "");

  const [district, setDistrict] = useState(
    initialData?.address?.district ?? "",
  );

  const [state, setState] = useState(initialData?.address?.state ?? "");

  const [country, setCountry] = useState(
    initialData?.address?.country ?? "India",
  );

  const [postalCode, setPostalCode] = useState(
    initialData?.address?.postalCode ?? "",
  );

  /**
   * ==========================================================
   * NOTES
   * ==========================================================
   */

  const [notes, setNotes] = useState(initialData?.notes ?? "");

  /**
   * ==========================================================
   * CODE AUTO GENERATION
   * ==========================================================
   */

  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(
    mode === "edit",
  );

  useEffect(() => {
    if (mode === "create" && !isCodeManuallyEdited) {
      setCode(normalizeCode(name));
    }
  }, [name, mode, isCodeManuallyEdited]);

  /**
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company?._id) {
      toast.error("Active company context is unavailable.");
      return;
    }

    if (!canSubmit) {
      toast.error("You do not have permission to save clients.");
      return;
    }

    if (!name.trim()) {
      toast.error("Client name is required.");
      return;
    }

    if (!code.trim()) {
      toast.error("Client code is required.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (mode === "create") {
        const payload: CreateClientRequest = {
          name: name.trim(),

          code: normalizeCode(code),

          clientType,

          engagementType,

          contactPerson: contactPerson.trim(),

          email: email.trim(),

          mobile: mobile.trim(),

          alternateMobile: alternateMobile.trim(),

          website: website.trim(),

          address: {
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim(),
            city: city.trim(),
            district: district.trim(),
            state: state.trim(),
            country: country.trim() || "India",
            postalCode: postalCode.trim(),
          },

          industry: industry.trim(),

          notes: notes.trim(),

          status,
        };

        await clientService.createClient(company._id, payload);

        toast.success("Client created successfully.");
      } else {
        if (!initialData?._id) {
          toast.error("Client context is unavailable.");
          return;
        }

        const payload: UpdateClientRequest = {
          name: name.trim(),

          code: normalizeCode(code),

          clientType,

          engagementType,

          contactPerson: contactPerson.trim(),

          email: email.trim(),

          mobile: mobile.trim(),

          alternateMobile: alternateMobile.trim(),

          website: website.trim(),

          address: {
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim(),
            city: city.trim(),
            district: district.trim(),
            state: state.trim(),
            country: country.trim(),
            postalCode: postalCode.trim(),
          },

          industry: industry.trim(),

          notes: notes.trim(),
        };

        await clientService.updateClient(company._id, initialData._id, payload);

        toast.success("Client updated successfully.");
      }

      router.push("/clients");
      router.refresh();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * ==========================================================
   * ACCESS DENIED
   * ==========================================================
   */

  if (!canSubmit) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <Building2 className="mx-auto h-8 w-8 text-slate-400" />

        <h1 className="mt-4 text-xl font-bold text-slate-950">
          Permission denied
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          You do not have permission to {mode} clients.
        </p>

        <Link
          href="/clients"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to clients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>
        <Link
          href="/clients"
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to clients
        </Link>

        <p className="text-sm font-semibold text-blue-600">Client management</p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
          {mode === "create" ? "Create client" : "Edit client"}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Maintain client identity, engagement, contact and business
          information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ====================================================
            BASIC INFORMATION
        ==================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Basic information"
            description="Define the client identity and working relationship."
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="name" required>
                Client name
              </FieldLabel>

              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Mercury Academy"
                maxLength={150}
                required
                autoFocus
                className={inputClass}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="code" required>
                Client code
              </FieldLabel>

              <input
                id="code"
                value={code}
                onChange={(event) => {
                  setIsCodeManuallyEdited(true);

                  setCode(normalizeCode(event.target.value));
                }}
                placeholder="MERCURY"
                maxLength={30}
                required
                className={`${inputClass} font-mono`}
              />

              <p className="mt-1.5 text-xs text-slate-500">
                Stable identifier used in APIs and reporting.
              </p>
            </Field>

            <Field>
              <FieldLabel htmlFor="clientType">Client type</FieldLabel>

              <select
                id="clientType"
                value={clientType}
                onChange={(event) =>
                  setClientType(event.target.value as ClientType)
                }
                className={inputClass}
              >
                <option value="EXTERNAL">External</option>

                <option value="IN_HOUSE">In-house</option>
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="engagementType">Engagement type</FieldLabel>

              <select
                id="engagementType"
                value={engagementType}
                onChange={(event) =>
                  setEngagementType(event.target.value as ClientEngagementType)
                }
                className={inputClass}
              >
                <option value="PROJECT">Project</option>

                <option value="RETAINER">Retainer</option>

                <option value="ONGOING">Ongoing</option>

                <option value="ONE_TIME">One-time</option>

                <option value="OTHER">Other</option>
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="industry">Industry</FieldLabel>

              <input
                id="industry"
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
                placeholder="e.g. Education & EdTech"
                maxLength={150}
                className={inputClass}
              />
            </Field>

            {mode === "create" && (
              <Field>
                <FieldLabel htmlFor="status">Initial status</FieldLabel>

                <select
                  id="status"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as ClientStatus)
                  }
                  className={inputClass}
                >
                  <option value="ACTIVE">Active</option>

                  <option value="INACTIVE">Inactive</option>
                </select>
              </Field>
            )}
          </div>
        </section>

        {/* ====================================================
            CONTACT
        ==================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Contact details"
            description="Primary communication information for the client."
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="contactPerson">Contact person</FieldLabel>

              <input
                id="contactPerson"
                value={contactPerson}
                onChange={(event) => setContactPerson(event.target.value)}
                placeholder="e.g. Admissions Team"
                maxLength={150}
                className={inputClass}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="info@example.com"
                maxLength={254}
                className={inputClass}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="mobile">Mobile</FieldLabel>

              <input
                id="mobile"
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                placeholder="9876543210"
                maxLength={30}
                className={inputClass}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="alternateMobile">
                Alternate mobile
              </FieldLabel>

              <input
                id="alternateMobile"
                value={alternateMobile}
                onChange={(event) => setAlternateMobile(event.target.value)}
                placeholder="Optional"
                maxLength={30}
                className={inputClass}
              />
            </Field>

            <div className="lg:col-span-2">
              <FieldLabel htmlFor="website">Website</FieldLabel>

              <input
                id="website"
                type="url"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                placeholder="https://example.com"
                maxLength={500}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* ====================================================
            ADDRESS
        ==================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Address"
            description="Client office or business address."
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="addressLine1">Address line 1</FieldLabel>

              <input
                id="addressLine1"
                value={addressLine1}
                onChange={(event) => setAddressLine1(event.target.value)}
                maxLength={200}
                className={inputClass}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="addressLine2">Address line 2</FieldLabel>

              <input
                id="addressLine2"
                value={addressLine2}
                onChange={(event) => setAddressLine2(event.target.value)}
                maxLength={200}
                className={inputClass}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="city">City</FieldLabel>

              <input
                id="city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                maxLength={100}
                className={inputClass}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="district">District</FieldLabel>

              <input
                id="district"
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                maxLength={100}
                className={inputClass}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="state">State</FieldLabel>

              <input
                id="state"
                value={state}
                onChange={(event) => setState(event.target.value)}
                maxLength={100}
                className={inputClass}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="country">Country</FieldLabel>

              <input
                id="country"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                maxLength={100}
                className={inputClass}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="postalCode">Postal code</FieldLabel>

              <input
                id="postalCode"
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
                maxLength={20}
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        {/* ====================================================
            NOTES
        ==================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Additional information"
            description="Optional internal notes about this client."
          />

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add commercial, operational or other useful client notes..."
            rows={6}
            maxLength={3000}
            className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />

          <div className="mt-1.5 flex justify-end">
            <span className="text-xs text-slate-400">{notes.length}/3000</span>
          </div>
        </section>

        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/clients"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !code.trim()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />

                {mode === "create" ? "Create client" : "Save changes"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * ============================================================
 * SHARED FORM COMPONENTS
 * ============================================================
 */

const inputClass =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="font-semibold text-slate-950">{title}</h2>

      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function FieldLabel({
  htmlFor,
  required = false,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-semibold text-slate-700"
    >
      {children}

      {required && <span className="ml-1 text-rose-500">*</span>}
    </label>
  );
}
