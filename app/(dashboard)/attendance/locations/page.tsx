"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { attendanceLocationService } from "@/features/attendance/services/attendance-location.service";
import { AttendanceLocationForm } from "@/features/attendance/components/locations/attendance-location-form";
import type {
  AttendanceLocation,
  AttendanceLocationListResponse,
} from "@/features/attendance/types/attendance-location.types";
import { getApiErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

export default function AttendanceLocationsPage() {
  const router = useRouter();
  const company = useAuthStore((state) => state.company);

  const permissions = useAuthStore((state) => state.permissions);

  const canManageLocations = permissions.includes("attendance.location_manage");

  useEffect(() => {
    if (!canManageLocations) {
      router.replace("/attendance");
    }
  }, [canManageLocations, router]);

  const [data, setData] = useState<AttendanceLocationListResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);

  const [editingLocation, setEditingLocation] =
    useState<AttendanceLocation | null>(null);

  const loadLocations = useCallback(async () => {
    if (!company?._id || !canManageLocations) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const result = await attendanceLocationService.list(company._id, {
        page: 1,
        limit: 50,
        search: search.trim() || undefined,
      });

      setData(result);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to load attendance locations."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, search, canManageLocations]);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  if (!canManageLocations) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <MapPin className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Attendance Locations
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Configure office, branch, warehouse, project and client locations
              used for attendance verification.
            </p>
          </div>
        </div>

        {canManageLocations ? (
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add Location
          </button>
        ) : null}
      </div>

      {/* Search */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search locations..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={() => void loadLocations()}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </section>

      {/* Content */}
      {isLoading ? (
        <LocationLoadingState />
      ) : !data || data.items.length === 0 ? (
        <EmptyLocationsState />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.items.map((location) => (
            <LocationCard
              key={location._id}
              location={location}
              canManage={canManageLocations}
              onEdit={setEditingLocation}
            />
          ))}
        </div>
      )}

      {canManageLocations && isAddOpen && company?._id ? (
        <AttendanceLocationForm
          companyId={company._id}
          onClose={() => setIsAddOpen(false)}
          onSaved={() => {
            setIsAddOpen(false);

            void loadLocations();
          }}
        />
      ) : null}

      {canManageLocations && editingLocation && company?._id ? (
        <AttendanceLocationForm
          key={editingLocation._id}
          companyId={company._id}
          location={editingLocation}
          onClose={() => setEditingLocation(null)}
          onSaved={() => {
            setEditingLocation(null);

            void loadLocations();
          }}
        />
      ) : null}
    </div>
  );
}

interface LocationCardProps {
  location: AttendanceLocation;
  canManage: boolean;
  onEdit: (location: AttendanceLocation) => void;
}

function LocationCard({ location, canManage, onEdit }: LocationCardProps) {
  const address = [
    location.address?.addressLine1,
    location.address?.city,
    location.address?.state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Building2 className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-slate-950">
                {location.name}
              </h2>

              {location.isDefault ? (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  Default
                </span>
              ) : null}

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  location.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {location.status}
              </span>
            </div>

            <p className="mt-1 text-xs font-medium text-slate-500">
              {location.code} · {location.locationType.replaceAll("_", " ")}
            </p>
          </div>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => onEdit(location)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Edit
          </button>
        ) : null}
      </div>

      {address ? (
        <div className="mt-4 flex items-start gap-2 text-sm text-slate-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

          <span>{address}</span>
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <InfoItem label="Radius" value={`${location.geofenceRadiusMeters}m`} />

        <InfoItem
          label="Check In"
          value={location.allowCheckIn ? "Allowed" : "Disabled"}
        />

        <InfoItem
          label="Check Out"
          value={location.allowCheckOut ? "Allowed" : "Disabled"}
        />

        <InfoItem
          label="Field Visit"
          value={location.allowFieldVisit ? "Allowed" : "Disabled"}
        />
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-500">Coordinates</p>

        <p className="mt-1 break-all text-sm font-medium text-slate-700">
          {location.latitude}, {location.longitude}
        </p>
      </div>
    </article>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function LocationLoadingState() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="h-full rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyLocationsState() {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <MapPin className="h-5 w-5" />
      </div>

      <h2 className="mt-4 text-base font-semibold text-slate-950">
        No attendance locations found
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Add the company&apos;s office, branch, project site or other approved
        attendance locations.
      </p>
    </section>
  );
}
