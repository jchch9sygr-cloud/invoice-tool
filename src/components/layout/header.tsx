'use client';

import { User } from 'lucide-react';

interface HeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function Header({ title, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-4">
        {children}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      </div>
    </header>
  );
}
