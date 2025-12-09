'use client';

import { usePathname, useRouter } from 'next/navigation';
// import alsonotifyLogo from "figma:asset/ee55d04bda35eb248f7697579ebb8072daa6fa8b.png"; // Removed
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
  Settings24Filled
} from "@fluentui/react-icons";
import React from "react";

type UserRole = 'Admin' | 'Manager' | 'Leader' | 'Employee';

interface SidebarProps {
  userRole: UserRole;
}

type NavItemConfig = {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
};

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      path: '/dashboard',
      label: 'Dashboard',
      icon: <Home24Filled />,
      allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
    },
    {
      id: 'employees',
      path: '/employees',
      label: 'Employees',
      icon: <People24Filled />,
      allowedRoles: ['Admin', 'Manager', 'Leader']
    },
    {
      id: 'clients',
      path: '/clients',
      label: 'Clients',
      icon: <Handshake24Filled />,
      allowedRoles: ['Admin', 'Manager']
    },
    {
      id: 'requirements',
      path: '/requirements',
      label: 'Requirements',
      icon: <PeopleTeam24Filled />,
      allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
    },
    {
      id: 'workspace',
      path: '/workspaces',
      label: 'Workspace',
      icon: <Apps24Filled />,
      allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
    },
    {
      id: 'tasks',
      path: '/tasks',
      label: 'Tasks',
      icon: <ClipboardTaskListLtr24Filled />,
      allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
    },
    {
      id: 'reports',
      path: '/reports',
      label: 'Reports',
      icon: <DocumentMultiple24Filled />,
      allowedRoles: ['Admin', 'Manager']
    },
    {
      id: 'workload',
      path: '/workload',
      label: 'Workload',
      icon: <ChartMultiple24Filled />,
      allowedRoles: ['Admin', 'Manager', 'Leader']
    },
    {
      id: 'calendar',
      path: '/calendar',
      label: 'Calendar',
      icon: <Calendar24Filled />,
      allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
    },
    {
      id: 'leaves',
      path: '/leaves',
      label: 'Leaves',
      icon: <WeatherRainShowersDay24Filled />,
      allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
    },
    {
      id: 'invoices',
      path: '/invoices',
      label: 'Invoices',
      icon: <Receipt24Filled />,
      allowedRoles: ['Admin']
    },
    {
      id: 'notes',
      path: '/notes',
      label: 'Notes',
      icon: <Notepad24Filled />,
      allowedRoles: ['Admin', 'Manager', 'Leader', 'Employee']
    },
  ];

  const filteredNavItems = navItems.filter(item => item.allowedRoles.includes(userRole));

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/') return true;
    if (path === '/workspaces' && pathname.includes('/workspaces')) return true;
    return pathname.startsWith(path);
  };

  return (
    <div className="bg-white rounded-[24px] p-6 w-full flex flex-col" style={{ height: 'calc(100vh - 40px)' }}>
      {/* Logo */}
      <div className="flex items-center justify-center mb-6">
        {/* <Image src="/placeholder-logo.png" alt="Alsonotify" width={120} height={29} className="h-[29px] w-auto object-contain" /> */}
        <span className="text-xl font-bold">AlsoNotify</span>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#EEEEEE] mb-6" />

      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-1 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={isActive(item.path)}
            onClick={() => router.push(item.path)}
          />
        ))}
      </nav>


      {/* Premium Card at bottom - Only show for Admin/Manager? Optional, keeping for all for now */}
      <div className="mt-6">
        <PremiumCard />
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  const iconColor = active ? '#ff3b3b' : '#434343';
  const iconWithColor = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<any>, { color: iconColor })
    : icon;

  return (
    <div className="relative w-full cursor-pointer group shrink-0" onClick={onClick}>
      {/* Background */}
      <div className={`
        h-[40px] rounded-full w-full transition-all
        ${active
          ? 'bg-[#FEF3F2] border-2 border-[#ff3b3b]'
          : 'bg-white group-hover:bg-[#F7F7F7]'
        }
      `} />

      {/* Icon */}
      <div className="absolute left-[24px] top-1/2 -translate-y-1/2">
        {iconWithColor}
      </div>

      {/* Label */}
      <div className={`
        absolute left-[56px] top-1/2 -translate-y-1/2
        font-['Manrope:SemiBold',sans-serif] text-[14px]
        ${active ? 'text-[#ff3b3b]' : 'text-[#434343]'}
      `}>
        <p className="leading-[normal] whitespace-pre">{label}</p>
      </div>
    </div>
  );
}

function PremiumCard() {
  return (
    <div className="relative w-full overflow-hidden rounded-[16px] bg-gradient-to-br from-[#ff3b3b] via-[#cc2f2f] to-[#1a0000]">
      {/* Decorative accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20" />

      <div className="p-6 flex flex-col gap-4">
        {/* Icon and Badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkle24Filled className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
              <span className="text-[10px] font-['Manrope:Bold',sans-serif] text-white uppercase tracking-wide">
                Pro
              </span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-[16px] font-['Manrope:Bold',sans-serif] text-white leading-tight">
            Upgrade to Premium
          </h3>
        </div>

        {/* CTA Button */}
        <button className="w-full bg-white hover:bg-white/90 active:bg-white/80 text-[#ff3b3b] font-['Manrope:Bold',sans-serif] text-[14px] px-4 py-2.5 rounded-full transition-all transform active:scale-[0.98] shadow-lg shadow-black/30">
          Upgrade Now
        </button>
      </div>
    </div>
  );
}
