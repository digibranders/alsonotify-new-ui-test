'use client';

import { useMemo, useState } from 'react';
import { Button } from 'antd';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type?: string;
}

interface NotificationPanelProps {
  notifications: NotificationItem[];
  isLoading: boolean;
  onMarkAsRead: (id: number) => void;
  onMarkAllRead: () => void;
}

export function NotificationPanel({
  notifications,
  isLoading,
  onMarkAsRead,
  onMarkAllRead,
}: NotificationPanelProps) {
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications]
  );

  const filteredNotifications = useMemo(
    () =>
      notificationFilter === 'all'
        ? notifications
        : notifications.filter((n) => n.unread),
    [notificationFilter, notifications]
  );

  return (
    <div className="w-[420px]">
      <div className="bg-white rounded-2xl border border-[#EEEEEE] shadow-[0_18px_45px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#F2F2F2] flex items-start justify-between gap-3">
          <div>
            <h3 className="font-['Manrope:SemiBold',sans-serif] text-[15px] text-[#111111]">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            <p className="mt-0.5 text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">
              Stay on top of activity across your workspaces.
            </p>
          </div>

          {/* Filter toggle */}
          <div className="flex items-center gap-1 bg-[#F7F7F7] rounded-full p-0.5">
            <button
              type="button"
              onClick={() => setNotificationFilter('all')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-['Manrope:SemiBold',sans-serif] transition-colors ${
                notificationFilter === 'all'
                  ? 'bg-white text-[#111111] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                  : 'text-[#666666]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setNotificationFilter('unread')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-['Manrope:SemiBold',sans-serif] transition-colors flex items-center gap-1 ${
                notificationFilter === 'unread'
                  ? 'bg-white text-[#111111] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                  : 'text-[#666666]'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[#ff3b3b] text-white text-[10px]">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* List body */}
        <div className="max-h-[360px] overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <div className="px-4 py-8 space-y-3">
              <div className="h-3 w-24 bg-[#F3F4F6] rounded-full" />
              <div className="h-3 w-56 bg-[#F3F4F6] rounded-full" />
              <div className="h-3 w-40 bg-[#F3F4F6] rounded-full" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="font-['Manrope:SemiBold',sans-serif] text-[13px] text-[#111111] mb-1">
                {notificationFilter === 'unread'
                  ? 'No unread notifications'
                  : 'You’re all caught up'}
              </p>
              <p className="font-['Manrope:Regular',sans-serif] text-[12px] text-[#999999]">
                We’ll let you know when there’s something new.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F2F2F2]">
              {filteredNotifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    !item.type && !item.unread ? {} : onMarkAsRead(item.id)
                  }
                  className={`w-full text-left px-4 py-3 transition-colors flex gap-3 ${
                    item.unread
                      ? 'bg-[#FFF4F4] hover:bg-[#FFECEC]'
                      : 'bg-white hover:bg-[#F7F7F7]'
                  }`}
                >
                  {/* Left: status dot */}
                  <div className="pt-1">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${
                        item.unread ? 'bg-[#ff3b3b]' : 'bg-[#D4D4D8]'
                      }`}
                    />
                  </div>

                  {/* Right: content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-['Manrope:SemiBold',sans-serif] text-[13px] text-[#111111] truncate">
                        {item.title}
                      </p>
                      {item.unread && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#ff3b3b]/10 text-[#ff3b3b] text-[10px] font-['Manrope:SemiBold',sans-serif]">
                          New
                        </span>
                      )}
                    </div>
                    {item.message && (
                      <p className="mt-0.5 font-['Manrope:Regular',sans-serif] text-[12px] text-[#666666]">
                        {item.message}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">
                      <span>{item.time}</span>
                      {item.type && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-[#E5E7EB]" />
                          <span className="capitalize">
                            {item.type.replace(/_/g, ' ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#F2F2F2] flex items-center justify-between">
          {notifications.length > 0 ? (
            <>
              <Button
                type="text"
                size="small"
                onClick={onMarkAllRead}
                className="text-[12px] font-['Manrope:SemiBold',sans-serif] text-[#ff3b3b] hover:text-[#ff3b3b] px-0"
              >
                Mark all as read
              </Button>
              <button
                type="button"
                className="text-[12px] font-['Manrope:SemiBold',sans-serif] text-[#111111] hover:text-[#000000] px-3 py-1.5 rounded-full bg-[#F7F7F7] hover:bg-[#E5E7EB] transition-colors"
              >
                View activity center
              </button>
            </>
          ) : (
            <span className="text-[11px] text-[#999999] font-['Manrope:Regular',sans-serif]">
              Notifications are synced in real time.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

