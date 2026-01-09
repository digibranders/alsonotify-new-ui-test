'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import BrandLogo from '@/assets/images/logo.png';
import {
  Home24Filled,
  People24Filled,
  Handshake24Filled,
  PeopleTeam24Filled,
  Apps24Filled,
  ClipboardTaskListLtr24Filled,
  DocumentMultiple24Filled,
  ChartMultiple24Filled,
  Calendar24Filled,
  WeatherRainShowersDay24Filled,
  Receipt24Filled,
  Sparkle24Filled,
  Notepad24Filled,
  Video24Filled,
  Settings24Filled
} from "@fluentui/react-icons";
import React from "react";

type UserRole = 'Admin' | 'Manager' | 'Leader' | 'Employee';

interface SidebarProps {
  userRole: UserRole;
  permissions?: { Navigation?: Record<string, boolean> };
}

type NavItemConfig = {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
};

import { navPermissionMap } from '@/utils/navUtils';

// Define navItems outside component to avoid recreation
const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'Dashboard',
    icon: <Home24Filled />,
    allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
  },
  {
    id: 'employees',
    path: '/dashboard/employees',
    label: 'Employees',
    icon: <People24Filled />,
    allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
  },
  {
    id: 'partners',
    path: '/dashboard/partners',
    label: 'Partners',
    icon: <Handshake24Filled />,
    allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
  },
  {
    id: 'workspace',
    path: '/dashboard/workspace',
    label: 'Workspace',
    icon: <Apps24Filled />,
    allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
  },
  {
    id: 'requirements',
    path: '/dashboard/requirements',
    label: 'Requirements',
    icon: <PeopleTeam24Filled />,
    allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
  },
  {
    id: 'tasks',
    path: '/dashboard/tasks',
    label: 'Tasks',
    icon: <ClipboardTaskListLtr24Filled />,
    allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
  },
  {
    id: 'reports',
    path: '/dashboard/reports',
    label: 'Reports',
    icon: <DocumentMultiple24Filled />,
    allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
  },
  {
    id: 'workload',
    path: '/dashboard/workload',
    label: 'Workload',
    icon: <ChartMultiple24Filled />,
    allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
  },
  {
    id: 'calendar',
    path: '/dashboard/calendar',
    label: 'Calendar',
    icon: <Calendar24Filled />,
    allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
  },
  {
    id: 'leaves',
    path: '/dashboard/leaves',
    label: 'Leaves',
    icon: <WeatherRainShowersDay24Filled />,
    allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
  },
  {
    id: 'invoices',
    path: '/dashboard/invoices',
    label: 'Invoices',
    icon: <Receipt24Filled />,
    allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
  },
  {
    id: 'notes',
    path: '/dashboard/notes',
    label: 'Notes',
    icon: <Notepad24Filled />,
    allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
  },
];

export const Sidebar = React.memo(function Sidebar({ userRole, permissions }: SidebarProps) {
  const pathname = usePathname();

  const filteredNavItems = React.useMemo(() => NAV_ITEMS.filter(item => {
    const permissionKey = navPermissionMap[item.id];
    const hasPermission = permissions?.Navigation?.[permissionKey];

    // If granular permission is explicitly defined, respect it
    if (hasPermission !== undefined) {
      return hasPermission;
    }

    // Otherwise fallback to role-based access
    return item.allowedRoles.includes(userRole);
  }), [permissions, userRole]);

  const isActive = React.useCallback((path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    // For nested routes, check if pathname starts with the path
    return pathname.startsWith(path);
  }, [pathname]);

  return (
    <div className="bg-white rounded-[24px] p-6 w-full flex flex-col" style={{ height: 'calc(100vh - 40px)' }}>
      {/* Logo */}
      <div className="flex items-center justify-center mb-6">
        <Image
          src={BrandLogo}
          alt="Alsonotify"
          width={120}
          height={29}
          className="h-[29px] w-auto object-contain"
          priority
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-[#EEEEEE] mb-6" />

      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-hide">
        {filteredNavItems.map((item) => (
          <NavItem
            key={item.id}
            href={item.path}
            icon={item.icon}
            label={item.label}
            active={isActive(item.path)}
          />
        ))}
      </nav>


      {/* Premium Card at bottom - Only show for Admin/Manager? Optional, keeping for all for now */}
      <div className="mt-6">
        <PremiumCard />
      </div>
    </div>
  );
});

const NavItem = React.memo(function NavItem({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  const iconColor = active ? '#ff3b3b' : '#434343';
  const iconWithColor = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<any>, { color: iconColor })
    : icon;

  return (
    <Link
      href={href}
      className={`
        relative w-full h-[40px] rounded-full transition-all group shrink-0
        flex items-center gap-4 px-6
        ${active
          ? 'bg-[#FEF3F2] border-2 border-[#ff3b3b]'
          : 'bg-white hover:bg-[#F7F7F7] border-2 border-transparent'
        }
        cursor-pointer outline-none
        no-underline
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {iconWithColor}
      </div>

      {/* Label */}
      <span className={`
        font-['Manrope:SemiBold',sans-serif] text-[14px] leading-normal
        ${active ? 'text-[#ff3b3b]' : 'text-[#434343]'}
      `}>
        {label}
      </span>
    </Link>
  );
});

function PremiumCard() {
  return (
    <div className="w-full">
      <button className="w-full bg-[#ff3b3b] hover:bg-[#e63535] active:bg-[#cc2f2f] text-white font-['Manrope:Bold',sans-serif] text-[14px] px-4 py-3 rounded-full transition-all transform active:scale-[0.98] shadow-sm">
        Upgrade Now
      </button>
    </div>
  );
}
