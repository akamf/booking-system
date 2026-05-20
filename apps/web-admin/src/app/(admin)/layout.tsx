import type { ReactNode } from 'react';
import { requireAdminSession } from '@/lib/session';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { Providers } from '@/components/providers';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminSession();
  return (
    <Providers>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar displayName={session.displayName} email={session.email} />
          <main className="flex-1 p-8 bg-neutral-50">{children}</main>
        </div>
      </div>
    </Providers>
  );
}
