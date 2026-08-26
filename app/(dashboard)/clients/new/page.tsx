"use client";

import { ClientForm } from "@/features/clients/components/client-form";

export default function CreateClientPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <ClientForm mode="create" />
    </div>
  );
}
