import { Suspense } from "react";
import { SignInForm } from "@/features/auth/sign-in-form";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/10 md:grid-cols-[1fr_0.85fr]">
        <section className="bg-neutral-950 p-8 text-white">
          <div className="inline-flex rounded-md bg-brand-500 px-3 py-2 text-sm font-semibold">
            Sportshallen
          </div>
          <h1 className="mt-10 text-3xl font-semibold tracking-tight">
            Operations console
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-300">
            Manage bookings, resources, opening hours, and staff actions from
            one focused workspace.
          </p>
          <div className="mt-10 grid gap-3 text-sm text-neutral-300">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              Live booking overview
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              Resource and schedule control
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              Audit-backed changes
            </div>
          </div>
        </section>
        <section className="p-8">
          <h2 className="text-xl font-semibold text-neutral-950">Sign in</h2>
          <p className="mb-6 mt-1 text-sm text-neutral-500">
            Use your staff email to continue.
          </p>
          <Suspense>
            <SignInForm />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
