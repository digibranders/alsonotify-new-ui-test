import { Avatar, Tooltip } from 'antd';
import { ArrowRight, CheckCircle2, Clock, Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this exists, if not I'll use template literals
import { format } from 'date-fns';

interface TaskMember {
  id: number;
  user_id: number;
  status: string;
  estimated_time: number | null;
  seconds_spent: number;
  active_worklog_start_time?: string | null;
  is_current_turn: boolean;
  queue_order: number;
  execution_mode: 'parallel' | 'sequential';
  user: {
    id: number;
    name: string;
    profile_pic?: string;
  };
}

interface TaskMembersListProps {
  members: TaskMember[];
  executionMode: 'parallel' | 'sequential';
  currentUser?: { id: number };
}

export function TaskMembersList({ members, executionMode, currentUser }: TaskMembersListProps) {
  // Sort by queue_order for sequential, but also good for parallel to stay consistent
  const sortedMembers = [...(members || [])].sort((a, b) => (a.queue_order || 0) - (b.queue_order || 0));

  return (
    <div className="bg-white rounded-[16px] p-6 border border-[#EEEEEE] shadow-sm">
      <h3 className="text-[14px] font-['Manrope:Bold',sans-serif] text-[#111111] mb-4 flex items-center justify-between">
        <span>Squad & Progress</span>
        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide ${
          executionMode === 'sequential' ? 'bg-[#FFF2E8] text-[#FA541C]' : 'bg-[#E6F4FF] text-[#0091FF]'
        }`}>
          {executionMode} Mode
        </span>
      </h3>

      <div className="space-y-3">
        {sortedMembers.map((member, index) => {
          const isTurn = member.is_current_turn;
          const isMe = currentUser?.id === member.user_id;

          // Status Badge Logic
          let statusColor = 'text-gray-500 bg-gray-50 border-gray-100';
          let StatusIcon = Hourglass;
          
          if (member.status === 'Completed') {
            statusColor = 'text-green-600 bg-green-50 border-green-100';
            StatusIcon = CheckCircle2;
          } else if (member.status === 'In_Progress') {
            statusColor = 'text-blue-600 bg-blue-50 border-blue-100';
            StatusIcon = Clock;
          }

          return (
            <div 
              key={member.id}
              className={`relative flex items-center gap-4 p-3 rounded-xl border transition-all ${
                isTurn && executionMode === 'sequential' 
                  ? 'bg-amber-50/30 border-amber-200 ring-1 ring-amber-100' 
                  : 'bg-white border-[#F5F5F5]'
              }`}
            >
              {/* Turn Indicator (Sequential) */}
              {executionMode === 'sequential' && (
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${
                  isTurn ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {member.queue_order || index + 1}
                </div>
              )}

              {/* Avatar */}
              <Avatar src={member.user.profile_pic} size="default" className="border border-white shadow-sm">
                {member.user.name.charAt(0)}
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-[13px] font-['Manrope:SemiBold',sans-serif] truncate ${isMe ? 'text-[#111111]' : 'text-[#444444]'}`}>
                    {member.user.name} {isMe && '(You)'}
                  </p>
                  {isTurn && executionMode === 'sequential' && (
                     <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 rounded-full border border-amber-100 animate-pulse">
                       Current Turn
                     </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#888888] mt-0.5">
                  <span className="flex items-center gap-1">
                     est: <span className="text-[#111111]">{member.estimated_time || 0}h</span>
                  </span>
                  <span className="w-[1px] h-3 bg-gray-200"></span>
                   <span className="flex items-center gap-1">
                     logged: <span className="text-[#111111]">{(member.seconds_spent / 3600).toFixed(1)}h</span>
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${statusColor}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {member.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
