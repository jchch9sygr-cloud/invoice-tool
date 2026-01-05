'use client';

import { User, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  children?: React.ReactNode;
  onMenuClick?: () => void;
}

export function Header({ title, children, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-800 bg-gray-950 px-4 sm:h-16 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu - nur auf Mobile */}
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
          aria-label="Menü öffnen"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-white sm:text-xl">{title}</h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Action Buttons - responsive */}
        <div className="flex items-center gap-2">
          {children}
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 sm:h-9 sm:w-9">
          <User className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </header>
  );
}
