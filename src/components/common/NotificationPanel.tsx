'use client';

import { useMemo, useState } from 'react';
import { Drawer } from 'antd';
import { BellOff, FileText, AlertCircle, CheckSquare, Info, X, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type?: 'requirement' | 'task' | 'delivery' | 'workspace' | 'alert' | 'general';
  actionLink?: string;
  actionLabel?: string;
}

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  isLoading: boolean;
  onMarkAsRead: (id: number) => void;
  onMarkAllRead: () => void;
}

function EmptyState({ message = "No notifications" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-[#F7F7F7] flex items-center justify-center mb-3">
        <BellOff className="w-5 h-5 text-[#999999]" />
      </div>
      <p className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111] mb-1">
        All caught up!
      </p>
      <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#999999]">
        {message}
      </p>
    </div>
  );
}

function NotificationItemComponent({
  notification,
  markAsRead,
  navigate
}: {
  notification: NotificationItem;
  markAsRead: (id: number) => void;
  navigate: (path: string) => void;
}) {
  const getIcon = (type?: string) => {
    switch (type) {
      case 'requirement': return <FileText className="w-5 h-5" />;
      case 'alert': return <AlertCircle className="w-5 h-5" />;
      case 'task': return <CheckSquare className="w-5 h-5" />;
      case 'delivery': return <Info className="w-5 h-5" />;
      case 'workspace': return <Info className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const handleClick = () => {
    markAsRead(notification.id);
    if (notification.actionLink) {
      navigate(notification.actionLink);
    } else {
      if (notification.type === 'requirement') navigate('/dashboard/kanban');
      if (notification.type === 'task') navigate('/dashboard/tasks');
      if (notification.type === 'alert') navigate('/dashboard/tasks');
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative px-5 py-4 border-b border-[#EEEEEE] cursor-pointer transition-all duration-200 hover:bg-[#F9F9F9] ${notification.unread ? 'bg-[#ff3b3b]/[0.02]' : 'bg-white'
        }`}
    >
      {notification.unread && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#ff3b3b]" />
      )}

      <div className="flex gap-4">
        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${notification.type === 'requirement' ? 'bg-blue-50 border-blue-100 text-blue-600' :
            notification.type === 'alert' ? 'bg-red-50 border-red-100 text-red-600' :
              notification.type === 'task' ? 'bg-orange-50 border-orange-100 text-orange-600' :
                'bg-gray-50 border-gray-100 text-gray-600'
          }`}>
          {getIcon(notification.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`text-[14px] leading-tight truncate ${notification.unread ? "font-['Manrope:Bold',sans-serif] text-[#111111]" : "font-['Manrope:Medium',sans-serif] text-[#666666]"}`}>
              {notification.title}
            </h4>
            <span className="text-[11px] text-[#999999] whitespace-nowrap font-['Inter:Regular',sans-serif] shrink-0">
              {notification.time}
            </span>
          </div>

          <p className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif] leading-relaxed mb-3 line-clamp-2">
            {notification.message}
          </p>

          {notification.type === 'requirement' && (
            <div className="flex justify-start gap-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAsRead(notification.id);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#ff3b3b] text-white hover:bg-[#d32f2f] transition-colors shadow-sm ring-1 ring-[#ff3b3b]/10"
                title="Reject"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAsRead(notification.id);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#0F9D58] text-white hover:bg-[#0B8043] transition-colors shadow-sm ring-1 ring-[#0F9D58]/10"
                title="Approve"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotificationPanel({
  open,
  onClose,
  notifications,
  isLoading,
  onMarkAsRead,
  onMarkAllRead,
}: NotificationPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => n.unread);
      case 'tasks':
        return notifications.filter((n) => n.type === 'task');
      default:
        return notifications;
    }
  }, [activeTab, notifications]);

  const tabItems = [
    {
      key: 'all',
      label: 'All',
    },
    {
      key: 'unread',
      label: 'Unread',
    },
    {
      key: 'tasks',
      label: 'Tasks',
    },
  ];

  const navigate = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      styles={{
        wrapper: {
          width: 400,
        },
        body: {
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        },
        header: {
          display: 'none',
        },
      }}
      className="notification-drawer"
    >
      {/* Header */}
      <div className="p-5 border-b border-[#EEEEEE] flex flex-row items-center justify-between bg-white shrink-0 z-10">
        <div className="flex items-center gap-3">
          <h3 className="font-['Manrope:Bold',sans-serif] text-[18px] text-[#111111]">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#ff3b3b] text-white text-[11px] font-['Manrope:Bold',sans-serif]">
              {unreadCount} New
            </span>
          )}
        </div>
        {notifications.length > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-[12px] font-['Manrope:SemiBold',sans-serif] text-[#999999] hover:text-[#ff3b3b] transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="px-5 py-3 bg-[#FAFAFA] border-b border-[#EEEEEE] shrink-0">
        <div className="bg-[#EEEEEE]/50 h-9 p-1 rounded-lg w-full flex justify-start gap-1">
          {tabItems.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-md text-[12px] font-['Inter:Medium',sans-serif] transition-all ${activeTab === tab.key
                  ? 'bg-white text-[#111111] shadow-sm'
                  : 'text-[#666666] hover:text-[#111111]'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-8 space-y-3">
            <div className="h-3 w-24 bg-[#F3F4F6] rounded-full" />
            <div className="h-3 w-56 bg-[#F3F4F6] rounded-full" />
            <div className="h-3 w-40 bg-[#F3F4F6] rounded-full" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            message={
              activeTab === 'unread'
                ? 'No unread notifications'
                : activeTab === 'tasks'
                  ? 'No task notifications'
                  : 'No notifications'
            }
          />
        ) : (
          <div className="flex flex-col">
            {filteredNotifications.map((notification) => (
              <NotificationItemComponent
                key={notification.id}
                notification={notification}
                markAsRead={onMarkAsRead}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
