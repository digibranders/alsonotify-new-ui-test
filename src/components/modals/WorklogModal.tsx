import { useState } from "react";
import { Button, Input, App } from 'antd';
import { FileText } from 'lucide-react';

const { TextArea } = Input;

interface WorklogModalProps {
  onSubmit: (description: string) => void;
  onCancel: () => void;
  title?: string;
  actionType?: 'stuck' | 'complete';
}

export function WorklogModal({
  onSubmit,
  onCancel,
  title,
  actionType = 'complete'
}: WorklogModalProps) {
  const { message } = App.useApp();
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!description.trim()) {
      message.error("Worklog description is required");
      return;
    }

    setIsSubmitting(true);
    onSubmit(description.trim());
    // Note: The parent component should handle resetting isSubmitting
  };

  const modalTitle = title || (actionType === 'stuck' ? 'Mark as Stuck' : 'Mark as Complete');
  const submitLabel = actionType === 'stuck' ? 'Mark Stuck' : 'Mark Complete';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b border-[#EEEEEE] px-6 py-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[20px] font-['Manrope:Bold',sans-serif] text-[#111111]">
            <div className="p-2 rounded-full bg-[#F7F7F7]">
              <FileText className="w-5 h-5 text-[#666666]" />
            </div>
            {modalTitle}
          </div>
        </div>
        <p className="text-[13px] text-[#666666] font-['Manrope:Regular',sans-serif] ml-11">
          {actionType === 'stuck' 
            ? 'Add a worklog describing what\'s blocking you.' 
            : 'Add a worklog describing what you completed.'}
        </p>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-5">
          {/* Worklog Description */}
          <div className="space-y-2">
            <span className="text-[13px] font-['Manrope:Bold',sans-serif] text-[#111111]">
              Worklog Description <span className="text-red-500">*</span>
            </span>
            <TextArea
              placeholder={actionType === 'stuck' 
                ? "Describe what's blocking you or what challenge you're facing..."
                : "Describe what you completed or worked on..."}
              className="min-h-[120px] rounded-lg border-[#EEEEEE] focus:border-[#ff3b3b] font-['Manrope:Regular',sans-serif] text-[14px] resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={1000}
              showCount
            />
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="flex-shrink-0 border-t border-[#EEEEEE] px-6 py-4 flex items-center justify-end gap-3">
        <Button
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-11 px-6 rounded-lg border border-[#EEEEEE] text-[#666666] font-['Manrope:SemiBold',sans-serif] text-[14px] hover:bg-[#F7F7F7] hover:border-[#DDDDDD] transition-all"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="h-11 px-6 rounded-lg bg-gradient-to-r from-[#ff3b3b] to-[#cc2f2f] text-white font-['Manrope:SemiBold',sans-serif] text-[14px] hover:from-[#cc2f2f] hover:to-[#aa2525] transition-all shadow-sm"
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

