'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const items = [
  { href: '/dashboard',      label: 'Dashboard' },
  { href: '/bookings',       label: 'Bookings' },
  { href: '/activities',     label: 'Activities' },
  { href: '/resources',      label: 'Resources' },
  { href: '/opening-hours',  label: 'Opening hours' },
  { href: '/blocked-times',  label: 'Blocked times' },
  { href: '/users',          label: 'Users' },
  { href: '/audit',          label: 'Audit log' },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="w-56 border-r border-neutral-200 bg-white px-4 py-6 min-h-screen">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">
        Sportshallen
      </div>
      <ul className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'block rounded px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-neutral-700 hover:bg-neutral-100',
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
