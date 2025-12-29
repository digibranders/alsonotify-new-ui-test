'use client';

import { useState, ReactNode, useMemo } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Topbar';
import { ProfileCompletionBanner } from '../components/common/ProfileCompletionBanner';
import { useUserDetails } from '@/hooks/useUser';
import { getRoleFromUser } from '@/utils/roleUtils';
import { TimerProvider } from '../context/TimerContext';
import { GlobalTimerPlayer } from '../components/layout/GlobalTimerPlayer';
import { usePathname } from 'next/navigation';
import { navPermissionMap } from '@/utils/navUtils';
import { Shield24Regular } from '@fluentui/react-icons';
import { Button } from 'antd';
import Link from 'next/link';

interface AlsonotifyLayoutWrapperProps {
  children: ReactNode;
}

export function AlsonotifyLayoutWrapper({ children }: AlsonotifyLayoutWrapperProps) {
  const { data: userDetailsData } = useUserDetails();

  // Derive role and color using shared utility
  const { userRole, userRoleColor } = useMemo(() => {
    // Handle different API response structures or localStorage fallback if needed
    let user = userDetailsData?.result?.user || userDetailsData?.result;

    // Fallback to localStorage if API data not yet available
    if (!user && typeof window !== 'undefined') {
      try {
        user = JSON.parse(localStorage.getItem("user") || "{}");
      } catch (e) { /* ignore */ }
    }

    return {
      userRole: getRoleFromUser(user || {}),
      userRoleColor: user?.user_employee?.role?.color || user?.role?.color
    };
  }, [userDetailsData]);

  // Extract permissions
  const permissions = useMemo(() => userDetailsData?.result?.access || {}, [userDetailsData]);

  const pathname = usePathname();

  // URL Access Protection Logic
  const accessState = useMemo(() => {
    // Admin always has access
    if (userRole === 'Admin') return { authorized: true };

    // Find if the current path matches any protected resource in navPermissionMap
    const currentPath = pathname || '';
    const protectedResource = Object.entries(navPermissionMap).find(([id, perm]) => {
      // Check for exact match or child route match (e.g. /dashboard/tasks/1 matches /dashboard/tasks)
      const pathToCheck = `/dashboard/${id}`;
      return currentPath === pathToCheck || currentPath.startsWith(`${pathToCheck}/`);
    });

    if (protectedResource) {
      const [id, permissionKey] = protectedResource;
      const hasPermission = permissions?.Navigation?.[permissionKey];

      // If the permission is explicitly false, block access
      if (hasPermission === false) {
        return { authorized: false, resource: id.charAt(0).toUpperCase() + id.slice(1) };
      }
    }

    return { authorized: true };
  }, [pathname, permissions, userRole]);

  const renderContent = () => {
    if (!accessState.authorized) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-[24px] shadow-sm p-8 text-center animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-[#FFF5F5] rounded-full flex items-center justify-center mb-6">
            <Shield24Regular className="w-10 h-10 text-[#FF3B3B]" />
          </div>
          <h2 className="text-[24px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-2">
            Access Restricted
          </h2>
          <p className="text-[15px] text-[#666666] font-['Manrope:Medium',sans-serif] max-w-md mb-8">
            You don't have the necessary permissions to access the <span className="font-['Manrope:Bold',sans-serif] text-[#111111]">{accessState.resource}</span> module. Please contact your administrator if you believe this is an error.
          </p>
          <Link href="/dashboard">
            <Button
              type="primary"
              className="bg-[#111111] hover:bg-black text-white font-['Manrope:SemiBold',sans-serif] h-11 px-8 rounded-full transition-all active:scale-95"
            >
              Back to Dashboard
            </Button>
          </Link>
        </div>
      );
    }

    return children;
  };

  return (
    <TimerProvider>
      <div className="w-full h-screen bg-[#F7F7F7] p-5 flex overflow-hidden">
        {/* Main Layout - Visible on all screens */}
        <div className="flex gap-5 w-full h-full overflow-hidden">
          {/* Left Sidebar - Hidden on mobile, visible on lg+ */}
          <div className="hidden lg:block w-[292px] shrink-0 h-full overflow-y-auto">
            <Sidebar userRole={userRole} permissions={permissions} />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col gap-5 h-full overflow-hidden">
            {/* Header/Taskbar - Fixed Height */}
            <div className="shrink-0">
              <Header userRole={userRole} roleColor={userRoleColor} />
            </div>

            {/* Profile Completion Banner */}
            <ProfileCompletionBanner />

            {/* Page Content */}
            {renderContent()}
          </div>
        </div>
        <GlobalTimerPlayer />
      </div>
    </TimerProvider>
  );
}
