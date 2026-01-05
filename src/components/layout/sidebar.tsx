'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  FileCheck,
  Settings,
  LogOut,
  Zap,
  X,
} from 'lucide-react';
import { GlobalSearch } from './global-search';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Kunden', href: '/customers', icon: Users },
  { name: 'Rechnungen', href: '/invoices', icon: FileText },
  { name: 'Angebote', href: '/quotes', icon: FileCheck },
  { name: 'Einstellungen', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleNavClick = () => {
    // Schließe Mobile-Menu nach Navigation
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-72 border-r border-gray-800 bg-gray-950 transition-transform duration-300 ease-in-out',
          // Desktop: immer sichtbar
          'lg:translate-x-0',
          // Mobile: slide-in/out
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo + Close Button */}
          <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
            <Link href="/dashboard" className="flex items-center gap-2" onClick={handleNavClick}>
              <Zap className="h-6 w-6 text-blue-500" />
              <span className="text-xl font-bold text-white">RechnungsBlitz</span>
            </Link>
            {/* Close Button nur auf Mobile */}
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
              aria-label="Menü schließen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Suchleiste */}
          <div className="px-3 py-3 border-b border-gray-800">
            <GlobalSearch onNavigate={onClose} />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.98]',
                    isActive
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-gray-400 hover:bg-gray-800/70 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-gray-800 p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-400 transition-all hover:bg-gray-800/70 hover:text-white active:scale-[0.98]"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Ausloggen</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
