"use client";

import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ClientForm } from "@/features/clients/components/client-form";
import { clientService } from "@/features/clients/services/client.service";

import type { Client } from "@/features/clients/types/client.types";

import { useAuthStore } from "@/store/auth.store";

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error?.message ??
      "Unable to load client."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load client.";
}

export default function EditClientPage() {
  const params = useParams<{
    clientId: string;
  }>();

  const company = useAuthStore((state) => state.company);
  const permissions = useAuthStore((state) => state.permissions);

  const canUpdate = permissions.includes("client.update");

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadClient = useCallback(async () => {
    if (!company?._id || !params.clientId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const result = await clientService.getClientById(
        company._id,
        params.clientId,
      );

      setClient(result);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [company?._id, params.clientId]);

  useEffect(() => {
    void loadClient();
  }, [loadClient]);

  if (!canUpdate) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <Building2 className="mx-auto h-8 w-8 text-slate-400" />

        <h1 className="mt-4 text-xl font-bold text-slate-950">
          Permission denied
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          You do not have permission to update clients.
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

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <Building2 className="mx-auto h-8 w-8 text-slate-400" />

        <h1 className="mt-4 text-xl font-bold text-slate-950">
          Client unavailable
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          The requested client could not be found.
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
    <div className="mx-auto w-full max-w-6xl">
      <ClientForm mode="edit" initialData={client} />
    </div>
  );
}
