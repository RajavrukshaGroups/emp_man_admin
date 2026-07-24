"use client";

import { useParams } from "next/navigation";

import { EditUserForm } from "@/features/users/components/edit-user-form";

export default function EditUserPage() {
  const params = useParams<{ userId: string }>();

  return <EditUserForm userId={params.userId} />;
}
