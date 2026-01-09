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
import { UserCog, Settings, LogOut, MessageCircle } from 'lucide-react';
import { TaskForm } from '../modals/TaskForm';
import { RequirementsForm, RequirementFormData } from '../modals/RequirementsForm';
import { WorkspaceForm } from '../modals/WorkspaceForm';
import { NotificationPanel } from './NotificationPanel';
import { FeedbackWidget } from './FeedbackWidget';
import { useUserDetails } from '@/hooks/useUser';
import { getRoleFromUser } from '@/utils/roleUtils';
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '@/hooks/useNotification';
import { useWorkspaces, usePartners } from '@/hooks/useWorkspace';
import { useEmployees } from '@/hooks/useUser';
import { searchEmployees } from '@/services/user';
import { getRequirementsDropdownByWorkspaceId } from '@/services/workspace';
import { useCreateTask } from '@/hooks/useTask';
import { useCreateRequirement } from '@/hooks/useWorkspace';
import { useLogout } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

import { CreateTaskRequestDto } from '@/types/dto/task.dto';
import { CreateRequirementRequestDto } from '@/types/dto/requirement.dto';

type UserRole = 'Admin' | 'Manager' | 'Leader' | 'Employee';

interface HeaderProps {
  userRole?: UserRole;
  roleColor?: string;
  setUserRole?: (role: UserRole) => void;
}

// Helper function to get greeting based on local time
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

export function Header({ userRole = 'Admin', roleColor, setUserRole }: HeaderProps) {
  const router = useRouter();
  const handleLogout = useLogout();
  const { message } = App.useApp();

  // Fetch user details
  const { data: userDetailsData, error: userDetailsError, isLoading: isLoadingUserDetails } = useUserDetails();

  // Fetch notifications
  const { data: notificationsData, isLoading: isLoadingNotifications } = useNotifications();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const markReadMutation = useMarkNotificationRead();

  // Fetch data for dialogs
  const { data: workspacesData } = useWorkspaces();

  const { data: employeesData } = useEmployees();
  const [usersDropdown, setUsersDropdown] = useState<Array<{ id: number; name: string }>>([]);
  const [requirementsDropdown, setRequirementsDropdown] = useState<Array<{ id: number; name: string }>>([]);

  // Dialogs state
  const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showRequirementDialog, setShowRequirementDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  // Mutations
  const createTaskMutation = useCreateTask();
  const createRequirementMutation = useCreateRequirement();

  // Form States


  // Get greeting based on local time - client side only
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setGreeting(getGreeting());

    // Periodically update greeting
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Sync user from local storage on mount to avoid hydration mismatch
  const [localUser, setLocalUser] = useState<unknown>(null);

  useEffect(() => {

      const stored = localStorage.getItem("user");
      if (stored) {
        setLocalUser(JSON.parse(stored));
      }

  }, []);

  const user = useMemo(() => {
    if (localUser && typeof localUser === 'object' && 'name' in localUser) return localUser as { name: string; first_name?: string; user_profile?: { first_name?: string; profile_pic?: string }; company?: { account_type?: string }; profile_pic?: string };

    // Fallback to API data
    const apiUser = userDetailsData?.result?.user || userDetailsData?.result || {} as { name?: string; first_name?: string; user_profile?: { first_name?: string; profile_pic?: string }; company?: { account_type?: string }; profile_pic?: string };
    return apiUser;
  }, [localUser, userDetailsData]);

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

  // Determine role for UI - prefer prop if passed from authoritative Layout
  const mappedRole = userRole;

  // Fetch users and requirements for dropdowns
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await searchEmployees();
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
        if (!workspacesData?.result?.workspaces) return;
        const allRequirements: Array<{ id: number; name: string }> = [];

        for (const workspace of workspacesData.result.workspaces) {
          try {
            const response = await getRequirementsDropdownByWorkspaceId(workspace.id);
            if (response.success && response.result) {
              allRequirements.push(...response.result);
            }
          } catch (error) {
            // Failed to fetch requirements for workspace
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
    return notificationsData.result.map((n: { id: number; title?: string; message?: string; created_at?: string; is_read?: boolean; type?: string }): { id: number; title: string; message: string; time: string; unread: boolean; type: 'general' | 'task' | 'requirement' | 'delivery' | 'partner_invite' | 'workspace' | 'alert' } => ({
      id: n.id,
      title: n.title || n.message || 'Notification',
      message: n.message || n.title || '',
      time: n.created_at
        ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true })
        : 'Just now',
      unread: !n.is_read,
      type: (n.type || 'general') as 'general' | 'task' | 'requirement' | 'delivery' | 'partner_invite' | 'workspace' | 'alert',
    }));
  }, [notificationsData]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAsRead = (id: number) => {
    markReadMutation.mutate(id);
  };

  const handleClearAllNotifications = () => {
    markAllReadMutation.mutate();
  };



  // Handle requirement creation
  const handleCreateRequirement = async (data: RequirementFormData | any) => {
    if (!data.title) {
      message.error("Requirement title is required");
      return;
    }

    if (!data.workspace && !data.workspace_id) {
      message.error("Please select a workspace");
      return;
    }

    const requirementPayload: CreateRequirementRequestDto = {
        workspace_id: Number(data.workspace || data.workspace_id),
        project_id: Number(data.workspace || data.workspace_id), // Backward compatibility
        name: data.title as string,
        description: (data.description || '') as string,
        start_date: new Date().toISOString(),
        end_date: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        status: 'Assigned',
        is_high_priority: data.priority === 'HIGH' || Boolean(data.is_high_priority) || false,
        type: data.type as string | undefined,
        contact_person: data.contactPerson as string | undefined,
        contact_person_id: data.contact_person_id as number | undefined,
        receiver_company_id: data.receiver_company_id as number | undefined,
        budget: Number(data.budget) || 0,
    };

    createRequirementMutation.mutate(
      requirementPayload,
      {
        onSuccess: () => {
          message.success("Requirement created successfully!");
          setShowRequirementDialog(false);
          // Reset form handled by component unmount/remount usually, but here we might need to reset state if we kept it
        },
        onError: (error: unknown) => {
          const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create requirement";
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
          label: 'Finance',
          icon: <Receipt24Filled className="w-4 h-4" />,
          onClick: () => router.push('/dashboard/finance'),
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
          onClick: () => router.push('/dashboard/notes'),
          className: "font-['Manrope:Medium',sans-serif]"
        },
      ],
    },
  ];

  const accountType = user?.company?.account_type || 'ORGANIZATION';
  const isIndividual = accountType === 'INDIVIDUAL';

  const isAdmin = useMemo(() => {
    const userData = userDetailsData?.result?.user || userDetailsData?.result || {};
    return getRoleFromUser(userData) === 'Admin';
  }, [userDetailsData]);

  const profileMenuItems: MenuProps['items'] = [
    {
      key: 'account',
      type: 'group',
      label: (
        <span className="text-[#111111] font-bold font-['Manrope:Bold',sans-serif] text-[14px]">
          {isIndividual ? 'Personal Account' : 'Organization Account'}
        </span>
      ),
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
        ...(isAdmin ? [
          {
            key: 'feedbacks',
            label: 'Feedbacks',
            icon: <MessageCircle className="w-4 h-4" />,
            onClick: () => router.push('/dashboard/feedback'),
          }
        ] : []),
      ],
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: <span className="text-[#ff3b3b]">Log out</span>,
      icon: <LogOut className="w-4 h-4 text-[#ff3b3b]" />,
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
              <AccessBadge role={mappedRole || userRole} color={roleColor} />
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

            {/* Feedback Toggle */}
            <button
              onClick={() => setShowFeedbackDialog(true)}
              className="w-10 h-10 rounded-full bg-[#F7F7F7] hover:bg-[#EEEEEE] flex items-center justify-center transition-colors cursor-pointer"
              title="Give Feedback"
            >
              <svg 
                className="w-5 h-5 text-[#666666]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </button>

            {/* Notification icon */}
            <>
              <button
                onClick={() => setNotificationDrawerOpen(true)}
                className="relative hover:opacity-70 transition-opacity p-1 cursor-pointer"
              >
                <Alert24Filled className="w-6 h-6 text-[#000000]" strokeWidth={1.5} />
                {/* Notification Badge */}
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-[#ff3b3b] rounded-full border border-white flex items-center justify-center">
                    <span className="text-[9px] font-['Inter:Bold',sans-serif] text-white">{unreadCount}</span>
                  </span>
                )}
              </button>
              <NotificationPanel
                open={notificationDrawerOpen}
                onClose={() => setNotificationDrawerOpen(false)}
                notifications={notifications}
                isLoading={isLoadingNotifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllRead={handleClearAllNotifications}
              />
            </>

            {/* Profile photo & Role Switcher */}
            <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight" trigger={['click']}>
              <div className="relative shrink-0 size-[40px] rounded-full ring-2 ring-transparent hover:ring-[#ff3b3b]/20 transition-all cursor-pointer">
                <Avatar
                  size={40}
                  src={user?.user_profile?.profile_pic || user?.profile_pic || "https://github.com/shadcn.png"}
                  // src={user?.user_profile?.profile_pic || user?.profile_pic || "/documents/profile.png"}
                  alt={user?.name || 'User'}
                />
              </div>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Workspace Modal */}
      <WorkspaceForm
        open={showWorkspaceDialog}
        onCancel={() => setShowWorkspaceDialog(false)}
        onSuccess={() => setShowWorkspaceDialog(false)}
      />

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
            const formattedData: CreateTaskRequestDto = {
              ...data,
              start_date: data.start_date,
              name: data.title || data.name, // Ensure name is present
            };
            createTaskMutation.mutate(formattedData, {
              onSuccess: () => {
                setShowTaskDialog(false);
                message.success("Task created successfully");
              },
              onError: (error: unknown) => {
                const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as { message?: string })?.message || "Failed to create task";
                message.error(errorMessage);
              }
            });
          }}
          onCancel={() => setShowTaskDialog(false)}
          users={usersDropdown}
          requirements={requirementsDropdown}
          workspaces={workspacesData?.result?.workspaces?.map((p: { id: number; name: string }) => ({ id: p.id, name: p.name })) || []}
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
            height: '80vh',
          }
        }}
      >
        <RequirementsForm
          onSubmit={handleCreateRequirement}
          onCancel={() => setShowRequirementDialog(false)}
          workspaces={workspacesData?.result?.workspaces?.map((w: { id: number; name: string }) => ({ id: w.id, name: w.name })) || []}
          isLoading={createRequirementMutation.isPending}
        />
      </Modal>

      {/* Feedback Modal */}
      <FeedbackWidget
        open={showFeedbackDialog}
        onClose={() => setShowFeedbackDialog(false)}
      />
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