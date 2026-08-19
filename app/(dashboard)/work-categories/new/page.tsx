"use client";

import { WorkCategoryForm } from "@/features/work-categories/components/work-category-form";

export default function CreateWorkCategoryPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <WorkCategoryForm mode="create" />
    </div>
  );
}
