'use client';

import { useState, ReactNode } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

interface AlsonotifyLayoutWrapperProps {
  children: ReactNode;
}

export function AlsonotifyLayoutWrapper({ children }: AlsonotifyLayoutWrapperProps) {
  const [userRole, setUserRole] = useState<'Admin' | 'Manager' | 'Leader' | 'Employee'>('Admin');

  return (
    <div className="w-full h-screen bg-[#F7F7F7] p-5 flex overflow-hidden">
      {/* Desktop: Sidebar + Main Content Layout */}
      <div className="hidden xl:flex xl:gap-5 w-full h-full overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[292px] shrink-0 h-full overflow-y-auto">
          <Sidebar userRole={userRole} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-5 h-full overflow-hidden">
          {/* Header/Taskbar - Fixed Height */}
          <div className="shrink-0">
            <Header userRole={userRole} setUserRole={setUserRole} />
          </div>

          {/* Page Content */}
          {children}
        </div>
      </div>
      
      {/* Mobile/Tablet Fallback - Simple message for now since we focus on Desktop */}
      <div className="xl:hidden flex items-center justify-center w-full h-full text-center p-10">
        <p className="text-xl text-gray-500">Please view on a desktop screen (XL).</p>
      </div>
    </div>
  );
}
