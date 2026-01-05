'use client';

import { useState, createContext, useContext } from 'react';
import { Sidebar } from './sidebar';
import { AutoLogout } from '@/components/auth/auto-logout';

interface MobileMenuContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined);

export function useMobileMenu() {
  const context = useContext(MobileMenuContext);
  if (!context) {
    throw new Error('useMobileMenu must be used within DashboardShell');
  }
  return context;
}

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <MobileMenuContext.Provider value={{ isOpen, open, close, toggle }}>
      <AutoLogout />
      <div className="min-h-screen bg-gray-950">
        <Sidebar isOpen={isOpen} onClose={close} />
        {/* Main Content - responsive margin */}
        <main className="min-h-screen lg:ml-72">
          {children}
        </main>
      </div>
    </MobileMenuContext.Provider>
  );
}
