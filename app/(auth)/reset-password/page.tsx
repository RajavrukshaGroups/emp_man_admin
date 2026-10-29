
import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Employee Management account.",
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

export default function ResetPasswordPage() {
  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
        <div className="mb-7">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
            EMS
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reset your password
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enter a new password to regain access to your
            Employee Management account.
          </p>
        </div>

        <Suspense
          fallback={
            <p className="text-sm text-slate-500">
              Loading password reset form...
            </p>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </section>
  );
}
