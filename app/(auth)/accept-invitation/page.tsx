import type { Metadata } from "next";
import { Suspense } from "react";

import { AcceptInvitationForm } from "@/features/auth/components/accept-invitation-form";

export const metadata: Metadata = {
  title: "Accept Invitation",
  description:
    "Create your password to activate your Employee Management account.",
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

export default function AcceptInvitationPage() {
  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
        <div className="mb-7">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
            EMS
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Set up your account
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Welcome to Employee Management. Create a secure password to complete
            your account setup and access your workspace.
          </p>
        </div>

        <Suspense
          fallback={
            <p className="text-sm text-slate-500">Loading invitation form...</p>
          }
        >
          <AcceptInvitationForm />
        </Suspense>
      </div>
    </section>
  );
}
