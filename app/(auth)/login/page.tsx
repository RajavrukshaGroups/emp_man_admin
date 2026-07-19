import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
        <div className="mb-7">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
            EMS
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in to manage employees, departments and teams.
          </p>
        </div>

        <LoginForm />
      </div>
    </section>
  );
}
