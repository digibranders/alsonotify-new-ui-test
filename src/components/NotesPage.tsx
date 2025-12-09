import { PageLayout } from './PageLayout';
import { useState } from 'react';
import { FilterBar, FilterOption } from './FilterBar';
import { Plus, Bold, Italic, List, CheckSquare, MoreVertical, Archive, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

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
      >
        {/* Search Bar - No Filters */}
        <div className="mb-6">
          <FilterBar
            searchPlaceholder="Search notes by title or content..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 gap-4">
            {filteredNotes.map((note) => (
              <NoteCard key={note.id} note={note} onToggleItem={toggleNoteItem} />
            ))}
          </div>
        </div>
      </PageLayout>

      {/* Add Note Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-['Manrope:Bold',sans-serif] text-[24px]">Add Note</DialogTitle>
            <DialogDescription className="font-['Inter:Regular',sans-serif] text-[14px] text-[#666666]">Create a new sticky note for quick reminders and tasks.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-[14px] font-['Inter:Medium',sans-serif] text-[#666666] mb-2 block">Title</label>
              <Input placeholder="Note title" className="rounded-lg" />
            </div>
            <div>
              <label className="text-[14px] font-['Inter:Medium',sans-serif] text-[#666666] mb-2 flex items-center justify-between">
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
              </label>
              <Textarea placeholder="Note content..." className="rounded-lg min-h-[120px]" />
            </div>
            <div>
              <label className="text-[14px] font-['Inter:Medium',sans-serif] text-[#666666] mb-2 block">Color</label>
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
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1 rounded-full">
                Cancel
              </Button>
              <Button onClick={() => setShowDialog(false)} className="flex-1 rounded-full bg-[#ff3b3b] hover:bg-[#cc2f2f]">
                Add Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function NoteCard({ note, onToggleItem }: { 
  note: Note;
  onToggleItem: (noteId: number, itemIndex: number) => void;
}) {
  return (
    <div className="relative group h-[280px]">
      {/* Card with white background */}
      <div className="relative h-full bg-white rounded-xl border border-[#EEEEEE] hover:border-[#ff3b3b]/20 hover:shadow-lg transition-all duration-300 cursor-pointer p-4 flex flex-col">
        {/* Header with action buttons */}
        <div className="flex items-start justify-between mb-2 gap-2">
          {/* Title */}
          <h4 className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111] flex-1">
            {note.title}
          </h4>
          
          {/* Three-dot menu - appears on hover */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#F7F7F7] rounded-md flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="size-3.5 text-[#666666]" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem className="text-[13px] font-['Inter:Medium',sans-serif] cursor-pointer">
                <Archive className="size-3.5 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[13px] font-['Inter:Medium',sans-serif] cursor-pointer text-[#ff3b3b] focus:text-[#ff3b3b]">
                <Trash2 className="size-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Content */}
        {note.type === 'text' && note.content && (
          <p className="font-['Inter:Regular',sans-serif] text-[12px] text-[#666666] line-clamp-4 whitespace-pre-line">
            {note.content}
          </p>
        )}
        
        {note.type === 'checklist' && note.items && (
          <div className="flex flex-col gap-2">
            {note.items.slice(0, 3).map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <Checkbox 
                  checked={item.checked}
                  onCheckedChange={() => onToggleItem(note.id, index)}
                  className="size-4 mt-0.5"
                />
                <span className={`font-['Inter:Regular',sans-serif] text-[11px] flex-1 ${item.checked ? 'line-through text-[#999999]' : 'text-[#666666]'}`}>
                  {item.text}
                </span>
              </div>
            ))}
            {note.items.length > 3 && (
              <span className="font-['Inter:Regular',sans-serif] text-[10px] text-[#999999]">
                +{note.items.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}