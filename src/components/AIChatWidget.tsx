import { useState } from "react";
import { MessageCircle, X, Send, Sparkles, CheckCircle2, Clock } from "lucide-react";

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  // Mock conversation data
  const mockConversation = [
    {
      type: "user",
      text: "Is there any new work on my desk?",
      timestamp: "2:45 PM"
    },
    {
      type: "ai",
      text: "There's a new client requirement from Acme Corp for a website redesign project. Do you want me to create new tasks & assign it to the team?",
      timestamp: "2:45 PM",
      actions: [
        { label: "Create Tasks", type: "primary" },
        { label: "View Details", type: "secondary" }
      ]
    },
    {
      type: "user",
      text: "Yes, create tasks",
      timestamp: "2:46 PM"
    },
    {
      type: "ai",
      text: "Perfect! I've created 5 tasks for the website redesign project and assigned them to your team. Would you like to start the timer for your first task 'Design System Planning'?",
      timestamp: "2:46 PM",
      taskCreated: {
        title: "Design System Planning",
        assignee: "You",
        duration: "2-3 hours"
      },
      actions: [
        { label: "Start Timer", type: "primary", icon: Clock },
        { label: "View All Tasks", type: "secondary" }
      ]
    }
  ];

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="relative">
          {/* Pulsing ring animation */}
          <div className="absolute inset-0 rounded-full bg-[#ff3b3b] animate-ping opacity-20" />
          
          {/* Main button */}
          <div className="relative bg-gradient-to-br from-[#ff3b3b] via-[#ff5252] to-[#cc2f2f] rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95">
            <MessageCircle className="w-7 h-7 text-white" strokeWidth={2} />
            
            {/* AI indicator */}
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
              <Sparkles className="w-3 h-3 text-[#ff3b3b] fill-[#ff3b3b]" />
            </div>

            {/* Notification badge */}
            <div className="absolute -top-1 -left-1 w-5 h-5 bg-[#000000] rounded-full flex items-center justify-center">
              <span className="text-[10px] font-['Manrope:Bold',sans-serif] text-white">1</span>
            </div>
          </div>
        </div>
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isOpen 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-[24px] shadow-2xl w-[420px] h-[600px] flex flex-col overflow-hidden border border-[#EEEEEE]">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#ff3b3b] via-[#ff5252] to-[#cc2f2f] p-6 shadow-[4px_4px_7px_0px_inset_rgba(255,255,255,0.3)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white fill-white" />
                </div>
                <div>
                  <h3 className="font-['Manrope:Bold',sans-serif] text-white text-[16px]">
                    AI Assistant
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse" />
                    <p className="text-white/80 text-[12px] font-['Inter:Regular',sans-serif]">
                      Online
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#F7F7F7] space-y-4">
            {mockConversation.map((msg, index) => (
              <div key={index}>
                {msg.type === "user" ? (
                  <UserMessage text={msg.text} timestamp={msg.timestamp} />
                ) : (
                  <AIMessage 
                    text={msg.text} 
                    timestamp={msg.timestamp}
                    actions={msg.actions}
                    taskCreated={msg.taskCreated}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-[#EEEEEE]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 bg-[#F7F7F7] rounded-full px-4 py-3 text-[14px] font-['Inter:Regular',sans-serif] text-[#111111] placeholder:text-[#999999] focus:outline-none focus:ring-2 focus:ring-[#ff3b3b]/20"
              />
              <button className="bg-gradient-to-br from-[#ff3b3b] to-[#cc2f2f] w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              <QuickAction text="Show my tasks" />
              <QuickAction text="Start timer" />
              <QuickAction text="Team status" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function UserMessage({ text, timestamp }: { text: string; timestamp: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%]">
        <div className="bg-gradient-to-br from-[#ff3b3b] to-[#cc2f2f] rounded-[16px] rounded-tr-[4px] px-4 py-3 shadow-sm">
          <p className="text-white text-[14px] font-['Inter:Regular',sans-serif] leading-relaxed">
            {text}
          </p>
        </div>
        <p className="text-[11px] text-[#999999] mt-1 text-right font-['Inter:Regular',sans-serif]">
          {timestamp}
        </p>
      </div>
    </div>
  );
}

function AIMessage({ 
  text, 
  timestamp, 
  actions, 
  taskCreated 
}: { 
  text: string; 
  timestamp: string;
  actions?: Array<{ label: string; type: string; icon?: any }>;
  taskCreated?: { title: string; assignee: string; duration: string };
}) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="bg-white rounded-[16px] rounded-tl-[4px] px-4 py-3 shadow-sm border border-[#EEEEEE]">
          <p className="text-[#111111] text-[14px] font-['Inter:Regular',sans-serif] leading-relaxed">
            {text}
          </p>

          {/* Task Created Card */}
          {taskCreated && (
            <div className="mt-3 p-3 bg-[#FEF3F2] rounded-[12px] border border-[#ff3b3b]/20">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#ff3b3b] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[13px] font-['Manrope:SemiBold',sans-serif] text-[#111111]">
                    {taskCreated.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-[#666666] font-['Inter:Regular',sans-serif]">
                      Assigned to: {taskCreated.assignee}
                    </span>
                    <span className="text-[11px] text-[#666666] font-['Inter:Regular',sans-serif]">
                      Est: {taskCreated.duration}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {actions && (
            <div className="flex gap-2 mt-3">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-['Manrope:SemiBold',sans-serif] transition-all
                    ${action.type === 'primary'
                      ? 'bg-[#ff3b3b] text-white hover:bg-[#cc2f2f] shadow-sm'
                      : 'bg-[#F7F7F7] text-[#666666] hover:bg-[#EEEEEE]'
                    }
                  `}
                >
                  {action.icon && <action.icon className="w-3 h-3" />}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-[11px] text-[#999999] mt-1 font-['Inter:Regular',sans-serif]">
          {timestamp}
        </p>
      </div>
    </div>
  );
}

function QuickAction({ text }: { text: string }) {
  return (
    <button className="px-3 py-1.5 bg-white border border-[#EEEEEE] rounded-full text-[12px] text-[#666666] font-['Manrope:SemiBold',sans-serif] hover:border-[#ff3b3b] hover:text-[#ff3b3b] transition-all whitespace-nowrap flex-shrink-0">
      {text}
    </button>
  );
}
