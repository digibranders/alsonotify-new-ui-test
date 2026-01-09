'use client';

import { AlsonotifyLayoutWrapper } from '../AlsonotifyLayoutWrapper';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AlsonotifyLayoutWrapper>
      {children}
    </AlsonotifyLayoutWrapper>
  );
}
