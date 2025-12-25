'use client';

import { useState, ReactNode, useMemo } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Topbar';
import { ProfileCompletionBanner } from '../components/common/ProfileCompletionBanner';
import { useUserDetails } from '@/hooks/useUser';
import { getRoleFromUser } from '@/utils/roleUtils';

interface AlsonotifyLayoutWrapperProps {
  children: ReactNode;
}

export function AlsonotifyLayoutWrapper({ children }: AlsonotifyLayoutWrapperProps) {
  const { data: userDetailsData } = useUserDetails();

  // Derive role using shared utility
  const userRole = useMemo(() => {
    // Handle different API response structures or localStorage fallback if needed
    let user = userDetailsData?.result?.user || userDetailsData?.result;

    // Fallback to localStorage if API data not yet available
    if (!user && typeof window !== 'undefined') {
      try {
        user = JSON.parse(localStorage.getItem("user") || "{}");
      } catch (e) { /* ignore */ }
    }

    return getRoleFromUser(user || {});
  }, [userDetailsData]);

  return (
    <div className="w-full h-screen bg-[#F7F7F7] p-5 flex overflow-hidden">
      {/* Main Layout - Visible on all screens */}
      <div className="flex gap-5 w-full h-full overflow-hidden">
        {/* Left Sidebar - Hidden on mobile, visible on lg+ */}
        <div className="hidden lg:block w-[292px] shrink-0 h-full overflow-y-auto">
          <Sidebar userRole={userRole} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-5 h-full overflow-hidden">
          {/* Header/Taskbar - Fixed Height */}
          <div className="shrink-0">
            <Header userRole={userRole} />
          </div>

          {/* Profile Completion Banner */}
          <ProfileCompletionBanner />

          {/* Page Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
