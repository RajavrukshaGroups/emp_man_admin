"use client";

import { useMemo, useState } from "react";
import { Crosshair, Loader2, MapPin, Save, X } from "lucide-react";
import { toast } from "sonner";

import { AttendanceLocationMap } from "./attendance-location-map-loader";
import { LocationSearch, type LocationSearchResult } from "./location-search";

import { attendanceLocationService } from "@/features/attendance/services/attendance-location.service";
import type {
  AttendanceLocation,
  AttendanceLocationStatus,
  AttendanceLocationType,
  CreateAttendanceLocationPayload,
} from "@/features/attendance/types/attendance-location.types";
import { getApiErrorMessage } from "@/lib/axios";

interface AttendanceLocationFormProps {
  companyId: string;

  location?: AttendanceLocation | null;

  onClose: () => void;

  onSaved: (location: AttendanceLocation) => void;
}

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface LocationFormState {
  name: string;
  code: string;
  description: string;

  locationType: AttendanceLocationType;

  clientId: string;

  latitude: number | null;
  longitude: number | null;

  geofenceRadiusMeters: number;

  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  state: string;
  country: string;
  postalCode: string;

  allowCheckIn: boolean;
  allowCheckOut: boolean;
  allowFieldVisit: boolean;

  isDefault: boolean;

  status: AttendanceLocationStatus;
}

const DEFAULT_MAP_CENTER: LocationCoordinates = {
  latitude: 12.9715987,
  longitude: 77.594566,
};

const INITIAL_STATE: LocationFormState = {
  name: "",
  code: "",
  description: "",

  locationType: "OFFICE",

  clientId: "",

  latitude: null,
  longitude: null,

  geofenceRadiusMeters: 200,

  addressLine1: "",
  addressLine2: "",
  city: "",
  district: "",
  state: "",
  country: "India",
  postalCode: "",

  allowCheckIn: true,
  allowCheckOut: true,
  allowFieldVisit: false,

  isDefault: false,

  status: "ACTIVE",
};

function getInitialFormState(
  location?: AttendanceLocation | null,
): LocationFormState {
  if (!location) {
    return {
      ...INITIAL_STATE,
    };
  }

  return {
    name: location.name ?? "",
    code: location.code ?? "",
    description: location.description ?? "",

    locationType: location.locationType,

    clientId: location.clientId ?? "",

    latitude: location.latitude,
    longitude: location.longitude,

    geofenceRadiusMeters: location.geofenceRadiusMeters,

    addressLine1: location.address?.addressLine1 ?? "",

    addressLine2: location.address?.addressLine2 ?? "",

    city: location.address?.city ?? "",

    district: location.address?.district ?? "",

    state: location.address?.state ?? "",

    country: location.address?.country ?? "India",

    postalCode: location.address?.postalCode ?? "",

    allowCheckIn: location.allowCheckIn,

    allowCheckOut: location.allowCheckOut,

    allowFieldVisit: location.allowFieldVisit,

    isDefault: location.isDefault,

    status: location.status,
  };
}

const LOCATION_TYPES: Array<{
  value: AttendanceLocationType;
  label: string;
}> = [
  {
    value: "OFFICE",
    label: "Office",
  },
  {
    value: "BRANCH",
    label: "Branch",
  },
  {
    value: "WAREHOUSE",
    label: "Warehouse",
  },
  {
    value: "PROJECT_SITE",
    label: "Project Site",
  },
  {
    value: "CLIENT_SITE",
    label: "Client Site",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

export function AttendanceLocationForm({
  companyId,
  location,
  onClose,
  onSaved,
}: AttendanceLocationFormProps) {
  const [form, setForm] = useState<LocationFormState>(() =>
    getInitialFormState(location),
  );
  const isEditMode = Boolean(location?._id);
  const [isSaving, setIsSaving] = useState(false);

  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const hasSelectedCoordinates =
    form.latitude !== null && form.longitude !== null;

  const mapValue = useMemo<LocationCoordinates>(
    () => ({
      latitude: form.latitude ?? DEFAULT_MAP_CENTER.latitude,

      longitude: form.longitude ?? DEFAULT_MAP_CENTER.longitude,
    }),
    [form.latitude, form.longitude],
  );

  function updateField<K extends keyof LocationFormState>(
    field: K,
    value: LocationFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleMapChange(value: LocationCoordinates) {
    setForm((current) => ({
      ...current,
      latitude: value.latitude,
      longitude: value.longitude,
    }));
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Location services are not supported by this browser.");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));

        setIsGettingLocation(false);

        toast.success("Current location selected.");
      },

      (error) => {
        setIsGettingLocation(false);

        let message = "Unable to access your current location.";

        if (error.code === error.PERMISSION_DENIED) {
          message =
            "Location permission was denied. Please allow location access and try again.";
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Your current location could not be determined.";
        }

        if (error.code === error.TIMEOUT) {
          message = "Location request timed out. Please try again.";
        }

        toast.error(message);
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }

  function handleLocationSearchSelect(result: LocationSearchResult) {
    setForm((current) => ({
      ...current,

      latitude: result.latitude,
      longitude: result.longitude,

      addressLine1: result.address.addressLine1,

      addressLine2: result.address.addressLine2,

      city: result.address.city,

      district: result.address.district,

      state: result.address.state,

      country: result.address.country || current.country,

      postalCode: result.address.postalCode,
    }));

    toast.success("Location selected from search.");
  }

  function validateForm() {
    if (!form.name.trim()) {
      toast.error("Location name is required.");
      return false;
    }

    if (!form.code.trim()) {
      toast.error("Location code is required.");
      return false;
    }

    if (!hasSelectedCoordinates) {
      toast.error(
        "Please select the attendance location on the map or use your current location.",
      );
      return false;
    }

    if (form.geofenceRadiusMeters < 10 || form.geofenceRadiusMeters > 10000) {
      toast.error("Geofence radius must be between 10 and 10000 metres.");
      return false;
    }

    if (form.locationType === "CLIENT_SITE" && !form.clientId.trim()) {
      toast.error("Client is required for a client site.");
      return false;
    }

    return true;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (form.latitude === null || form.longitude === null) {
      return;
    }

    const payload: CreateAttendanceLocationPayload = {
      name: form.name.trim(),

      code: form.code.trim().toUpperCase(),

      description: form.description.trim(),

      locationType: form.locationType,

      clientId:
        form.locationType === "CLIENT_SITE" ? form.clientId.trim() : null,

      address: {
        addressLine1: form.addressLine1.trim(),

        addressLine2: form.addressLine2.trim(),

        city: form.city.trim(),

        district: form.district.trim(),

        state: form.state.trim(),

        country: form.country.trim(),

        postalCode: form.postalCode.trim(),
      },

      latitude: form.latitude,

      longitude: form.longitude,

      geofenceRadiusMeters: form.geofenceRadiusMeters,

      allowCheckIn: form.allowCheckIn,

      allowCheckOut: form.allowCheckOut,

      allowFieldVisit: form.allowFieldVisit,

      isDefault: form.isDefault,

      status: form.status,
    };

    try {
      setIsSaving(true);

      let savedLocation: AttendanceLocation;

      if (isEditMode && location?._id) {
        savedLocation = await attendanceLocationService.update(
          companyId,
          location._id,
          payload,
        );

        toast.success("Attendance location updated successfully.");
      } else {
        savedLocation = await attendanceLocationService.create(
          companyId,
          payload,
        );

        toast.success("Attendance location created successfully.");
      }

      onSaved(savedLocation);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          isEditMode
            ? "Unable to update attendance location."
            : "Unable to create attendance location.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex max-h-[95vh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-w-5xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {isEditMode
                ? "Edit Attendance Location"
                : "Add Attendance Location"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isEditMode
                ? "Update the location, geofence and attendance configuration."
                : "Configure a physical location used for attendance verification."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="space-y-8 p-5 sm:p-6">
            {/* Basic Details */}
            <section>
              <SectionTitle
                title="Location details"
                description="Enter the basic information for this attendance location."
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField label="Location name" required>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    placeholder="Apex Infra Head Office"
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Location code" required>
                  <input
                    value={form.code}
                    onChange={(event) =>
                      updateField("code", event.target.value)
                    }
                    placeholder="HEAD_OFFICE"
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Location type" required>
                  <select
                    value={form.locationType}
                    onChange={(event) =>
                      updateField(
                        "locationType",
                        event.target.value as AttendanceLocationType,
                      )
                    }
                    className={inputClassName}
                  >
                    {LOCATION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Status">
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target.value as AttendanceLocationStatus,
                      )
                    }
                    className={inputClassName}
                  >
                    <option value="ACTIVE">Active</option>

                    <option value="INACTIVE">Inactive</option>
                  </select>
                </FormField>

                {form.locationType === "CLIENT_SITE" ? (
                  <div className="sm:col-span-2">
                    <FormField label="Client ID" required>
                      <input
                        value={form.clientId}
                        onChange={(event) =>
                          updateField("clientId", event.target.value)
                        }
                        placeholder="Client ObjectId"
                        className={inputClassName}
                      />

                      <p className="mt-1.5 text-xs text-slate-400">
                        We&apos;ll replace this with a proper client selector.
                      </p>
                    </FormField>
                  </div>
                ) : null}

                <div className="sm:col-span-2">
                  <FormField label="Description">
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        updateField("description", event.target.value)
                      }
                      rows={3}
                      placeholder="Optional description..."
                      className={`${inputClassName} min-h-24 resize-y py-3`}
                    />
                  </FormField>
                </div>
              </div>
            </section>

            {/* Map */}
            <section>
              <SectionTitle
                title="Location & geofence"
                description="Choose the exact location and define the permitted attendance radius."
              />
              <div className="mt-4">
                <FormField label="Search building or address">
                  <LocationSearch onSelect={handleLocationSearchSelect} />

                  <p className="mt-1.5 text-xs leading-5 text-slate-400">
                    Search for an office, building, project site or address,
                    then adjust the exact position using the map if required.
                  </p>
                </FormField>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {hasSelectedCoordinates ? (
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                      <MapPin className="h-4 w-4" />
                      Location selected
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="h-4 w-4" />
                      No location selected yet
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isGettingLocation}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGettingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Crosshair className="h-4 w-4" />
                  )}
                  Use Current Location
                </button>
              </div>

              <div className="mt-4">
                <AttendanceLocationMap
                  value={mapValue}
                  radiusMeters={form.geofenceRadiusMeters}
                  onChange={handleMapChange}
                  height="360px"
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <FormField label="Latitude">
                  <input
                    type="number"
                    step="any"
                    min={-90}
                    max={90}
                    value={form.latitude ?? ""}
                    onChange={(event) =>
                      updateField(
                        "latitude",
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                      )
                    }
                    placeholder="12.9715987"
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Longitude">
                  <input
                    type="number"
                    step="any"
                    min={-180}
                    max={180}
                    value={form.longitude ?? ""}
                    onChange={(event) =>
                      updateField(
                        "longitude",
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                      )
                    }
                    placeholder="77.594566"
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Geofence radius" required>
                  <div className="relative">
                    <input
                      type="number"
                      min={10}
                      max={10000}
                      value={form.geofenceRadiusMeters}
                      onChange={(event) =>
                        updateField(
                          "geofenceRadiusMeters",
                          Number(event.target.value),
                        )
                      }
                      className={`${inputClassName} pr-16`}
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      metres
                    </span>
                  </div>
                </FormField>
              </div>
            </section>

            {/* Address */}
            <section>
              <SectionTitle
                title="Address"
                description="Add a human-readable address for administrators and reports."
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField label="Address line 1">
                  <input
                    value={form.addressLine1}
                    onChange={(event) =>
                      updateField("addressLine1", event.target.value)
                    }
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Address line 2">
                  <input
                    value={form.addressLine2}
                    onChange={(event) =>
                      updateField("addressLine2", event.target.value)
                    }
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="City">
                  <input
                    value={form.city}
                    onChange={(event) =>
                      updateField("city", event.target.value)
                    }
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="District">
                  <input
                    value={form.district}
                    onChange={(event) =>
                      updateField("district", event.target.value)
                    }
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="State">
                  <input
                    value={form.state}
                    onChange={(event) =>
                      updateField("state", event.target.value)
                    }
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Country">
                  <input
                    value={form.country}
                    onChange={(event) =>
                      updateField("country", event.target.value)
                    }
                    className={inputClassName}
                  />
                </FormField>

                <FormField label="Postal code">
                  <input
                    value={form.postalCode}
                    onChange={(event) =>
                      updateField("postalCode", event.target.value)
                    }
                    className={inputClassName}
                  />
                </FormField>
              </div>
            </section>

            {/* Rules */}
            <section>
              <SectionTitle
                title="Attendance usage"
                description="Choose which attendance actions are allowed at this location."
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ToggleCard
                  label="Allow Check In"
                  description="Employees can check in from this location."
                  checked={form.allowCheckIn}
                  onChange={(checked) => updateField("allowCheckIn", checked)}
                />

                <ToggleCard
                  label="Allow Check Out"
                  description="Employees can check out from this location."
                  checked={form.allowCheckOut}
                  onChange={(checked) => updateField("allowCheckOut", checked)}
                />

                <ToggleCard
                  label="Field Visits"
                  description="Location may be used for field visits."
                  checked={form.allowFieldVisit}
                  onChange={(checked) =>
                    updateField("allowFieldVisit", checked)
                  }
                />

                <ToggleCard
                  label="Default Location"
                  description="Use as the company's default attendance location."
                  checked={form.isDefault}
                  onChange={(checked) => updateField("isDefault", checked)}
                />
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Add Location"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SectionTitleProps {
  title: string;
  description: string;
}

function SectionTitle({ title, description }: SectionTitleProps) {
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>

      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function FormField({ label, required = false, children }: FormFieldProps) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}

        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>

      {children}
    </div>
  );
}

interface ToggleCardProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleCard({
  label,
  description,
  checked,
  onChange,
}: ToggleCardProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300"
      />

      <span>
        <span className="block text-sm font-semibold text-slate-900">
          {label}
        </span>

        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400";
