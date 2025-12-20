'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AccessBadge } from '../ui/AccessBadge';
import Image from 'next/image';
import { Button, Dropdown, Modal, Input, Select, Popover, Avatar, Badge, Typography, App } from 'antd';
import type { MenuProps } from 'antd';
import {
  Alert24Filled,
  Add24Filled,
  PeopleTeam24Filled,
  Apps24Filled,
  ClipboardTaskListLtr24Filled,
  People24Filled,
  Handshake24Filled,
  Receipt24Filled,
  Calendar24Filled,
  Notepad24Filled
} from '@fluentui/react-icons';
import { UserCog, Settings, LogOut, FolderOpen, CheckSquare, FileText } from 'lucide-react';
import { TaskForm } from '../modals/TaskForm';
import { NotificationPanel } from './NotificationPanel';
import { useUserDetails } from '@/hooks/useUser';
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '@/hooks/useNotification';
import { useWorkspaces, useClients } from '@/hooks/useWorkspace';
import { useEmployees } from '@/hooks/useUser';
import { searchUsersByName } from '@/services/user';
import { getRequirementsDropdownByWorkspaceId } from '@/services/workspace';
import { useCreateWorkspace } from '@/hooks/useWorkspace';
import { useCreateTask } from '@/hooks/useTask';
import { useCreateRequirement } from '@/hooks/useWorkspace';
import { useLogout } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

type UserRole = 'Admin' | 'Manager' | 'Leader' | 'Employee';

interface HeaderProps {
  userRole?: UserRole;
  setUserRole?: (role: UserRole) => void;
}

// Helper function to get greeting based on local time
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

export function Header({ userRole = 'Admin', setUserRole }: HeaderProps) {
  const router = useRouter();
  const handleLogout = useLogout();
  const { message } = App.useApp();

  // Fetch user details
  const { data: userDetailsData } = useUserDetails();

  // Fetch notifications
  const { data: notificationsData, isLoading: isLoadingNotifications } = useNotifications();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const markReadMutation = useMarkNotificationRead();

  // Fetch data for dialogs
  const { data: workspacesData } = useWorkspaces();
  const { data: clientsData } = useClients();
  const { data: employeesData } = useEmployees();
  const [usersDropdown, setUsersDropdown] = useState<Array<{ id: number; name: string }>>([]);
  const [requirementsDropdown, setRequirementsDropdown] = useState<Array<{ id: number; name: string }>>([]);

  // Dialogs state
  const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showRequirementDialog, setShowRequirementDialog] = useState(false);

  // Mutations
  const createWorkspaceMutation = useCreateWorkspace();
  const createTaskMutation = useCreateTask();
  const createRequirementMutation = useCreateRequirement();

  // Form States
  const [newWorkspace, setNewWorkspace] = useState({ name: '', client: '', description: '', lead: '' });
  const [newRequirement, setNewRequirement] = useState({ title: '', workspace: '', type: '', priority: '', category: '', dueDate: '', description: '' });

  // Get user data from localStorage or backend
  const user = useMemo(() => {
    try {
      if (typeof window !== 'undefined') {
        const localUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (localUser && localUser.name) {
          return localUser;
        }
      }
    } catch (error) {
      console.error("Error reading user from localStorage:", error);
    }
    const apiUser = userDetailsData?.result?.user || userDetailsData?.result || {};
    return apiUser;
  }, [userDetailsData]);

  // Extract first name from user data
  const firstName = useMemo(() => {
    const userProfile = user?.user_profile || userDetailsData?.result?.user?.user_profile;
    if (userProfile?.first_name) {
      return userProfile.first_name;
    }
    if (user?.first_name) {
      return user.first_name;
    }
    if (user?.name) {
      return user.name.split(' ')[0] || user.name;
    }
    return 'User';
  }, [user, userDetailsData]);

  // Helper to map role_id to access level (same as EmployeesPage)
  const mapRoleIdToAccess = (roleId: number | null | undefined): UserRole => {
    if (!roleId) return 'Employee';

    // Reverse mapping: role_id -> access level
    // Based on seed data order: Super Admin (1), Employee (2), HR (3), Admin (4), Leader (5), Finance (6), Manager (7)
    const roleIdMapping: Record<number, UserRole> = {
      1: 'Admin',   // Super Admin -> Admin
      2: 'Employee', // Employee -> Employee
      3: 'Employee', // HR -> Employee
      4: 'Admin',   // Admin -> Admin
      5: 'Leader', // Leader -> Leader
      6: 'Employee', // Finance -> Employee
      7: 'Manager', // Manager -> Manager
    };

    return roleIdMapping[roleId] || 'Employee';
  };

  // Map role from backend to UI role
  const mappedRole: UserRole = useMemo(() => {
    // First try to get role_id from various sources
    const roleId = user?.role_id ||
      user?.user_employee?.role_id ||
      userDetailsData?.result?.user?.role_id ||
      userDetailsData?.result?.user?.user_employee?.role_id ||
      null;

    // If we have role_id, use it for mapping
    if (roleId) {
      return mapRoleIdToAccess(roleId);
    }

    // Fallback to role name if available
    const roleName = user?.role?.name || user?.user_employee?.role?.name;
    if (roleName) {
      const roleLower = roleName.toLowerCase();
      if (roleLower.includes('admin')) return 'Admin';
      if (roleLower.includes('manager')) return 'Manager';
      if (roleLower.includes('leader')) return 'Leader';
    }

    return 'Employee';
  }, [user, userDetailsData]);

  // Get greeting based on local time
  const greeting = useMemo(() => getGreeting(), []);

  // Fetch users and requirements for dropdowns
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await searchUsersByName();
        if (response.success) {
          const transformed = (response.result || []).map((item: any) => ({
            id: item.value || item.id,
            name: item.label || item.name,
          }));
          setUsersDropdown(transformed);
        }
      } catch (error) {
        message.error('Failed to fetch users');
      }
    };
    fetchUsers();
  }, [message]);

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        if (!workspacesData?.result?.projects) return;
        const allRequirements: Array<{ id: number; name: string }> = [];

        for (const workspace of workspacesData.result.projects) {
          try {
            const response = await getRequirementsDropdownByWorkspaceId(workspace.id);
            if (response.success && response.result) {
              allRequirements.push(...response.result);
            }
          } catch (error) {
            console.error(`Failed to fetch requirements for workspace ${workspace.id}:`, error);
          }
        }
        setRequirementsDropdown(allRequirements);
      } catch (error) {
        message.error('Failed to fetch requirements');
      }
    };
    fetchRequirements();
  }, [workspacesData, message]);

  // Transform notifications
  const notifications = useMemo(() => {
    if (!notificationsData?.result) return [];
    return notificationsData.result.map((n: any) => ({
      id: n.id,
      title: n.title || n.message || 'Notification',
      message: n.message || n.title || '',
      time: n.created_at
        ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true })
        : 'Just now',
      unread: !n.is_read,
      type: n.type || 'general',
    }));
  }, [notificationsData]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAsRead = (id: number) => {
    markReadMutation.mutate(id);
  };

  const handleClearAllNotifications = () => {
    markAllReadMutation.mutate();
  };

  // Handle workspace creation
  const handleCreateWorkspace = async () => {
    if (!newWorkspace.name) {
      message.error("Workspace name is required");
      return;
    }

    const selectedClient = clientsData?.result?.find((c: any) => c.name === newWorkspace.client || c.company === newWorkspace.client);
    const selectedLead = employeesData?.result?.find((emp: any) =>
      String(emp.user_id || emp.id) === newWorkspace.lead
    );

    createWorkspaceMutation.mutate(
      {
        name: newWorkspace.name,
        description: newWorkspace.description || '',
        client_id: selectedClient?.id || selectedClient?.association_id || null,
        manager_id: selectedLead?.user_id || selectedLead?.id || null,
        leader_id: selectedLead?.user_id || selectedLead?.id || null,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        document_link: '',
        high_priority: false,
        in_house: true,
      } as any,
      {
        onSuccess: () => {
          message.success("Workspace created successfully!");
          setShowWorkspaceDialog(false);
          setNewWorkspace({ name: '', client: '', description: '', lead: '' });
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || "Failed to create workspace";
          message.error(errorMessage);
        },
      }
    );
  };

  // Handle requirement creation
  const handleCreateRequirement = async () => {
    if (!newRequirement.title) {
      message.error("Requirement title is required");
      return;
    }

    const selectedWorkspace = workspacesData?.result?.projects?.find(
      (w: any) => w.name === newRequirement.workspace || String(w.id) === newRequirement.workspace
    );

    if (!selectedWorkspace) {
      message.error("Please select a workspace");
      return;
    }

    createRequirementMutation.mutate(
      {
        project_id: selectedWorkspace.id,
        name: newRequirement.title,
        description: newRequirement.description || '',
        start_date: new Date().toISOString(),
        end_date: newRequirement.dueDate ? new Date(newRequirement.dueDate).toISOString() : undefined,
        status: 'Assigned',
        priority: newRequirement.priority?.toUpperCase() || 'MEDIUM',
        high_priority: newRequirement.priority === 'high',
      } as any,
      {
        onSuccess: () => {
          message.success("Requirement created successfully!");
          setShowRequirementDialog(false);
          setNewRequirement({ title: '', workspace: '', type: '', priority: '', category: '', dueDate: '', description: '' });
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || "Failed to create requirement";
          message.error(errorMessage);
        },
      }
    );
  };

  // Dropdown Items Configuration
  const addMenuItems: MenuProps['items'] = [
    {
      key: 'create-new',
      type: 'group',
      label: <span className="text-[11px] text-[#999999] uppercase tracking-wider font-['Manrope:Medium',sans-serif]">Create New</span>,
      children: [
        {
          key: 'req',
          label: 'Requirement',
          icon: <PeopleTeam24Filled className="w-4 h-4" />,
          onClick: () => setShowRequirementDialog(true),
          className: "font-['Manrope:Medium',sans-serif]"
        },
        {
          key: 'workspace',
          label: 'Workspace',
          icon: <Apps24Filled className="w-4 h-4" />,
          onClick: () => setShowWorkspaceDialog(true),
          className: "font-['Manrope:Medium',sans-serif]"
        },
        {
          key: 'task',
          label: 'Task',
          icon: <ClipboardTaskListLtr24Filled className="w-4 h-4" />,
          onClick: () => setShowTaskDialog(true),
          className: "font-['Manrope:Medium',sans-serif]"
        },
      ],
    },
    { type: 'divider' },
    {
      key: 'people',
      type: 'group',
      label: <span className="text-[11px] text-[#999999] uppercase tracking-wider font-['Manrope:Medium',sans-serif]">People</span>,
      children: [
        {
          key: 'employee',
          label: 'Employee',
          icon: <People24Filled className="w-4 h-4" />,
          onClick: () => router.push('/dashboard/employees'),
          className: "font-['Manrope:Medium',sans-serif]"
        },
        {
          key: 'client',
          label: 'Client',
          icon: <Handshake24Filled className="w-4 h-4" />,
          onClick: () => router.push('/dashboard/clients'),
          className: "font-['Manrope:Medium',sans-serif]"
        },
      ],
    },
    { type: 'divider' },
    {
      key: 'finance',
      type: 'group',
      label: <span className="text-[11px] text-[#999999] uppercase tracking-wider font-['Manrope:Medium',sans-serif]">Finance</span>,
      children: [
        {
          key: 'invoice',
          label: 'Invoice',
          icon: <Receipt24Filled className="w-4 h-4" />,
          onClick: () => router.push('/dashboard/invoices'),
          className: "font-['Manrope:Medium',sans-serif]"
        },
      ],
    },
    { type: 'divider' },
    {
      key: 'quick',
      type: 'group',
      label: <span className="text-[11px] text-[#999999] uppercase tracking-wider font-['Manrope:Medium',sans-serif]">Quick Actions</span>,
      children: [
        {
          key: 'calendar',
          label: 'Schedule Meeting',
          icon: <Calendar24Filled className="w-4 h-4" />,
          onClick: () => router.push('/dashboard/calendar'),
          className: "font-['Manrope:Medium',sans-serif]"
        },
        {
          key: 'notes',
          label: 'Add Note',
          icon: <Notepad24Filled className="w-4 h-4" />,
          onClick: () => router.push('/dashboard/todo'),
          className: "font-['Manrope:Medium',sans-serif]"
        },
      ],
    },
  ];

  const profileMenuItems: MenuProps['items'] = [
    {
      key: 'account',
      type: 'group',
      label: <span className="text-[#111111] font-bold font-['Manrope:Bold',sans-serif] text-[14px]">My Account</span>,
      children: [
        {
          key: 'settings',
          label: 'Settings',
          icon: <Settings className="w-4 h-4" />,
          onClick: () => router.push('/dashboard/settings'),
        },
        {
          key: 'profile',
          label: 'Profile',
          icon: <UserCog className="w-4 h-4" />,
          onClick: () => router.push('/dashboard/profile'),
        },
      ],
    },
    { type: 'divider' },
    {
      key: 'switch',
      type: 'group',
      label: 'Switch View (Demo)',
      children: (['Admin', 'Manager', 'Leader', 'Employee'] as const).map((role) => ({
        key: role.toLowerCase(),
        label: (
          <div className="flex justify-between items-center w-full min-w-[100px] gap-3">
            <span>{role}</span>
            <div className="h-5 flex items-center justify-center">
              {(mappedRole || userRole) === role ? (
                <CheckSquare className="w-4 h-4 text-[#ff3b3b]" />
              ) : (
                <div className="w-4 h-4" />
              )}
            </div>
          </div>
        ),
        onClick: () => setUserRole?.(role),
      })),
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: 'Log out',
      icon: <LogOut className="w-4 h-4" />,
      danger: true,
      onClick: handleLogout,
    },
  ];


  return (
    <>
      <div className="bg-white rounded-full p-4 w-full">
        <div className="flex flex-row items-center justify-between w-full">
          {/* Left: Greeting text */}
          <div className="flex flex-col font-['Manrope:Regular',sans-serif] font-normal justify-center not-italic text-[#111111] text-nowrap">
            <div className="flex items-center gap-3">
              <p className="leading-[normal] text-[20px] whitespace-pre">
                <span className="font-['Manrope:Regular',sans-serif]">{`👋 ${greeting}! `}</span>
                <span className="font-['Manrope:Bold',sans-serif]">{firstName}</span>
              </p>
              <AccessBadge role={mappedRole || userRole} />
            </div>
          </div>

          {/* Right: CTAs, icons & profile section */}
          <div className="flex flex-row gap-6 items-center">
            {/* Add Button with Dropdown */}
            <Dropdown menu={{ items: addMenuItems }} placement="bottomRight" trigger={['click']}>
              <Button
                className="!w-10 !h-10 !min-w-[40px] rounded-full !bg-[#ff3b3b] hover:!bg-[#ff6b6b] flex items-center justify-center p-0 !border-none !shadow-none"
                type="primary"
                shape="circle"
                icon={<Add24Filled className="w-5 h-5 text-white" />}
              />
            </Dropdown>

            {/* Notification icon */}
            <Popover
              content={
                <NotificationPanel
                  notifications={notifications}
                  isLoading={isLoadingNotifications}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllRead={handleClearAllNotifications}
                />
              }
              trigger="click"
              placement="bottomRight"
              styles={{ root: { padding: 0 } }}
              overlayClassName="notification-popover"
            >
              <Badge count={unreadCount} size="small" offset={[-5, 5]} color="#ff3b3b">
                <Button
                  type="text"
                  shape="circle"
                  icon={<Alert24Filled className="w-6 h-6 text-[#000000]" />}
                  className="hover:bg-transparent"
                />
              </Badge>
            </Popover>

            {/* Profile photo & Role Switcher */}
            <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight" trigger={['click']}>
              <div className="relative shrink-0 size-[40px] rounded-full ring-2 ring-transparent hover:ring-[#ff3b3b]/20 transition-all cursor-pointer">
                <Avatar
                  size={40}
                  // src={user?.user_profile?.profile_pic || user?.profile_pic || "https://github.com/shadcn.png"}
                  src={user?.user_profile?.profile_pic || user?.profile_pic || "/documents/profile.png"}
                  alt={user?.name || 'User'}
                />
              </div>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Workspace Modal */}
      <Modal
        open={showWorkspaceDialog}
        onCancel={() => setShowWorkspaceDialog(false)}
        footer={null}
        width={600}
        centered
        className="rounded-[16px] overflow-hidden"
        styles={{
          body: {
            padding: 0,
          }
        }}
      >
        <div className="flex flex-col h-full bg-white">
          {/* Fixed Header */}
          <div className="flex-shrink-0 border-b border-[#EEEEEE] px-6 py-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                <div className="p-2 rounded-full bg-[#F7F7F7]">
                  <FolderOpen className="w-5 h-5 text-[#666666]" />
                </div>
                Create Workspace
              </div>
            </div>
            <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-11">
              Create a new workspace to organize tasks and requirements.
            </p>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Workspace Name</span>
                <Input
                  placeholder="e.g. Website Redesign"
                  className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${newWorkspace.name ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                  value={newWorkspace.name}
                  onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Client</span>
                <Select
                  className={`w-full h-11 employee-form-select ${newWorkspace.client ? 'employee-form-select-filled' : ''}`}
                  placeholder="Select client"
                  value={newWorkspace.client || undefined}
                  onChange={(v) => setNewWorkspace({ ...newWorkspace, client: String(v) })}
                  suffixIcon={<div className="text-gray-400">⌄</div>}
                >
                  {clientsData?.result && clientsData.result.length > 0 ? (
                    clientsData.result.map((client: any) => (
                      <Option key={String(client.id || client.association_id || '')} value={String(client.name || client.company || '')}>
                        {client.name || client.company}
                      </Option>
                    ))
                  ) : (
                    <Option value="none" disabled>No clients available</Option>
                  )}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Project Lead</span>
                <Select
                  className={`w-full h-11 employee-form-select ${newWorkspace.lead ? 'employee-form-select-filled' : ''}`}
                  placeholder="Select lead"
                  value={newWorkspace.lead || undefined}
                  onChange={(v) => setNewWorkspace({ ...newWorkspace, lead: String(v) })}
                  suffixIcon={<div className="text-gray-400">⌄</div>}
                >
                  {employeesData?.result && employeesData.result.length > 0 ? (
                    employeesData.result.map((emp: any) => (
                      <Option key={String(emp.user_id || emp.id || '')} value={String(emp.user_id || emp.id || '')}>
                        {emp.name}
                      </Option>
                    ))
                  ) : (
                    <Option value="none" disabled>No employees available</Option>
                  )}
                </Select>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Description</span>
              <TextArea
                placeholder="Describe your workspace..."
                className={`font-['Manrope:Regular',sans-serif] rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] ${newWorkspace.description ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                rows={4}
                value={newWorkspace.description}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
              />
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 border-t border-[#EEEEEE] px-6 py-6 flex items-center justify-end bg-white gap-3">
            <Button
              type="text"
              onClick={() => setNewWorkspace({ name: '', client: '', description: '', lead: '' })}
              className="h-10 px-4 font-['Manrope:SemiBold',sans-serif] text-[#666666]"
            >
              Reset Data
            </Button>
            <Button
              type="primary"
              onClick={handleCreateWorkspace}
              loading={createWorkspaceMutation.isPending}
              className="h-10 px-6 rounded-lg bg-[#111111] hover:bg-[#000000] text-white font-['Manrope:SemiBold',sans-serif] border-none"
            >
              Create Workspace
            </Button>
          </div>
        </div>
      </Modal>

      {/* Task Modal */}
      <Modal
        open={showTaskDialog}
        onCancel={() => setShowTaskDialog(false)}
        footer={null}
        width={600}
        centered
        className="rounded-[16px] overflow-hidden"
        styles={{
          body: {
            padding: 0,
          }
        }}
      >
        <TaskForm
          onSubmit={(data) => {
            if (!data.start_date) {
              message.error("Start Date is required");
              return;
            }
            const formattedData = {
              ...data,
              start_date: data.start_date,
            };
            createTaskMutation.mutate(formattedData as any, {
              onSuccess: () => {
                setShowTaskDialog(false);
                message.success("Task created successfully");
              },
              onError: (error: any) => {
                const errorMessage = error?.response?.data?.message || error?.message || "Failed to create task";
                message.error(errorMessage);
              }
            });
          }}
          onCancel={() => setShowTaskDialog(false)}
          users={usersDropdown}
          requirements={requirementsDropdown}
          workspaces={workspacesData?.result?.projects?.map((p: any) => ({ id: p.id, name: p.name })) || []}
        />
      </Modal>

      {/* Requirement Modal */}
      <Modal
        open={showRequirementDialog}
        onCancel={() => setShowRequirementDialog(false)}
        footer={null}
        width={600}
        centered
        className="rounded-[16px] overflow-hidden"
        styles={{
          body: {
            padding: 0,
          }
        }}
      >
        <div className="flex flex-col h-full bg-white">
          {/* Fixed Header */}
          <div className="flex-shrink-0 border-b border-[#EEEEEE] px-6 py-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
                <div className="p-2 rounded-full bg-[#F7F7F7]">
                  <FileText className="w-5 h-5 text-[#666666]" />
                </div>
                Create New Requirement
              </div>
            </div>
            <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-11">
              Requirements helps you grouping tasks better
            </p>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Requirement Title</span>
                <Input
                  placeholder="e.g. Navigation Bar"
                  className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${newRequirement.title ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                  value={newRequirement.title}
                  onChange={(e) => setNewRequirement({ ...newRequirement, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Workspace</span>
                <Select
                  className={`w-full h-11 employee-form-select ${newRequirement.workspace ? 'employee-form-select-filled' : ''}`}
                  placeholder="Select workspace"
                  value={newRequirement.workspace || undefined}
                  onChange={(v) => setNewRequirement({ ...newRequirement, workspace: String(v) })}
                  suffixIcon={<div className="text-gray-400">⌄</div>}
                >
                  {workspacesData?.result?.projects && workspacesData.result.projects.length > 0 ? (
                    workspacesData.result.projects.map((w: any) => (
                      <Option key={String(w.id)} value={String(w.id)}>
                        {w.name}
                      </Option>
                    ))
                  ) : (
                    <Option value="none" disabled>No workspaces available</Option>
                  )}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Due Date</span>
                <Input
                  type="date"
                  className={`h-11 rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] font-['Manrope:Medium',sans-serif] ${newRequirement.dueDate ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                  value={newRequirement.dueDate ? new Date(newRequirement.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setNewRequirement({ ...newRequirement, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Priority</span>
                <Select
                  className={`w-full h-11 employee-form-select ${newRequirement.priority ? 'employee-form-select-filled' : ''}`}
                  placeholder="Select priority"
                  value={newRequirement.priority || undefined}
                  onChange={(v) => setNewRequirement({ ...newRequirement, priority: String(v) })}
                  suffixIcon={<div className="text-gray-400">⌄</div>}
                >
                  <Option value="low">Low</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="high">High</Option>
                </Select>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">Description</span>
              <TextArea
                placeholder="Describe the requirement..."
                className={`font-['Manrope:Regular',sans-serif] rounded-lg border border-[#EEEEEE] focus:border-[#EEEEEE] ${newRequirement.description ? 'bg-white' : 'bg-[#F9FAFB]'}`}
                rows={4}
                value={newRequirement.description}
                onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
              />
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 border-t border-[#EEEEEE] px-6 py-6 flex items-center justify-end bg-white gap-4">
            <Button
              type="text"
              onClick={() => setNewRequirement({ title: '', workspace: '', type: '', priority: '', category: '', dueDate: '', description: '' })}
              className="h-[44px] px-4 text-[14px] font-['Manrope:SemiBold',sans-serif] text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors rounded-lg"
            >
              Reset Data
            </Button>
            <Button
              type="primary"
              onClick={handleCreateRequirement}
              loading={createRequirementMutation.isPending}
              className="h-[44px] px-8 rounded-lg bg-[#111111] hover:bg-[#000000]/90 text-white text-[14px] font-['Manrope:SemiBold',sans-serif] transition-transform active:scale-95 border-none"
            >
              Save Requirement
            </Button>
          </div>
        </div>
      </Modal>
      <style jsx global>{`
        /* Gray background for all Select dropdowns (default) */
        .employee-form-select .ant-select-selector {
          background-color: #F9FAFB !important;
          border-color: #EEEEEE !important;
        }
        .employee-form-select .ant-select-selector:hover {
          border-color: #EEEEEE !important;
        }
        .employee-form-select.ant-select-focused .ant-select-selector {
          border-color: #EEEEEE !important;
          box-shadow: none !important;
        }
        
        /* White background for filled Select dropdowns */
        .employee-form-select-filled .ant-select-selector {
          background-color: white !important;
        }
        
        /* Remove extra borders on Input focus */
        .ant-input:focus {
          border-color: #EEEEEE !important;
          box-shadow: none !important;
        }

        /* Notification popover - remove default AntD background/shadow */
        .notification-popover .ant-popover-inner {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .notification-popover .ant-popover-content {
          padding: 0 !important;
        }
      `}</style>
    </>
  );
}