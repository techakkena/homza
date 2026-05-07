'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart2,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/items',     label: 'Items',     icon: Package },
  { href: '/shopping',  label: 'Shopping',  icon: ShoppingCart },
  { href: '/reports',   label: 'Reports',   icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-sidebar-border bg-sidebar shrink-0">

      {/* Brand section — links to home */}
      <Link
        href="/"
        className="flex h-14 items-center gap-2.5 px-4 border-b border-white/15 hover:bg-white/10 transition-colors"
      >
        <div className="p-1 rounded-lg bg-white/20">
          <Home className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-white text-lg tracking-tight">Homza</span>
      </Link>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all',
                active
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white hover:bg-white/10'
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-white" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex md:hidden border-t border-white/15 bg-sidebar">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-semibold transition-colors',
              active ? 'text-white' : 'text-white hover:bg-white/10'
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
