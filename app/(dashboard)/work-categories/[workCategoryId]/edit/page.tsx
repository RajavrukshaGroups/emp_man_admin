"use client";

import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Tags } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { WorkCategoryForm } from "@/features/work-categories/components/work-category-form";
import { workCategoryService } from "@/features/work-categories/services/workCategory.service";

import type { WorkCategory } from "@/features/work-categories/types/workCategory.types";

import { useAuthStore } from "@/store/auth.store";

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error?.message ??
      "Unable to load work category."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load work category.";
}

export default function EditWorkCategoryPage() {
  const params = useParams<{
    workCategoryId: string;
  }>();

  const company = useAuthStore((state) => state.company);
  const permissions = useAuthStore((state) => state.permissions);

  const canUpdate = permissions.includes("work_category.update");

  const [category, setCategory] = useState<WorkCategory | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const loadCategory = useCallback(async () => {
    if (!company?._id || !params.workCategoryId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const result = await workCategoryService.getWorkCategoryById(
        company._id,
        params.workCategoryId,
      );

      setCategory(result);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, params.workCategoryId]);

  useEffect(() => {
    void loadCategory();
  }, [loadCategory]);

  if (!canUpdate) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <Tags className="mx-auto h-8 w-8 text-slate-400" />

        <h1 className="mt-4 text-xl font-bold text-slate-950">
          Permission denied
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          You do not have permission to update work categories.
        </p>

        <Link
          href="/work-categories"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to work categories
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <Tags className="mx-auto h-8 w-8 text-slate-400" />

        <h1 className="mt-4 text-xl font-bold text-slate-950">
          Work category unavailable
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          The requested work category could not be found.
        </p>

        <Link
          href="/work-categories"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to work categories
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <WorkCategoryForm mode="edit" initialData={category} />
    </div>
  );
}
