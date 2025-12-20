import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { generateAgentResponse } from "@/services/assistant";
import { App } from "antd";

// Note: Install react-markdown and remark-gfm if not already installed:
// npm install react-markdown remark-gfm

// Temporarily using a simple markdown renderer until packages are installed
// Uncomment the ReactMarkdown import once packages are installed:
// import ReactMarkdown, { Components } from "react-markdown";
// import remarkGfm from "remark-gfm";

type ChatMessage = {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const SUGGESTED_PROMPTS = [
  { label: "Requirements", prompt: "Give me all the requirements for the project." },
  { label: "Tasks", prompt: "List down all my tasks for today." },
  { label: "Leaves", prompt: "Show the approved leave requests for this month." },
];

export function AIChatWidget() {
  const { message } = App.useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-message",
      type: "assistant",
      content: "Hello! 👋 I am the Alsonotify Agent. I'm here to help you with your tasks, leaves, reports, and more. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: { prompt: string; history: { role: "user" | "assistant"; content: string }[] }) =>
      generateAgentResponse(data.prompt, data.history),
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Markdown components (uncomment when ReactMarkdown is installed)
  // const markdownComponents = useMemo<Components>(
  //   () => ({
  //     p: ({ children }) => (
  //       <p className="mb-3 whitespace-pre-wrap text-xs leading-relaxed text-[#111111] last:mb-0">{children}</p>
  //     ),
  //     strong: ({ children }) => (
  //       <strong className="font-bold text-[#111111]">{children}</strong>
  //     ),
  //     ul: ({ children }) => (
  //       <ul className="mb-3 list-disc space-y-2 pl-4 text-xs leading-relaxed text-[#111111] last:mb-0">
  //         {children}
  //       </ul>
  //     ),
  //     ol: ({ children }) => (
  //       <ol className="mb-3 list-decimal space-y-2 pl-4 text-xs leading-relaxed text-[#111111] last:mb-0">
  //         {children}
  //       </ol>
  //     ),
  //     li: ({ children }) => (
  //       <li className="pl-1 whitespace-pre-wrap">{children}</li>
  //     ),
  //     a: ({ href, children }) => (
  //       <a
  //         href={href ?? "#"}
  //         target="_blank"
  //         rel="noreferrer"
  //         className="font-medium text-blue-600 underline hover:text-blue-800"
  //       >
  //         {children}
  //       </a>
  //     ),
  //     table: ({ children }) => (
  //       <div className="my-3 w-full overflow-x-auto rounded-lg border border-slate-200">
  //         <table className="w-full min-w-full divide-y divide-slate-200 text-left text-xs">
  //           {children}
  //         </table>
  //       </div>
  //     ),
  //     thead: ({ children }) => (
  //       <thead className="bg-slate-50 font-semibold text-[#111111]">
  //         {children}
  //       </thead>
  //     ),
  //     tbody: ({ children }) => (
  //       <tbody className="divide-y divide-slate-200 bg-white">
  //         {children}
  //       </tbody>
  //     ),
  //     tr: ({ children }) => (
  //       <tr className="hover:bg-slate-50/50 transition-colors">
  //         {children}
  //       </tr>
  //     ),
  //     th: ({ children }) => (
  //       <th className="px-3 py-2 font-semibold text-[#111111] whitespace-nowrap">
  //         {children}
  //       </th>
  //     ),
  //     td: ({ children }) => (
  //       <td className="px-3 py-2 text-[#666666] whitespace-normal">
  //         {children}
  //       </td>
  //     ),
  //   }),
  //   []
  // );

  const handleSubmit = async (incoming?: string) => {
    const query = (incoming ?? prompt).trim();
    if (!query || isPending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");

    // Prepare History (Last 6 valid messages) excluding the current one we just added
    const history = messages
      .filter((m) => m.type === "user" || m.type === "assistant")
      .slice(-6)
      .map((m) => ({
        role: m.type,
        content: m.content,
      }));

    try {
      const result = await mutateAsync({ prompt: query, history });

      if (result.error) {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: result.error,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        message.error(result.error);
        return;
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: result.answer ?? "I couldn't generate a response for that request.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AIChatWidget handleSubmit error", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Unable to reach the assistant. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      message.error("Unable to reach the assistant. Please try again.");
    }
  };

  const handlePromptSelect = (value: string) => {
    if (isPending) return;
    setPrompt(value);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
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
          </div>
        </div>
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isOpen
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
                    <p className="text-white/80 text-[12px] font-['Manrope:Regular',sans-serif]">
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
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-[16px] px-4 py-3 ${message.type === "user"
                      ? "bg-gradient-to-br from-[#ff3b3b] to-[#cc2f2f] rounded-tr-[4px]"
                      : "bg-white border border-[#EEEEEE] rounded-tl-[4px]"
                      }`}
                  >
                    {message.type === "assistant" ? (
                      <div className="markdown-response whitespace-pre-wrap text-xs text-[#111111]">
                        {/* Uncomment when ReactMarkdown is installed:
                        <ReactMarkdown
                          components={markdownComponents}
                          remarkPlugins={[remarkGfm]}
                        >
                          {message.content}
                        </ReactMarkdown>
                        */}
                        {/* Temporary: Simple text rendering until ReactMarkdown is installed */}
                        <div className="whitespace-pre-wrap text-[14px] font-['Manrope:Regular',sans-serif] leading-relaxed">
                          {message.content}
                        </div>
                      </div>
                    ) : (
                      <p className="text-white text-[14px] font-['Manrope:Regular',sans-serif] leading-relaxed">
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {isPending && (
                <div className="flex justify-start">
                  <div className="rounded-[16px] bg-white border border-[#EEEEEE] px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-[#666666]">
                      <Loader2 className="h-4 w-4 animate-spin text-[#ff3b3b]" />
                      <span>Fetching fresh data...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts */}
          <div className="border-t border-[#EEEEEE] px-4 py-3 bg-white">
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((chip) => (
                <button
                  key={chip.label}
                  className="rounded-full border border-[#EEEEEE] bg-white px-3 py-1.5 text-xs font-medium text-[#111111] transition hover:border-[#ff3b3b] hover:bg-[#ff3b3b] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => handlePromptSelect(chip.prompt)}
                  disabled={isPending}
                  aria-label={`Quick prompt for ${chip.label}`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <form
            className="p-4 bg-white border-t border-[#EEEEEE]"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                className="h-20 flex-1 resize-none rounded-[16px] border border-[#EEEEEE] bg-[#F7F7F7] px-4 py-3 text-sm text-[#111111] outline-none transition focus:border-[#ff3b3b] focus:ring-2 focus:ring-[#ff3b3b]/20"
                placeholder="Ask anything about your workspace data..."
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isPending}
              />
              <button
                type="submit"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#ff3b3b] to-[#cc2f2f] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 shadow-md"
                disabled={isPending || !prompt.trim()}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

