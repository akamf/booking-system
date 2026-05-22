"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Ban,
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/activities", label: "Activities", icon: Activity },
  { href: "/resources", label: "Resources", icon: BookOpenCheck },
  { href: "/opening-hours", label: "Opening hours", icon: Clock3 },
  { href: "/blocked-times", label: "Blocked times", icon: Ban },
  { href: "/users", label: "Users", icon: Users },
  { href: "/audit", label: "Audit log", icon: ClipboardList },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 h-screen w-20 shrink-0 border-r border-neutral-200 bg-white px-3 py-5 lg:w-72 lg:px-4">
      <div className="mb-6 flex items-center justify-center gap-3 rounded-lg bg-neutral-950 px-3 py-3 text-white lg:justify-start">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-500">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="hidden lg:block">
          <div className="text-sm font-semibold">Sportshallen</div>
          <div className="text-xs text-neutral-300">Operations console</div>
        </div>
      </div>
      <ul className="space-y-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center justify-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors lg:justify-start",
                  active
                    ? "bg-brand-50 text-brand-700 font-semibold"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="absolute bottom-5 left-4 right-4 hidden rounded-lg border border-neutral-200 bg-neutral-50 p-4 lg:block">
        <div className="text-sm font-medium text-neutral-900">
          Booking health
        </div>
        <p className="mt-1 text-xs leading-5 text-neutral-500">
          Review bookings, schedules, and blocked times before families arrive.
        </p>
      </div>
    </nav>
  );
}
