'use client';

import { User } from 'lucide-react';

interface HeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function Header({ title, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950 px-6">
      <h1 className="text-xl font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-4">
        {children}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800">
          <User className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </header>
  );
}
