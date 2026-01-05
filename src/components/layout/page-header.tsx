'use client';

import { useMobileMenu } from './dashboard-shell';
import { Header } from './header';

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  const { open } = useMobileMenu();

  return (
    <Header title={title} onMenuClick={open}>
      {children}
    </Header>
  );
}
