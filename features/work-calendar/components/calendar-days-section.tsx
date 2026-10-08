"use client";

import {
  CalendarCheck2,
  CalendarPlus,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/axios";

import { workCalendarService } from "../services/work-calendar.service";
import type {
  CreateWorkCalendarDayPayload,
  ResolvedWorkDay,
  UpdateWorkCalendarDayPayload,
  WorkCalendar,
  WorkCalendarDay,
  WorkCalendarDayType,
  WorkCalendarStatus,
} from "../types/work-calendar.types";
/* =========================================================
   TYPES
   ========================================================= */

interface CalendarDaysSectionProps {
  companyId: string;
  calendar: WorkCalendar;
  canManage: boolean;
}

interface DayFormState {
  date: string;
  type: WorkCalendarDayType;
  name: string;
  description: string;
  status: WorkCalendarStatus;
}

/* =========================================================
   CONSTANTS
   ========================================================= */

const DAY_TYPES: Array<{
  value: WorkCalendarDayType;
  label: string;
}> = [
  {
    value: "PUBLIC_HOLIDAY",
    label: "Public Holiday",
  },
  {
    value: "COMPANY_HOLIDAY",
    label: "Company Holiday",
  },
  {
    value: "FESTIVAL_HOLIDAY",
    label: "Festival Holiday",
  },
  {
    value: "SPECIAL_HOLIDAY",
    label: "Special Holiday",
  },
  {
    value: "WORKING_DAY_OVERRIDE",
    label: "Working Day Override",
  },
];

const EMPTY_FORM: DayFormState = {
  date: "",
  type: "PUBLIC_HOLIDAY",
  name: "",
  description: "",
  status: "ACTIVE",
};

/* =========================================================
   COMPONENT
   ========================================================= */

export function CalendarDaysSection({
  companyId,
  calendar,
  canManage,
}: CalendarDaysSectionProps) {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);

  const [month, setMonth] = useState(new Date().getMonth());

  const [resolvedDays, setResolvedDays] = useState<ResolvedWorkDay[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(true);

  const [days, setDays] = useState<WorkCalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<WorkCalendarDay | null>(null);

  const [form, setForm] = useState<DayFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const [isRestoring, setIsRestoring] = useState(false);

  /* =========================================================
     RANGE
     ========================================================= */

  const yearRange = useMemo(
    () => ({
      fromDate: `${year}-01-01`,
      toDate: `${year}-12-31`,
    }),
    [year],
  );

  const monthRange = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    return {
      fromDate: toLogicalDate(firstDay),
      toDate: toLogicalDate(lastDay),
    };
  }, [year, month]);

  /* =========================================================
     LOAD DAYS
     ========================================================= */

  const loadDays = useCallback(async () => {
    try {
      setIsLoading(true);

      const result = await workCalendarService.listDays(
        companyId,
        calendar._id,
        {
          fromDate: yearRange.fromDate,
          toDate: yearRange.toDate,
        },
      );

      setDays(result.items ?? []);
    } catch (error) {
      setDays([]);

      toast.error(
        getApiErrorMessage(
          error,
          "Unable to load holidays and special working days.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [companyId, calendar._id, yearRange.fromDate, yearRange.toDate]);

  const weeklyOffDaysKey = calendar.weeklyOffDays.join(",");

  const loadResolvedMonth = useCallback(async () => {
    try {
      setIsCalendarLoading(true);

      const result = await workCalendarService.resolveRange(
        companyId,
        monthRange.fromDate,
        monthRange.toDate,
      );

      setResolvedDays(result.days ?? []);
    } catch (error) {
      setResolvedDays([]);

      toast.error(
        getApiErrorMessage(
          error,
          "Unable to load resolved company work calendar.",
        ),
      );
    } finally {
      setIsCalendarLoading(false);
    }
  }, [
    companyId,
    calendar._id,
    weeklyOffDaysKey,
    calendar.effectiveFrom,
    calendar.effectiveTo,
    calendar.status,
    monthRange.fromDate,
    monthRange.toDate,
  ]);

  useEffect(() => {
    void loadDays();
  }, [loadDays]);

  useEffect(() => {
    void loadResolvedMonth();
  }, [loadResolvedMonth]);

  /* =========================================================
     MODAL
     ========================================================= */

  const openCreateModal = () => {
    if (!canManage) {
      return;
    }

    setEditingDay(null);

    setForm({
      ...EMPTY_FORM,
      date: `${year}-01-01`,
    });

    setIsModalOpen(true);
  };

  const openEditModal = (day: WorkCalendarDay) => {
    if (!canManage) {
      return;
    }

    setEditingDay(day);

    setForm({
      date: toDateInputValue(day.date),
      type: day.type,
      name: day.name,
      description: day.description ?? "",
      status: day.status,
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingDay(null);
    setForm(EMPTY_FORM);
  };

  /* =========================================================
     SAVE
     ========================================================= */

  const handleSave = async () => {
    if (!canManage) {
      return;
    }

    if (!form.date) {
      toast.error("Date is required.");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Holiday or day name is required.");
      return;
    }

    try {
      setIsSaving(true);

      if (editingDay) {
        const payload: UpdateWorkCalendarDayPayload = {
          type: form.type,
          name: form.name.trim(),
          description: form.description.trim(),
          status: form.status,
        };

        await workCalendarService.updateDay(
          companyId,
          calendar._id,
          editingDay._id,
          payload,
        );

        toast.success("Calendar day updated successfully.");
      } else {
        const payload: CreateWorkCalendarDayPayload = {
          date: form.date,
          type: form.type,
          name: form.name.trim(),
          description: form.description.trim(),
          status: form.status,
        };

        await workCalendarService.createDay(companyId, calendar._id, payload);

        toast.success("Calendar day added successfully.");
      }

      closeModal();

      await Promise.all([loadDays(), loadResolvedMonth()]);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          editingDay
            ? "Unable to update calendar day."
            : "Unable to add calendar day.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreNormalSchedule = async () => {
    if (!canManage || !editingDay) {
      return;
    }

    try {
      setIsRestoring(true);

      await workCalendarService.updateDay(
        companyId,
        calendar._id,
        editingDay._id,
        {
          status: "INACTIVE",
        },
      );

      setIsModalOpen(false);
      setEditingDay(null);
      setForm(EMPTY_FORM);

      await Promise.all([loadDays(), loadResolvedMonth()]);

      toast.success("Normal company schedule restored for this date.");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to restore the normal schedule."),
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const openDateModal = (date: string) => {
    if (!canManage) {
      return;
    }

    const configuredDay = days.find(
      (day) => toDateInputValue(day.date) === date,
    );

    if (configuredDay) {
      openEditModal(configuredDay);
      return;
    }

    setEditingDay(null);

    setForm({
      ...EMPTY_FORM,
      date,
    });

    setIsModalOpen(true);
  };

  /* =========================================================
     UI
     ========================================================= */

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* HEADER */}

        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CalendarRange className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold text-slate-950">
                Holidays & Special Days
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Configure holidays and exceptions to the recurring weekly
                schedule.
              </p>
            </div>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Add Day
            </button>
          )}
        </div>

        {/* TOOLBAR */}

        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="w-full sm:w-44">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Calendar year
            </label>

            <select
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className={inputClassName}
            >
              {buildYearOptions(currentYear).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              void Promise.all([loadDays(), loadResolvedMonth()]);
            }}
            disabled={isLoading || isCalendarLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isLoading || isCalendarLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>

        {/* MONTH CALENDAR */}

        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-slate-950">Monthly Calendar</h3>

              <p className="mt-1 text-sm text-slate-500">
                Select a date to configure a holiday or working-day override.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (month === 0) {
                    setMonth(11);
                    setYear((current) => current - 1);
                  } else {
                    setMonth((current) => current - 1);
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="min-w-40 text-center text-sm font-bold text-slate-900">
                {formatMonthYear(year, month)}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (month === 11) {
                    setMonth(0);
                    setYear((current) => current + 1);
                  } else {
                    setMonth((current) => current + 1);
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {isCalendarLoading ? (
            <div className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200">
              <div className="text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />

                <p className="mt-2 text-sm text-slate-500">
                  Resolving work calendar...
                </p>
              </div>
            </div>
          ) : (
            <MonthlyCalendar
              year={year}
              month={month}
              days={resolvedDays}
              canManage={canManage}
              onDateClick={openDateModal}
            />
          )}

          <CalendarLegend />
        </div>

        {/* CONTENT */}

        {isLoading ? (
          <div className="px-6 py-16 text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />

            <p className="mt-3 text-sm text-slate-500">
              Loading calendar days...
            </p>
          </div>
        ) : days.length === 0 ? (
          <EmptyState canManage={canManage} />
        ) : (
          <div className="divide-y divide-slate-100">
            {days.map((day) => (
              <CalendarDayRow
                key={day._id}
                day={day}
                canManage={canManage}
                onEdit={() => openEditModal(day)}
              />
            ))}
          </div>
        )}

        {!canManage && (
          <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-sm text-slate-600 sm:px-6">
            You have read-only access. Holiday and special-day changes require
            calendar management permission.
          </div>
        )}
      </section>

      {/* MODAL */}

      {isModalOpen && canManage && (
        <CalendarDayModal
          form={form}
          setForm={setForm}
          isEditing={Boolean(editingDay)}
          isSaving={isSaving}
          isRestoring={isRestoring}
          onClose={closeModal}
          onSave={() => void handleSave()}
          onRestore={() => void handleRestoreNormalSchedule()}
        />
      )}
    </>
  );
}

/* =========================================================
   ROW
   ========================================================= */

function CalendarDayRow({
  day,
  canManage,
  onEdit,
}: {
  day: WorkCalendarDay;
  canManage: boolean;
  onEdit: () => void;
}) {
  const isOverride = day.type === "WORKING_DAY_OVERRIDE";

  return (
    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl ${
            isOverride
              ? "bg-emerald-50 text-emerald-700"
              : "bg-blue-50 text-blue-700"
          }`}
        >
          <span className="text-[10px] font-bold uppercase">
            {formatMonth(day.date)}
          </span>

          <span className="text-lg font-bold leading-none">
            {formatDay(day.date)}
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-950">{day.name}</h3>

            <DayTypeBadge type={day.type} />

            <StatusBadge status={day.status} />
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {formatFullDate(day.date)}
          </p>

          {day.description && (
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {day.description}
            </p>
          )}
        </div>
      </div>

      {canManage && (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      )}
    </div>
  );
}

/* =========================================================
   MONTHLY CALENDAR
   ========================================================= */

function MonthlyCalendar({
  year,
  month,
  days,
  canManage,
  onDateClick,
}: {
  year: number;
  month: number;
  days: ResolvedWorkDay[];
  canManage: boolean;
  onDateClick: (date: string) => void;
}) {
  const resolvedMap = useMemo(
    () => new Map(days.map((day) => [day.date.slice(0, 10), day])),
    [days],
  );

  const firstWeekday = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const cells: Array<{
    date: string;
    dayNumber: number;
    resolved: ResolvedWorkDay | undefined;
  } | null> = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }

  for (let dayNumber = 1; dayNumber <= totalDays; dayNumber += 1) {
    const date = toLogicalDate(new Date(year, month, dayNumber));

    cells.push({
      date,
      dayNumber,
      resolved: resolvedMap.get(date),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="px-1 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 bg-slate-200 gap-px">
        {cells.map((cell, index) => {
          if (!cell) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-24 bg-slate-50 sm:min-h-28"
              />
            );
          }

          return (
            <CalendarDateCell
              key={cell.date}
              date={cell.date}
              dayNumber={cell.dayNumber}
              resolved={cell.resolved}
              canManage={canManage}
              onClick={() => onDateClick(cell.date)}
            />
          );
        })}
      </div>
    </div>
  );
}

function CalendarDateCell({
  date,
  dayNumber,
  resolved,
  canManage,
  onClick,
}: {
  date: string;
  dayNumber: number;
  resolved?: ResolvedWorkDay;
  canManage: boolean;
  onClick: () => void;
}) {
  const classification = resolved?.classification;

  const isWeeklyOff = classification === "WEEKLY_OFF";
  const isHoliday = classification === "HOLIDAY";

  const isOverride = resolved?.source === "WORKING_DAY_OVERRIDE";

  const isToday = date === toLogicalDate(new Date());

  let stateClassName = "bg-white";

  if (isOverride) {
    stateClassName = "bg-emerald-50";
  } else if (isHoliday) {
    stateClassName = "bg-blue-50";
  } else if (isWeeklyOff) {
    stateClassName = "bg-amber-50";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canManage}
      className={`relative min-h-24 p-2 text-left transition sm:min-h-28 sm:p-3 ${stateClassName} ${
        canManage
          ? "cursor-pointer hover:ring-2 hover:ring-inset hover:ring-blue-400"
          : "cursor-default"
      } disabled:opacity-100`}
    >
      <div className="flex items-start justify-between">
        <span
          className={`flex h-7 min-w-7 items-center justify-center rounded-full text-sm font-semibold ${
            isToday ? "bg-slate-950 px-2 text-white" : "text-slate-700"
          }`}
        >
          {dayNumber}
        </span>

        {isOverride && <CalendarCheck2 className="h-4 w-4 text-emerald-600" />}
      </div>

      <div className="mt-2 space-y-1">
        {isWeeklyOff && (
          <span className="block truncate text-[11px] font-semibold text-amber-700">
            Weekly Off
          </span>
        )}

        {isHoliday && (
          <>
            <span className="block truncate text-[11px] font-bold text-blue-700">
              {resolved?.name ?? "Holiday"}
            </span>

            {resolved?.holidayType && (
              <span className="hidden truncate text-[10px] text-blue-500 sm:block">
                {formatDayType(resolved.holidayType)}
              </span>
            )}
          </>
        )}

        {isOverride && (
          <span className="block truncate text-[11px] font-bold text-emerald-700">
            {resolved?.name ?? "Working Day"}
          </span>
        )}
      </div>
    </button>
  );
}

function CalendarLegend() {
  return (
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
      <LegendItem
        className="bg-white border border-slate-300"
        label="Working Day"
      />

      <LegendItem
        className="border border-amber-200 bg-amber-100"
        label="Weekly Off"
      />
      <LegendItem
        className="bg-blue-100 border border-blue-200"
        label="Holiday"
      />

      <LegendItem
        className="bg-emerald-100 border border-emerald-200"
        label="Working Day Override"
      />
    </div>
  );
}

function LegendItem({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
      <span className={`h-3 w-3 rounded-sm ${className}`} />
      {label}
    </div>
  );
}

/* =========================================================
   EMPTY
   ========================================================= */

function EmptyState({ canManage }: { canManage: boolean }) {
  return (
    <div className="px-6 py-16 text-center">
      <CalendarPlus className="mx-auto h-10 w-10 text-slate-300" />

      <h3 className="mt-4 font-bold text-slate-950">
        No special days configured
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {canManage
          ? "Add company holidays, public holidays or working-day overrides for this year."
          : "There are no configured holidays or working-day overrides for this year."}
      </p>
    </div>
  );
}

/* =========================================================
   MODAL
   ========================================================= */

function CalendarDayModal({
  form,
  setForm,
  isEditing,
  isSaving,
  isRestoring,
  onClose,
  onSave,
  onRestore,
}: {
  form: DayFormState;
  setForm: React.Dispatch<React.SetStateAction<DayFormState>>;
  isEditing: boolean;
  isSaving: boolean;
  isRestoring: boolean;
  onClose: () => void;
  onSave: () => void;
  onRestore: () => void;
}) {
  const isBusy = isSaving || isRestoring;
  const isWorkingOverride = form.type === "WORKING_DAY_OVERRIDE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {isEditing ? "Edit Calendar Day" : "Add Calendar Day"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure a holiday or override the normal weekly schedule.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* FORM */}

        <div className="space-y-5 p-5 sm:p-6">
          <Field label="Date">
            <input
              type="date"
              value={form.date}
              disabled={isBusy || isEditing}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  date: event.target.value,
                }))
              }
              className={inputClassName}
            />

            {isEditing && (
              <p className="mt-2 text-xs text-slate-500">
                The date cannot be changed for an existing calendar entry.
                Create a new entry for a different date.
              </p>
            )}
          </Field>

          <Field label="Day type">
            <select
              value={form.type}
              disabled={isSaving}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value as WorkCalendarDayType,
                }))
              }
              className={inputClassName}
            >
              {DAY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </Field>

          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              isWorkingOverride
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            {isWorkingOverride
              ? "This date will be treated as a working day even if it normally falls on a weekly off."
              : "This date will be treated as a non-working holiday by Leave and Attendance."}
          </div>

          <Field label="Name">
            <input
              value={form.name}
              disabled={isSaving}
              placeholder={
                isWorkingOverride
                  ? "Example: Special Working Saturday"
                  : "Example: Diwali"
              }
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              className={inputClassName}
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={3}
              value={form.description}
              disabled={isSaving}
              placeholder="Optional description"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className={`${inputClassName} h-auto min-h-24 py-3`}
            />
          </Field>

          <Field label="Status">
            <select
              value={form.status}
              disabled={isSaving}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as WorkCalendarStatus,
                }))
              }
              className={inputClassName}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </Field>
        </div>

        {/* ACTIONS */}

        <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            {isEditing && form.status === "ACTIVE" && (
              <button
                type="button"
                onClick={onRestore}
                disabled={isBusy}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Restore Normal Schedule
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={isBusy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CalendarPlus className="h-4 w-4" />
                  {isEditing ? "Save Changes" : "Add Day"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   BADGES
   ========================================================= */

function DayTypeBadge({ type }: { type: WorkCalendarDayType }) {
  const label = DAY_TYPES.find((item) => item.value === type)?.label ?? type;

  const isOverride = type === "WORKING_DAY_OVERRIDE";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        isOverride
          ? "bg-emerald-50 text-emerald-700"
          : "bg-blue-50 text-blue-700"
      }`}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: WorkCalendarStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        status === "ACTIVE"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {status === "ACTIVE" ? "Active" : "Inactive"}
    </span>
  );
}

/* =========================================================
   FIELD
   ========================================================= */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      {children}
    </label>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function buildYearOptions(currentYear: number) {
  return [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
}

function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

function parseLogicalDate(value: string) {
  const datePart = value.slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
  }).format(parseLogicalDate(value));
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
  }).format(parseLogicalDate(value));
}

function formatFullDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parseLogicalDate(value));
}

function toLogicalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMonthYear(year: number, month: number) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));
}

function formatDayType(type: WorkCalendarDayType) {
  return (
    DAY_TYPES.find((item) => item.value === type)?.label ??
    type.replaceAll("_", " ")
  );
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-600";
