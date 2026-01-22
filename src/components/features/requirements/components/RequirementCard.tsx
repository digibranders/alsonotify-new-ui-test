import { Checkbox, Popover } from 'antd';
import { 
  Calendar as CalendarIcon, 
  CheckCircle, 
  MoreHorizontal, 
  X,
  Receipt,
  Clock,
  FilePlus,
  Loader2,
  Trash2
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, differenceInDays, isPast, isToday } from 'date-fns';

interface RequirementCardProps {
  requirement: any; // Using any for compatibility with mapped data
  selected: boolean;
  onSelect: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onNavigate?: () => void;
  deleteLabel?: string;
  deleteIcon?: React.ReactNode;
}

export function RequirementCard({
  requirement,
  selected,
  onSelect,
  onAccept,
  onReject,
  onEdit,
  onDelete,
  onDuplicate,
  onNavigate,
  deleteLabel,
  deleteIcon,
}: RequirementCardProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Determine if pending approval
  const isPending = useMemo(() => {
    // For outsourced requirements, use explicit status-based logic
    if (requirement.type === 'outsourced') {
      const status = requirement.rawStatus;
      
      // Sender (A) sees pending when:
      if (requirement.isSender) {
        // - Status = Waiting (sent to partner, awaiting quote)
        if (status === 'Waiting') return true;
        // - Status = Review (received quote from partner, needs to review)
        if (status === 'Review') return true;
        return false;
      }
      
      // Receiver (B) sees pending when:
      if (requirement.isReceiver) {
        // - Status = Waiting (needs to submit quote)
        if (status === 'Waiting') return true;
        // - Status = Assigned AND no workspace mapped (needs to map workspace)
        if (status === 'Assigned' && !requirement.receiver_workspace_id) return true;
        // - Status = Review (quote submitted, waiting for sender's response - passive waiting)
        if (status === 'Review') return true; 
        return false; // Explicitly false for other statuses
      }
    }
    
    // Fallback for non-outsourced requirements
    if (requirement.approvalStatus === 'pending') return true;
    
    return false;
  }, [requirement]);

  const getUnifiedStatusConfig = () => {
    // 1. Billing / Financial Status (Highest Priority)
    if (requirement.invoiceStatus === 'paid') {
      return { 
        label: requirement.type === 'outsourced' ? 'Payment Cleared' : 'Payment Received', 
        icon: <CheckCircle className="w-3 h-3" />,
        className: 'bg-[#f3ffe6] text-[#7ccf00] border-[#7ccf00]',
        onClick: null
      };
    }
    if (requirement.invoiceStatus === 'billed') {
      return { 
        label: requirement.type === 'outsourced' ? 'Invoice Received' : 'Invoice Sent', 
        icon: <CheckCircle className="w-3 h-3" />,
        className: 'bg-[#E3F2FD] text-[#2196F3] border-[#90CAF9]',
        onClick: null
      };
    }
    
    // 2. Project Status
    switch (requirement.status) {
      case 'completed':
        if (requirement.type === 'outsourced') {
             return { 
                label: 'Invoice Received', 
                icon: <Receipt className="w-3 h-3" />,
                className: 'bg-[#F3E5F5] text-[#9C27B0] border-[#E1BEE7]',
                onClick: null
            };
        }
        return { 
            label: 'Ready to Bill', 
            icon: <Receipt className="w-3 h-3" />,
            className: 'bg-[#FFF3E0] text-[#EF6C00] border-[#FFE0B2]',
            onClick: null
        };
      case 'in-progress':
        return { 
            label: 'In Progress', 
            icon: <Clock className="w-3 h-3" />,
            className: 'bg-[#E3F2FD] text-[#2F80ED] border-[#90CAF9]',
            onClick: null
        };
      case 'delayed':
        return { 
            label: 'Delayed', 
            icon: <Clock className="w-3 h-3" />,
            className: 'bg-[#FEE2E2] text-[#EB5757] border-[#FCA5A5]',
            onClick: null
        };
      case 'draft':
        return { 
            label: 'Draft', 
            icon: <FilePlus className="w-3 h-3" />,
            className: 'bg-[#F3F4F6] text-[#666666] border-[#D1D5DB]',
            onClick: null
        };
      default:
        return { 
            label: 'To Do', 
            icon: <Clock className="w-3 h-3" />,
            className: 'bg-[#F3F4F6] text-[#6B7280] border-[#D1D5DB]',
            onClick: null
        };
    }
  };

  const statusConfig = getUnifiedStatusConfig();

  const getTimelineStatus = (dueDate?: string) => {
    if (!dueDate || dueDate === 'TBD') return null;
    const due = new Date(dueDate);
    if (isValidDate(due)) {
       if (isPast(due) && !isToday(due)) {
           const daysOverdue = differenceInDays(new Date(), due);
           return { text: `Overdue by ${daysOverdue} days`, color: 'text-[#DC2626]' };
       }
       if (isToday(due)) return { text: 'Deadline today', color: 'text-[#F59E0B]' };
       const daysLeft = differenceInDays(due, new Date());
       return { text: `${daysLeft} days to deadline`, color: 'text-[#666666]' };
    }
    return null;
  };

  // Helper to check valid date
  const isValidDate = (d: Date) => d instanceof Date && !isNaN(d.getTime());

  const timelineStatus = getTimelineStatus(requirement.dueDate);

  const getPendingStatusText = () => {
    if (requirement.type === 'outsourced') {
      // Receiver (B) messages
      if (requirement.isReceiver) {
        if (requirement.rawStatus === 'Waiting') {
          return 'Action Needed: Submit Quote';
        }
        if (requirement.rawStatus === 'Assigned') {
          return 'Action Needed: Map Workspace';
        }
        if (requirement.rawStatus === 'Review') {
          return `Quote submitted to ${requirement.headerContact || 'Client'}. Awaiting approval...`;
        }
      }
      // Sender (A) messages
      if (requirement.isSender) {
        if (requirement.rawStatus === 'Waiting') {
          return `Sent to ${requirement.headerContact || 'Vendor'}. Awaiting quote...`;
        }
        if (requirement.rawStatus === 'Review') {
          return `Quote received from ${requirement.headerContact || 'Vendor'}. Review and accept or reject.`;
        }
      }
    }
    // Fallback for other types
    return 'Waiting for approval...';
  };

  const getApproveButtonText = () => {
    if (requirement.type === 'outsourced') {
      if (requirement.isReceiver) {
        const s = requirement.rawStatus;
        if (s === 'Waiting') return 'Submit Quote';
        if (s === 'Rejected') return 'Resubmit Quote';
        if (s === 'Assigned' && !requirement.receiver_workspace_id) return 'Map Workspace';
        return 'Action Needed';
      }
      if (requirement.isSender) {
        return 'Accept Quote';
      }
      return 'Pending';
    }
    if (requirement.type === 'client') return 'Accept Job';
    return 'Approve';
  };

  const getCostDisplay = () => {
      const val = requirement.quotedPrice || requirement.estimatedCost || requirement.budget;
      return val ? `$${Number(val).toLocaleString()}` : null;
  };
  
  const costDisplay = getCostDisplay();
  

  return (
    <div
      onClick={onNavigate}
      className={`group border rounded-[20px] p-5 hover:border-[#ff3b3b]/20 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col relative w-full
        ${selected 
            ? 'border-[#ff3b3b] shadow-[0_0_0_1px_#ff3b3b] bg-[#FFF5F5]' 
            : isPending 
                ? 'border-dashed border-[#E5E7EB] bg-[#F9FAFB]' 
                : 'border-[#EEEEEE] bg-white'
        }
      `}
    >
      {/* Top Right Controls: Checkbox & More Options */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Checkbox */}
          <div className={`transition-opacity duration-200 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <Checkbox 
                checked={selected}
                onChange={(e) => { e.stopPropagation(); onSelect(); }}
                className="red-checkbox border-[#DDDDDD] bg-white hover:border-[#ff3b3b]"
            />
          </div>

          {/* More Options Menu */}
          <Popover
            open={isMenuOpen}
            onOpenChange={setIsMenuOpen}
            content={
              <div className="w-40" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    onEdit?.();
                  }} 
                  className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 rounded text-[#111111]"
                >
                  Edit Details
                </button>
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDuplicate?.();
                  }}
                  className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 rounded text-[#111111]"
                >
                  Duplicate
                </button>

                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDelete?.();
                  }}
                  className={`w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 rounded flex items-center gap-2 ${deleteLabel === 'Archive' ? 'text-[#F59E0B]' : 'text-[#ff3b3b]'}`}
                >
                  {deleteIcon || <Trash2 className="w-3.5 h-3.5" />}
                  {deleteLabel || 'Delete'}
                </button>
              </div>
            }
            trigger="click"
            placement="bottomRight"
            overlayClassName="requirement-card-popover"
            arrow={false}
          >
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    // Popover handles state
                }}
                className={`h-6 w-6 flex items-center justify-center rounded-full hover:bg-[#F7F7F7] text-[#999999] hover:text-[#111111] transition-all ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>
          </Popover>
      </div>

      {/* Header */}
      <div className="mb-3">
        {/* Context Row: [TYPE] | [Contact Name] | [Company Name] */}
        <div className="flex items-center gap-2 mb-2">
            {/* Type Badge: For outsourced reqs, receiver sees INHOUSE, sender sees OUTSOURCED */}
            <span className="px-1.5 py-0.5 rounded text-[9px] font-['Inter:Medium',sans-serif] bg-[#F5F5F5] text-[#666666] uppercase border border-[#EEEEEE] tracking-wide whitespace-nowrap">
                {requirement.type === 'outsourced' 
                  ? (requirement.isReceiver ? 'inhouse' : 'outsourced')
                  : (requirement.type || 'inhouse')}
            </span>

            {/* Contact Person Name - only show if available */}
            {requirement.headerContact && (
                <>
                    <span className="text-[#E5E5E5]">|</span>
                    <span className="font-['Manrope:Bold',sans-serif] text-[#111111] text-[11px] truncate max-w-[100px]" title={requirement.headerContact}>
                        {requirement.headerContact}
                    </span>
                </>
            )}
            
            {/* Company Name - Use headerCompany which is correctly computed, no hardcoded fallbacks */}
            {requirement.headerCompany && (
                <>
                    <span className="text-[#E5E5E5] shrink-0">|</span>
                    <span className="font-['Manrope:Bold',sans-serif] uppercase tracking-wider text-[#999999] text-[10px] truncate max-w-[100px]" title={requirement.headerCompany}>
                        {requirement.headerCompany}
                    </span>
                </>
            )}
        </div>

        {/* Title */}
        <div className="flex justify-between items-start gap-2 pr-16">
            <h3 className="font-['Manrope:Bold',sans-serif] text-[15px] leading-snug text-[#111111] group-hover:text-[#ff3b3b] transition-colors line-clamp-2">
            {requirement.title}
            </h3>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {requirement.departments && requirement.departments.length > 0 && requirement.departments.slice(0, 3).map((dept: string, i: number) => (
            <span key={i} className="px-1.5 py-0.5 rounded-md bg-white border border-[#E5E5E5] text-[10px] text-[#666666] font-['Inter:Medium',sans-serif]">
                {dept}
            </span>
        ))}
         {requirement.departments && requirement.departments.length > 3 && (
            <span className="px-1.5 py-0.5 text-[10px] text-[#999999]">+{requirement.departments.length - 3}</span>
        )}
      </div>

      {/* Date & Description */}
      <div className="mb-4">
        {(requirement.startDate || requirement.dueDate) && (
            <div className="flex items-center gap-2 text-[11px] text-[#666666] font-['Inter:Medium',sans-serif] mb-2 bg-[#F9FAFB] p-1.5 rounded-md w-fit max-w-full">
                <CalendarIcon className="w-3 h-3 text-[#999999] flex-shrink-0" />
                <span className="truncate">
                {requirement.startDate ? format(new Date(requirement.startDate), 'MMM d') : ''} 
                {requirement.startDate ? ' - ' : ''}
                {requirement.dueDate && requirement.dueDate !== 'TBD' ? format(new Date(requirement.dueDate), 'MMM d') : 'TBD'}
                </span>
                {timelineStatus && (
                    <span className={`pl-1 border-l border-[#E5E5E5] ${timelineStatus.color} whitespace-nowrap`}>
                        {timelineStatus.text}
                    </span>
                )}
            </div>
        )}
        <p className="text-[13px] text-[#666666] font-['Inter:Regular',sans-serif] line-clamp-3 leading-relaxed mb-0">
            {requirement.description}
        </p>
      </div>

      {/* Progress Section */}
      {!isPending && (
          <div className="mb-4 mt-auto">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-[#999999] font-['Inter:Medium',sans-serif]">
                Progress
              </span>
              <span className="text-[10px] text-[#111111] font-['Inter:Bold',sans-serif]">
                {requirement.progress}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  requirement.status === 'completed' 
                    ? 'bg-[#7ccf00]' 
                    : requirement.status === 'delayed'
                    ? 'bg-[#ff3b3b]' 
                    : 'bg-[#2F80ED]' 
                }`}
                style={{ width: `${requirement.progress}%` }}
              />
            </div>
          </div>
      )}

      {/* Pending Message */}
      {isPending && (
        <div className="mt-auto mb-4 min-h-[40px] flex items-center justify-center text-[12px] text-[#999999] italic bg-[#F9FAFB] rounded-lg border border-dashed border-[#E5E7EB] mx-1 px-2 text-center">
            {getPendingStatusText()}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-[#EEEEEE] flex items-center justify-between mt-auto">
        
        {/* Left: Priority & Assignees */}
        <div className="flex items-center gap-2">
            {/* Priority Badge */}
            <div className={`w-2 h-2 rounded-full ${
                requirement.priority === 'high' || requirement.is_high_priority ? 'bg-[#ff3b3b]' :
                requirement.priority === 'medium' ? 'bg-[#F59E0B]' :
                'bg-[#3B82F6]'
            }`} title={`Priority: ${requirement.priority || (requirement.is_high_priority ? 'High' : 'Normal')}`} />

            {/* Assignees */}
            <div className="flex -space-x-1.5">
            {(requirement.assignedTo || []).slice(0, 3).map((person: string, i: number) => (
                <div 
                key={i} 
                className="w-5 h-5 rounded-full bg-[#F7F7F7] border border-white flex items-center justify-center text-[8px] font-bold text-[#666666] relative z-[3] hover:z-10 hover:scale-110 transition-all shadow-sm"
                title={person}
                >
                {person.charAt(0).toUpperCase()}
                </div>
            ))}
            </div>
        </div>

        {/* Right: Status or Action */}
        <div className="flex items-center gap-3">
          {costDisplay && (
             <span className={`text-[12px] font-['Manrope:Bold',sans-serif] ${requirement.type === 'outsourced' ? 'text-[#ff3b3b]' : 'text-[#7ccf00]'}`}>
                {costDisplay}
             </span>
          )}

          {isPending ? (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              {/* Show reject button with role-based logic */}
              {/* Receiver can reject in Waiting, Sender can reject in Review */}
              {((requirement.isReceiver && requirement.rawStatus === 'Waiting') || 
                (requirement.isSender && requirement.rawStatus === 'Review')) && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onReject?.(); }}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-[#ff3b3b] text-[#ff3b3b] hover:bg-[#ff3b3b] hover:text-white transition-all shadow-sm"
                  title="Reject"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              {/* Only show accept/approve button if there is an action for the current user */}
              {((requirement.isReceiver && (requirement.rawStatus === 'Waiting' || requirement.rawStatus === 'Rejected' || (requirement.rawStatus === 'Assigned' && !requirement.receiver_workspace_id))) || 
                (requirement.isSender && requirement.rawStatus === 'Review') ||
                (!requirement.type || requirement.type === 'inhouse' || requirement.type === 'client')) && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onAccept?.(); }}
                  className="px-2 h-6 flex items-center justify-center rounded-full bg-[#7ccf00] text-white hover:bg-[#6bb800] transition-all shadow-sm text-[10px] font-bold whitespace-nowrap"
                  title="Approve"
                >
                  {getApproveButtonText()}
                </button>
              )}
            </div>
          ) : (
             <div 
                className={`
                    flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-['Manrope:Bold',sans-serif] border transition-all
                    ${statusConfig.className}
                `}
             >
                <span className="capitalize">{statusConfig.label}</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
