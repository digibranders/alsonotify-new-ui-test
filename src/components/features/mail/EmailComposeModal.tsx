import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Tooltip, ConfigProvider } from 'antd';
import { 
  X, Minimize2, Maximize2, Paperclip, Image as ImageIcon, Trash2, 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, 
  List, ListOrdered, Quote, Code, Eraser, Smile 
} from 'lucide-react';
import { RichTextEditor, formatText } from '../../common/RichTextEditor';
import { EmailInput, ContactOption } from './EmailInput';

interface EmailComposeModalProps {
  open: boolean;
  onClose: () => void;
  onSend: (data: { to: string[]; cc: string[]; bcc: string[]; subject: string; body: string }) => Promise<void>;
  initialData?: {
    to?: string[];
    cc?: string[];
    bcc?: string[];
    subject?: string;
    body?: string;
  };
  autocompleteOptions: ContactOption[];
}

export function EmailComposeModal({ open, onClose, onSend, initialData, autocompleteOptions }: EmailComposeModalProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Responsive width tracking
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Calculate modal styles based on state
  const getModalStyles = () => {
    if (isMobile) {
      return {
        top: 0,
        margin: 0,
        maxWidth: '100vw',
        height: '100vh',
        width: '100%',
      };
    }

    if (isMaximized) {
      // Gmail Expanded Style: Large centered, rounded, shadow, not full screen edge-to-edge
      return {
        top: undefined, // Let Ant Design center it
        margin: '0 auto',
        maxWidth: '96vw', // Slightly wider for better space
        width: '90vw', 
        height: '85vh', 
        paddingBottom: 0
      };
    }

    // Normal State (Now centered and larger as requested)
    return {
      top: undefined,
      margin: '0 auto',
      maxWidth: '96vw', 
      width: 800, // Increased from 600
      height: '80vh', // Fixed height for spacious feel
      paddingBottom: 0
    };
  };
  
  const modalStyles = getModalStyles();

  // Initialize with data when opened
  useEffect(() => {
    if (open && initialData) {
      setTo(initialData.to || []);
      setCc(initialData.cc || []);
      setBcc(initialData.bcc || []);
      setSubject(initialData.subject || "");
      setBody(initialData.body || "");
      
      if (initialData.cc?.length) setShowCc(true);
      if (initialData.bcc?.length) setShowBcc(true);
    }
  }, [open, initialData]);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSend({ to, cc, bcc, subject, body });
      onClose();
      // Reset after close (with tiny delay)
      setTimeout(() => {
        setTo([]); setCc([]); setBcc([]); setSubject(""); setBody(""); setIsSending(false);
      }, 500);
    } catch {
      setIsSending(false);
    }
  };

  interface FormatBtnProps {
    icon: React.ElementType;
    title: string;
    cmd: string;
    active?: boolean;
  }

  const FormatBtn = ({ icon: Icon, title, cmd, active }: FormatBtnProps) => (
    <Tooltip title={title}>
      <button
        onClick={() => formatText(cmd)}
        className={`p-1.5 rounded hover:bg-black/5 text-[#555] transition-colors ${active ? 'bg-black/10 text-black' : ''}`}
      >
        <Icon size={16} strokeWidth={2} />
      </button>
    </Tooltip>
  );

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            contentBg: 'transparent',
            boxShadow: 'none',
          },
        },
      }}
    >
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      centered={!isMobile} // Center both states on desktop
      maskClosable={false}
      mask={true} // Always show mask
      styles={{
        body: { padding: 0 },
        mask: { 
          backgroundColor: 'rgba(0,0,0,0.45)', // Consistent dimmed color
          backdropFilter: 'blur(4px)', // Add blur effect
          WebkitBackdropFilter: 'blur(4px)',
        }
      }}
      wrapClassName="clean-modal-wrapper" // Remove pointer-events-none as we now have a blocking mask
      getContainer={false} // Optional: keep in place if needed, or remove. keeping standard.
      style={{ 
        top: modalStyles.top, 
        margin: modalStyles.margin, 
        maxWidth: modalStyles.maxWidth,
        paddingBottom: 0
      }}
      width={modalStyles.width}
    >
      <div 
        className={`flex flex-col bg-white overflow-hidden transition-all duration-200 pointer-events-auto
          ${isMobile ? 'h-[100vh] w-full rounded-none' : ''}
          ${!isMobile && isMaximized ? 'h-[85vh] rounded-xl shadow-2xl border border-gray-200' : ''}
          ${!isMobile && !isMaximized ? 'h-[80vh] rounded-xl shadow-xl border border-gray-200' : ''}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border-b border-[#f0f0f0] shrink-0">
          <span className="font-['Manrope:Bold'] text-[14px] text-[#111]">New Message</span>
          <div className="flex items-center gap-1">
            <button className="p-1 hover:bg-black/5 rounded text-[#555]" onClick={() => setIsMaximized(!isMaximized)}>
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button className="p-1 hover:bg-black/5 rounded text-[#555]" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="flex-col shrink-0">
           {/* To */}
           <div className="flex items-start px-2 py-1 border-b border-[#f0f0f0] group focus-within:ring-1 focus-within:ring-blue-100 z-10 relative">
             <span className="text-[14px] text-[#555] pt-1.5 pl-2 w-[40px] shrink-0">To</span>
             <div className="flex-1 min-w-0">
               <EmailInput 
                 value={to} 
                 onChange={setTo} 
                 options={autocompleteOptions} 
                 placeholder="" 
               />
             </div>
             <div className="pt-1.5 pr-2 flex items-center gap-2">
                {!showCc && <span role="button" onClick={() => setShowCc(true)} className="text-[13px] text-[#555] hover:underline cursor-pointer">Cc</span>}
                {!showBcc && <span role="button" onClick={() => setShowBcc(true)} className="text-[13px] text-[#555] hover:underline cursor-pointer">Bcc</span>}
             </div>
           </div>

           {/* Cc */}
           {showCc && (
             <div className="flex items-center px-2 py-1 border-b border-[#f0f0f0]">
               <span className="text-[14px] text-[#555] pl-2 w-[40px] shrink-0">Cc</span>
                <EmailInput 
                    value={cc} 
                    onChange={setCc} 
                    options={autocompleteOptions} 
                />
             </div>
           )}

           {/* Bcc */}
           {showBcc && (
             <div className="flex items-center px-2 py-1 border-b border-[#f0f0f0]">
               <span className="text-[14px] text-[#555] pl-2 w-[40px] shrink-0">Bcc</span>
                <EmailInput 
                    value={bcc} 
                    onChange={setBcc} 
                    options={autocompleteOptions} 
                />
             </div>
           )}

           {/* Subject */}
           <div className="border-b border-[#f0f0f0]">
             <Input 
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Subject" 
                variant="borderless"
                className="px-4 py-2.5 text-[14px] !border-0 !shadow-none !bg-transparent hover:!bg-transparent focus:!bg-transparent"
             />
           </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto flex flex-col relative" onClick={() => document.querySelector<HTMLElement>('.rich-text-editor')?.focus()}>
           <RichTextEditor
             value={body}
             onChange={setBody}
             placeholder=""
             style={{ 
               minHeight: '100%',
               padding: '16px',
               fontSize: '14px'
             }}
           />
        </div>

        {/* Formatting Toolbar */}
        <div className="shrink-0 px-2 py-2 border-t border-[#f0f0f0] flex items-center gap-1 overflow-x-auto scrollbar-hide bg-white">
           <FormatBtn icon={Bold} cmd="bold" title="Bold" />
           <FormatBtn icon={Italic} cmd="italic" title="Italic" />
           <FormatBtn icon={Underline} cmd="underline" title="Underline" />
           <div className="w-[1px] h-4 bg-gray-200 mx-1" />
           <FormatBtn icon={AlignLeft} cmd="justifyLeft" title="Align Left" />
           <FormatBtn icon={AlignCenter} cmd="justifyCenter" title="Align Center" />
           <FormatBtn icon={AlignRight} cmd="justifyRight" title="Align Right" />
           <div className="w-[1px] h-4 bg-gray-200 mx-1" />
           <FormatBtn icon={List} cmd="list" title="Bullet List" />
           <FormatBtn icon={ListOrdered} cmd="insertOrderedList" title="Numbered List" />
           <FormatBtn icon={Quote} cmd="quote" title="Quote" />
           <FormatBtn icon={Code} cmd="code" title="Code Block" />
           <div className="w-[1px] h-4 bg-gray-200 mx-1" />
           <FormatBtn icon={Eraser} cmd="removeFormat" title="Remove Formatting" />
        </div>

        {/* Footer (Send & Attach) */}
        <div className="shrink-0 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
             <Button 
               type="primary" 
               className="rounded-full px-6 bg-[#0B57D0] hover:bg-[#0B57D0]/90 font-semibold"
               onClick={handleSend}
               loading={isSending}
             >
               Send
             </Button>
             
             <Tooltip title="Attach files (demo)">
                <button className="p-2 hover:bg-black/5 rounded-full text-[#555] transition-colors">
                    <Paperclip size={18} />
                </button>
             </Tooltip>
             <Tooltip title="Insert image (demo)">
                <button className="p-2 hover:bg-black/5 rounded-full text-[#555] transition-colors">
                    <ImageIcon size={18} />
                </button>
             </Tooltip>
             <Tooltip title="Insert emoji (demo)">
                <button className="p-2 hover:bg-black/5 rounded-full text-[#555] transition-colors">
                    <Smile size={18} />
                </button>
             </Tooltip>
          </div>

          <div>
             <Tooltip title="Discard draft">
                <button className="p-2 hover:bg-black/5 rounded text-[#555] transition-colors hover:text-red-500" onClick={onClose}>
                    <Trash2 size={16} />
                </button>
             </Tooltip>
          </div>
        </div>
      </div>

    </Modal>
    </ConfigProvider>
  );
}
