import { PageLayout } from '../../layout/PageLayout';
import { useState } from 'react';
import { FilterBar, FilterOption } from '../../ui/FilterBar';
import { Plus, Bold, Italic, List, CheckSquare, MoreVertical, Archive, Trash2 } from 'lucide-react';
import { Modal, Input, Button, Checkbox, Dropdown } from 'antd';
import type { MenuProps } from 'antd';

const { TextArea } = Input;

interface Note {
  id: number;
  title: string;
  content: string | null;
  color: string;
  type: 'text' | 'checklist';
  hasFormatting?: boolean;
  items?: Array<{ text: string; checked: boolean }>;
  dateCreated: string;
}

const notesData: Note[] = [
  {
    id: 1,
    title: "Design Sprint Goals",
    content: "Finalize wireframes for mobile app\nComplete user flow diagrams\nPrepare presentation deck",
    color: "#ff3b3b",
    type: "text",
    hasFormatting: true,
    dateCreated: "Nov 18, 2024"
  },
  {
    id: 2,
    title: "Client Deliverables",
    content: null,
    color: "#3b8eff",
    type: "checklist",
    dateCreated: "Nov 17, 2024",
    items: [
      { text: "Updated brand guidelines", checked: true },
      { text: "Q4 marketing strategy", checked: false },
      { text: "Social media content calendar", checked: false }
    ]
  },
  {
    id: 3,
    title: "Team Meeting Notes",
    content: "Discussed new project timeline with stakeholders. Key decision: Launch moved to Dec 15th. Action items assigned to team leads.",
    color: "#9b59b6",
    type: "text",
    hasFormatting: false,
    dateCreated: "Nov 16, 2024"
  },
  {
    id: 4,
    title: "Weekly Tasks",
    content: null,
    color: "#FFA500",
    type: "checklist",
    dateCreated: "Nov 15, 2024",
    items: [
      { text: "Review design mockups", checked: true },
      { text: "Client feedback call", checked: true },
      { text: "Update project roadmap", checked: false },
      { text: "Team retrospective", checked: false }
    ]
  },
  {
    id: 5,
    title: "Product Ideas",
    content: "Explore AI integration for the dashboard\nAdd dark mode support\nImplement real-time collaboration features",
    color: "#2ecc71",
    type: "text",
    hasFormatting: false,
    dateCreated: "Nov 14, 2024"
  },
  {
    id: 6,
    title: "Shopping List",
    content: null,
    color: "#e74c3c",
    type: "checklist",
    dateCreated: "Nov 13, 2024",
    items: [
      { text: "Office supplies", checked: false },
      { text: "Team lunch ingredients", checked: false },
      { text: "Printer paper", checked: true }
    ]
  },
];

export function NotesPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'text' | 'checklist'>('all');
  const [searchQuery, setSearchQuery] = useState('');;
  const [showDialog, setShowDialog] = useState(false);
  const [notes, setNotes] = useState<Note[]>(notesData);

  const filteredNotes = notes.filter(note => {
    const matchesTab = activeTab === 'all' || note.type === activeTab;
    const matchesSearch = searchQuery === '' ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const toggleNoteItem = (noteId: number, itemIndex: number) => {
    setNotes(notes.map(note => {
      if (note.id === noteId && note.type === 'checklist' && note.items) {
        const updatedItems = [...note.items];
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], checked: !updatedItems[itemIndex].checked };
        return { ...note, items: updatedItems };
      }
      return note;
    }));
  };

  return (
    <>
      <PageLayout
        title="Notes"
        tabs={[
          { id: 'all', label: 'All Notes', count: notes.length },
          { id: 'text', label: 'Text Notes', count: notes.filter(n => n.type === 'text').length },
          { id: 'checklist', label: 'Checklists', count: notes.filter(n => n.type === 'checklist').length }
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'all' | 'text' | 'checklist')}
        titleAction={{
          onClick: () => setShowDialog(true)
        }}
        searchPlaceholder="Search notes by title or con..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      >
        {/* Notes Grid - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-6 pb-4">
            {filteredNotes.map((note) => (
              <NoteCard key={note.id} note={note} onToggleItem={toggleNoteItem} />
            ))}
          </div>
        </div>
      </PageLayout>

      {/* Add Note Modal */}
      <Modal
        open={showDialog}
        onCancel={() => setShowDialog(false)}
        footer={null}
        width={500}
        centered
        className="rounded-[16px] overflow-hidden"
      >
        <div className="border-b border-[#EEEEEE] mb-6 pb-4">
          <h2 className="font-['Manrope:Bold',sans-serif] text-[24px] text-[#111111]">Add Note</h2>
          <p className="font-['Manrope:Regular',sans-serif] text-[14px] text-[#666666] mt-1">Create a new sticky note for quick reminders and tasks.</p>
        </div>
        <div className="space-y-4">
          <div>
            <span className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-2 block">Title</span>
            <Input placeholder="Note title" className="rounded-lg font-['Manrope:Medium',sans-serif]" />
          </div>
          <div>
            <div className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-2 flex items-center justify-between">
              <span>Content</span>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-[#F7F7F7] rounded transition-colors" title="Bold">
                  <Bold className="size-4 text-[#666666]" />
                </button>
                <button className="p-1 hover:bg-[#F7F7F7] rounded transition-colors" title="Italic">
                  <Italic className="size-4 text-[#666666]" />
                </button>
                <button className="p-1 hover:bg-[#F7F7F7] rounded transition-colors" title="List">
                  <List className="size-4 text-[#666666]" />
                </button>
                <button className="p-1 hover:bg-[#F7F7F7] rounded transition-colors" title="Checklist">
                  <CheckSquare className="size-4 text-[#666666]" />
                </button>
              </div>
            </div>
            <TextArea placeholder="Note content..." className="rounded-lg min-h-[120px] font-['Manrope:Regular',sans-serif]" />
          </div>
          <div>
            <span className="text-[14px] font-['Manrope:Medium',sans-serif] text-[#666666] mb-2 block">Color</span>
            <div className="flex gap-2">
              {['#ff3b3b', '#3b8eff', '#9b59b6', '#FFA500', '#2ecc71', '#e74c3c'].map((color) => (
                <button
                  key={color}
                  className="w-10 h-10 rounded-lg border-2 border-transparent hover:border-[#ff3b3b] transition-colors"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={() => setShowDialog(false)} className="flex-1 rounded-full h-10 border-[#EEEEEE] text-[#666666] font-['Manrope:SemiBold',sans-serif]">
              Cancel
            </Button>
            <Button type="primary" onClick={() => setShowDialog(false)} className="flex-1 rounded-full h-10 bg-[#ff3b3b] hover:bg-[#cc2f2f] text-white font-['Manrope:SemiBold',sans-serif] border-none">
              Add Note
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function NoteCard({ note, onToggleItem }: {
  note: Note;
  onToggleItem: (noteId: number, itemIndex: number) => void;
}) {

  const items: MenuProps['items'] = [
    {
      key: 'archive',
      label: 'Archive',
      icon: <Archive className="size-3.5" />,
      className: "text-[13px] font-['Manrope:Medium',sans-serif]"
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="size-3.5" />,
      danger: true,
      className: "text-[13px] font-['Manrope:Medium',sans-serif]"
    },
  ];

  return (
    <div className="relative group h-[220px]">
      {/* Card with white background */}
      <div className="relative h-full bg-white rounded-xl border border-[#EEEEEE] hover:border-[#ff3b3b]/20 hover:shadow-lg transition-all duration-300 cursor-pointer p-4 flex flex-col">
        {/* Header with action buttons */}
        <div className="flex items-start justify-between mb-2 gap-2">
          {/* Title */}
          <h4 className="font-['Manrope:SemiBold',sans-serif] text-[16px] text-[#111111] flex-1 leading-tight group-hover:text-[#ff3b3b] transition-colors">
            {note.title}
          </h4>

          {/* Three-dot menu - appears on hover */}
          <Dropdown menu={{ items }} trigger={['click']}>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#F7F7F7] rounded-md flex-shrink-0 -mr-2 -mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="size-4 text-[#666666]" strokeWidth={2} />
            </button>
          </Dropdown>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {note.type === 'text' && note.content && (
            <p className="font-['Inter:Regular',sans-serif] text-[13px] text-[#666666] line-clamp-[8] whitespace-pre-line leading-relaxed">
              {note.content}
            </p>
          )}

          {note.type === 'checklist' && note.items && (
            <div className="flex flex-col gap-2.5">
              {note.items.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Checkbox
                    checked={item.checked}
                    onChange={() => onToggleItem(note.id, index)}
                    className="mt-0.5 custom-checkbox-wrapper"
                  />
                  <span className={`font-['Inter:Regular',sans-serif] text-[13px] flex-1 leading-tight ${item.checked ? 'line-through text-[#999999]' : 'text-[#666666]'}`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}