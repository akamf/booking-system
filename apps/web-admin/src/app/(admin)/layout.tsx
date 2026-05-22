import type { ReactNode } from "react";
import { requireAdminSession } from "@/lib/session";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { Providers } from "@/components/providers";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdminSession();
  return (
    <Providers>
      <div className="flex min-h-screen bg-[#f6f7fb]">
        <Sidebar />
        <div className="flex-1 flex min-w-0 flex-col">
          <Topbar displayName={session.displayName} email={session.email} />
          <main className="flex-1 px-6 py-8 lg:px-10">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </Providers>
  );
}
