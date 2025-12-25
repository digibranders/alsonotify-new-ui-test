'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTask, useWorklogs } from '@/hooks/useTask';
import { Button, Tag, Avatar, Input, Tooltip } from 'antd';
import {
    Clock,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Briefcase,
    Folder,
    Calendar,
    Paperclip,
    Send,
    User
} from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { PageLayout } from '../../layout/PageLayout';

// Helper to get initials
const getInitials = (name: string) => {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
};

export function TaskDetailsPage() {
    const params = useParams();
    const taskId = params.taskId as string;
    const router = useRouter();
    const { data: taskData, isLoading } = useTask(parseInt(taskId || '0'));
    const { data: worklogsData, isLoading: isLoadingWorklogs } = useWorklogs(parseInt(taskId || '0'), 50, 0);
    const [activeTab, setActiveTab] = useState('details');

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-[#ff3b3b] animate-spin mb-2" />
                <p className="text-[#999999]">Loading task...</p>
            </div>
        );
    }

    const backendTask = taskData?.result;
    if (!backendTask) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h2 className="text-xl font-semibold mb-2">Task not found</h2>
                <Button onClick={() => router.push('/dashboard/tasks')}>Back to Tasks</Button>
            </div>
        );
    }

    // --- Data Transformation ---

    const assignedToName = (backendTask as any).member_user?.name || (backendTask.assigned_to as any)?.name || 'Unassigned';
    const leaderName = (backendTask as any).leader_user?.name || (backendTask as any).leader?.name || 'Unassigned';

    // Client / Company Logistics
    const clientCompanyName = (backendTask as any).task_project?.client_user?.company?.name ||
        (backendTask as any).client?.name ||
        (backendTask as any).client_company_name;
    const inHouseCompanyName = (backendTask as any).company?.name ||
        (backendTask as any).company_name ||
        (backendTask as any).task_project?.company?.name ||
        (backendTask as any).task_project?.company_name;
    const displayClientName = clientCompanyName || inHouseCompanyName || 'In-House';
    const isClientWork = !!clientCompanyName;

    const requirementName = (backendTask as any).requirement?.name ||
        (backendTask.requirement_id ? `Requirement ${backendTask.requirement_id}` : 'No Requirement');

    const estTime = (backendTask as any).estimated_time || 0;
    const timeSpent = (backendTask as any).time_spent || 0;
    const isOverEstimate = estTime > 0 && timeSpent > estTime;
    const progressPercent = estTime > 0 ? Math.min(Math.round((timeSpent / estTime) * 100), 100) : 0;

    const task = {
        id: String(backendTask.id),
        name: (backendTask as any).name || backendTask.title || '',
        description: backendTask.description,
        status: backendTask.status || 'Assigned',
        priority: (backendTask.priority || 'medium').toLowerCase(),
        startDate: (backendTask as any).start_date ? new Date((backendTask as any).start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'TBD',
        dueDate: (backendTask as any).due_date ? new Date((backendTask as any).due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : 'TBD',
        estTime,
        timeSpent,
    };

    // --- Title Action Component ---
    const TitleSection = (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
                <span className="text-[#999999] cursor-pointer hover:text-[#111111] text-sm font-['Manrope:Medium',sans-serif]" onClick={() => router.push('/dashboard/tasks')}>Tasks</span>
                <span className="text-[#999999] text-sm">/</span>
                <span className="text-[#111111] text-sm font-['Manrope:SemiBold',sans-serif]">{task.name}</span>
            </div>

            <div className="flex items-center gap-3">
                {/* Status/Timer Icon - Dynamic based on status */}
                {task.status.toLowerCase() === 'completed' || task.status.toLowerCase() === 'done' ? (
                    <div className="w-8 h-8 rounded-full border border-[#DCFCE7] flex items-center justify-center cursor-pointer hover:bg-[#F0FDF4]">
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded-full border border-[#FFE4E6] flex items-center justify-center cursor-pointer hover:bg-[#FFF1F2]">
                        <Clock className="w-4 h-4 text-[#E11D48]" />
                    </div>
                )}

                {/* Priority Badge */}
                <div className={`px-3 py-1 rounded-full text-[10px] font-['Manrope:Bold',sans-serif] uppercase tracking-wider ${task.priority === 'high' ? 'bg-[#FEF2F2] text-[#DC2626]' :
                        task.priority === 'medium' ? 'bg-[#FFF7ED] text-[#EA580C]' :
                            'bg-[#EFF6FF] text-[#2563EB]'
                    }`}>
                    {task.priority}
                </div>

                {/* Assigned User Avatar (Single) */}
                <div className="w-8 h-8 rounded-full bg-[#E11D48] flex items-center justify-center text-xs font-bold text-white uppercase">
                    {getInitials(assignedToName).charAt(0)}
                </div>
            </div>
        </div>
    );

    const formatHourValue = (val: any) => {
        const num = Number(val);
        if (isNaN(num)) return '0';
        return Number.isInteger(num) ? num.toString() : num.toFixed(1);
    }

    return (
        <PageLayout
            title={TitleSection}
            // tabs props removed to implement custom layout
            searchPlaceholder=""
            hideFilters={true}
        >
            <div className="w-full h-full flex gap-8 pt-4">

                {/* LEFT COLUMN: Tabs + Content (Scrollable) */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">

                    {/* Custom Tabs Header */}
                    <div className="flex items-center gap-6 border-b border-transparent mb-6 shrink-0 h-[40px] px-1">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`pb-2 text-sm font-['Manrope:SemiBold',sans-serif] relative transition-colors ${activeTab === 'details' ? 'text-[#EF4444]' : 'text-[#666666] hover:text-[#111111]'
                                }`}
                        >
                            Details
                            {activeTab === 'details' && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#EF4444] rounded-t-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('steps')}
                            className={`pb-2 text-sm font-['Manrope:SemiBold',sans-serif] relative transition-colors ${activeTab === 'steps' ? 'text-[#EF4444]' : 'text-[#666666] hover:text-[#111111]'
                                }`}
                        >
                            Steps <span className="text-[#999999] font-normal">(3)</span>
                            {activeTab === 'steps' && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#EF4444] rounded-t-full" />
                            )}
                        </button>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto pr-2 pb-6 space-y-6 opacity-100">
                        {activeTab === 'details' && (
                            <>
                                {/* Description Card */}
                                <div className="bg-white border border-[#EEEEEE] rounded-[16px] p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-5 h-5 flex items-center justify-center">
                                            {/* Red Document Icon - Exact Path */}
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M14 2V8H20" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M16 13H8" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M16 17H8" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M10 9H8" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <h3 className="text-base font-['Manrope:Bold',sans-serif] text-[#111111]">Description</h3>
                                    </div>
                                    <div
                                        className="text-[#666666] text-sm leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: task.description || 'No description provided.' }}
                                    />
                                </div>

                                {/* Task Overview Card */}
                                <div className="bg-white border border-[#EEEEEE] rounded-[16px] p-6">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Briefcase className="w-5 h-5 text-[#EF4444]" />
                                        <h3 className="text-base font-['Manrope:Bold',sans-serif] text-[#111111]">Task Overview</h3>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                        {/* Assigned To */}
                                        <div className="bg-[#F9FAFB] rounded-xl p-4">
                                            <p className="text-[10px] text-[#999999] uppercase tracking-wider font-['Manrope:Bold',sans-serif] mb-3">ASSIGNED TO</p>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="bg-[#EF4444] text-xs font-bold text-white">{getInitials(assignedToName)}</Avatar>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-['Manrope:Bold',sans-serif] text-[#111111] leading-tight truncate" title={assignedToName}>{assignedToName}</p>
                                                    <p className="text-xs text-[#666666]">Assignee</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Leader */}
                                        <div className="bg-[#F9FAFB] rounded-xl p-4">
                                            <p className="text-[10px] text-[#999999] uppercase tracking-wider font-['Manrope:Bold',sans-serif] mb-3">LEADER</p>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="bg-[#E5E7EB] text-[#111111] text-xs font-bold">{getInitials(leaderName)}</Avatar>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-['Manrope:Bold',sans-serif] text-[#111111] leading-tight truncate" title={leaderName}>{leaderName}</p>
                                                    <p className="text-xs text-[#666666]">Supervisor</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Client */}
                                        <div className="bg-[#F9FAFB] rounded-xl p-4">
                                            <p className="text-[10px] text-[#999999] uppercase tracking-wider font-['Manrope:Bold',sans-serif] mb-3">CLIENT</p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#111111] shrink-0">
                                                    <Briefcase className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-['Manrope:Bold',sans-serif] text-[#111111] leading-tight truncate" title={displayClientName}>{displayClientName}</p>
                                                    <p className="text-xs text-[#666666]">{isClientWork ? 'Partner' : 'Internal'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Requirement */}
                                        <div className="bg-[#F9FAFB] rounded-xl p-4">
                                            <p className="text-[10px] text-[#999999] uppercase tracking-wider font-['Manrope:Bold',sans-serif] mb-3">REQUIREMENT</p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#111111] shrink-0">
                                                    <Folder className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-['Manrope:Bold',sans-serif] text-[#111111] leading-tight truncate" title={requirementName}>{requirementName}</p>
                                                    <p className="text-xs text-[#666666]">Scope</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline & Progress Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Timeline */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <Calendar className="w-4 h-4 text-[#666666]" />
                                                <span className="text-sm font-['Manrope:SemiBold',sans-serif] text-[#111111]">Timeline</span>
                                            </div>
                                            <div className="flex items-center justify-between bg-[#F9FAFB] rounded-lg p-5 h-[88px]">
                                                <div>
                                                    <p className="text-[10px] text-[#999999] mb-1 uppercase tracking-wide">Start Date</p>
                                                    <p className="text-sm font-['Manrope:Bold',sans-serif] text-[#111111]">{task.startDate}</p>
                                                </div>
                                                <div className="flex-1 flex items-center justify-center px-4">
                                                    <div className="w-full h-[1px] bg-[#E5E7EB] relative">
                                                        <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                                            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1 1L5 5L1 9" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-[#999999] mb-1 uppercase tracking-wide">Due Date</p>
                                                    <p className="text-sm font-['Manrope:Bold',sans-serif] text-[#111111]">{task.dueDate}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Tracking */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <Clock className="w-4 h-4 text-[#666666]" />
                                                <span className="text-sm font-['Manrope:SemiBold',sans-serif] text-[#111111]">Progress Tracking</span>
                                            </div>
                                            <div className="bg-[#F9FAFB] rounded-lg p-5 h-[88px] flex flex-col justify-between">
                                                <div className="flex items-end justify-between">
                                                    <p className="text-lg font-['Manrope:Bold',sans-serif] text-[#111111] leading-none">
                                                        {formatHourValue(task.estTime)} <span className="text-xs font-normal text-[#666666] font-['Manrope:Medium',sans-serif]">hrs estimated</span>
                                                    </p>
                                                    <span className={`text-lg font-bold ${progressPercent >= 100 ? 'text-[#16A34A]' : 'text-[#3B82F6]'}`}>{progressPercent}%</span>
                                                </div>
                                                <div>
                                                    <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden mb-2">
                                                        <div
                                                            className={`h-full rounded-full ${isOverEstimate ? 'bg-[#DC2626]' : progressPercent >= 100 ? 'bg-[#16A34A]' : 'bg-[#3B82F6]'}`}
                                                            style={{ width: `${progressPercent}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-[10px] font-['Manrope:SemiBold',sans-serif]">
                                                        <span className="text-[#999999]">0H</span>
                                                        <span className="text-[#666666] uppercase">{formatHourValue(task.timeSpent)}H LOGGED</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'steps' && (
                            <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#EEEEEE] rounded-[16px]">
                                <p className="text-[#999999] mb-4">No steps added yet.</p>
                                <Button>Add First Step</Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Activity & Chat */}
                <div className="w-[380px] shrink-0 h-full flex flex-col border-l border-[#EEEEEE] -my-4 -mr-0 pl-6 py-4 overflow-hidden bg-white/50">
                    {/* Header - Aligned with the custom Tabs */}
                    <div className="mb-6 h-[40px] flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-4 h-4 text-[#ff3b3b]">
                                {/* Activity/Chat Icon - Message Bubble */}
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 15C21 16.1046 20.1046 17 19 17H7L3 21V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className="text-base font-['Manrope:Bold',sans-serif] text-[#111111]">Activity & Chat</h3>
                        </div>
                        <p className="text-xs text-[#999999]">Task updates and comments</p>
                    </div>

                    {/* Messages List (Scrollable) */}
                    <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                        {isLoadingWorklogs ? (
                            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-[#999999]" /></div>
                        ) : worklogsData?.result?.length ? (
                            worklogsData.result.map((log: any, index: number) => {
                                const isSystem = !log.member_id;
                                const name = log.member_user?.name || log.created_by_user?.name || 'System';
                                const initials = getInitials(name);
                                const time = log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true }) : '';

                                return (
                                    <div key={log.id || index} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <Avatar
                                            size="small"
                                            className={`${isSystem ? 'bg-[#F3F4F6] text-[#666666]' : 'bg-[#666666] text-white'} text-[10px] font-bold shrink-0 mt-1`}
                                        >
                                            {initials}
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between mb-1">
                                                <span className="text-sm font-['Manrope:Bold',sans-serif] text-[#111111] truncate">{name}</span>
                                                <span className="text-[10px] text-[#999999] whitespace-nowrap ml-2">{time}</span>
                                            </div>
                                            <div className={`p-3 rounded-xl text-sm ${isSystem ? 'bg-[#F9FAFB] text-[#666666] italic' : 'bg-[#F3F4F6] text-[#111111]'}`}>
                                                {log.description || 'No content'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-[#999999]">
                                <p className="text-xs">No activity yet.</p>
                                <p className="text-[10px] opacity-70">Be the first to comment</p>
                            </div>
                        )}
                    </div>

                    {/* Input Area (Sticky Bottom) */}
                    <div className="pt-4 mt-2 border-t border-[#EEEEEE]">
                        <div className="bg-[#F9FAFB] rounded-xl p-2 border border-[#E5E7EB] flex items-center gap-2 focus-within:ring-2 focus-within:ring-[#ff3b3b]/10 focus-within:border-[#ff3b3b] transition-all">
                            <Input
                                placeholder="Type a message..."
                                className="border-none bg-transparent shadow-none text-sm focus:shadow-none placeholder:text-[#999999] !px-2"
                            />
                            <div className="flex items-center gap-1 pr-1 shrink-0">
                                <Button type="text" shape="circle" size="small" icon={<Paperclip className="w-4 h-4 text-[#999999]" />} />
                                <Button className="!flex items-center justify-center !bg-transparent hover:!bg-[#FEE2E2] !text-[#ff3b3b] border-none !shadow-none" shape="circle" size="small" icon={<Send className="w-4 h-4" />} />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </PageLayout>
    );
}