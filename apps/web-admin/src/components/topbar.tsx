"use client";
import { useRouter } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export function Topbar({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 px-6 backdrop-blur lg:px-10">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4">
        <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500 md:flex">
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            Search lives inside each operational area
          </span>
        </div>
        <div className="lg:hidden">
          <div className="text-sm font-semibold text-neutral-950">
            Sportshallen
          </div>
          <div className="text-xs text-neutral-500">Operations console</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium text-neutral-900">
              {displayName}
            </div>
            <div className="text-xs text-neutral-500">{email}</div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
          <button
            type="button"
            onClick={() => {
              void handleSignOut();
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-colors hover:text-neutral-950"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
