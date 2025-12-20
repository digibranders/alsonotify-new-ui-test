import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Archive, Trash2 } from 'lucide-react';
import { Checkbox, App } from 'antd';
import { getNotes, createNote, deleteNote, archiveNote, Note, NoteType, ChecklistItem } from "@/services/notes";
import Link from "next/link";
import svgPaths from "../../constants/iconPaths";
import { NoteComposerModal } from "../common/NoteComposerModal";
import { NoteViewModal } from "../common/NoteViewModal";

export function NotesWidget({ onNavigate }: { onNavigate?: (page: string) => void }) {
    const queryClient = useQueryClient();
    const { message: messageApi, modal } = App.useApp();
    const [showDialog, setShowDialog] = useState(false);
    const [viewingNote, setViewingNote] = useState<Note | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['notes', 'dashboard'],
        queryFn: () => getNotes(0, 4, false), // Fetch 4 for the grid, exclude archived
    });

    const notesList: Note[] = data?.result && Array.isArray(data.result) ? data.result : [];

    const createMutation = useMutation({
        mutationFn: createNote,
        onSuccess: () => {
            messageApi.success("Note created");
            setShowDialog(false);
            queryClient.invalidateQueries({ queryKey: ['notes'] });
        },
        onError: () => messageApi.error("Failed to create note")
    });

    const handleSaveNote = async (noteData: {
        title: string;
        type: NoteType;
        content?: string;
        items?: ChecklistItem[];
        color: string;
    }) => {
        await createMutation.mutateAsync({
            title: noteData.title,
            type: noteData.type, // NoteType is already 'TEXT_NOTE' | 'CHECKLIST_NOTE'
            content: noteData.content,
            items: noteData.items,
            color: noteData.color,
        } as any); // Type assertion needed as backend might expect different format
    };

    const deleteMutation = useMutation({
        mutationFn: deleteNote,
        onSuccess: () => {
            messageApi.success("Note permanently deleted");
            setShowViewModal(false);
            setViewingNote(null);
            queryClient.invalidateQueries({ queryKey: ['notes'] });
        },
        onError: () => messageApi.error("Failed to delete note")
    });

    const archiveMutation = useMutation({
        mutationFn: archiveNote,
        onSuccess: () => {
            messageApi.success("Note archived");
            setShowViewModal(false);
            setViewingNote(null);
            queryClient.invalidateQueries({ queryKey: ['notes'] });
        },
        onError: () => messageApi.error("Failed to archive note")
    });

    const handleArchive = (id: number) => {
        archiveMutation.mutate(id);
    };

    const handleDelete = (id: number) => {
        modal.confirm({
            title: 'Delete Note',
            content: 'Are you sure you want to permanently delete this note? This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: () => deleteMutation.mutate(id)
        });
    };


    return (
        <>
            <div className="bg-white rounded-[24px] p-5 w-full h-full flex flex-col border border-[#EEEEEE]">
                {/* Header */}
                <div className="flex items-center justify-between mb-1.5 h-[32px]">
                    <div className="flex items-center gap-2">
                        <h3 className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">Notes</h3>
                        <button
                            onClick={() => setShowDialog(true)}
                            className="hover:scale-110 active:scale-95 transition-transform flex items-center justify-center p-0.5"
                        >
                            <Plus className="size-5 text-[#ff3b3b]" strokeWidth={2} />
                        </button>
                    </div>
                    <Link href="/dashboard/notes" className="flex items-center gap-1 text-[#666666] text-[14px] font-['Manrope:SemiBold',sans-serif] hover:text-[#111111] transition-colors">
                        <span>View All</span>
                        <svg className="size-[17px]" fill="none" viewBox="0 0 17 17">
                            <path d={svgPaths.p3ac7a560} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                        </svg>
                    </Link>
                </div>

                {/* Notes Grid - 4 columns */}
                <div className="grid grid-cols-4 gap-3 flex-1 mt-2 overflow-y-auto pr-1">
                    {isLoading ? (
                        <div className="col-span-4 flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ff3b3b]"></div>
                        </div>
                    ) : notesList.length === 0 ? (
                        <div className="col-span-4 flex flex-col items-center justify-center h-full text-center text-[#999999] text-[13px]">
                            <p>No notes yet</p>
                            <button
                                onClick={() => setShowDialog(true)}
                                className="text-[#ff3b3b] hover:underline mt-1"
                            >
                                Create one
                            </button>
                        </div>
                    ) : (
                        notesList.map((note: Note) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                onArchive={(id) => archiveMutation.mutate(id)}
                                onDelete={(id) => {
                                    modal.confirm({
                                        title: 'Delete Note',
                                        content: 'Are you sure you want to permanently delete this note? This action cannot be undone.',
                                        okText: 'Delete',
                                        okType: 'danger',
                                        cancelText: 'Cancel',
                                        onOk: () => deleteMutation.mutate(id)
                                    });
                                }}
                                onClick={(note) => {
                                    setViewingNote(note);
                                    setShowViewModal(true);
                                }}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Note Composer Modal */}
            <NoteComposerModal
                open={showDialog}
                onClose={() => setShowDialog(false)}
                onSave={handleSaveNote}
                initialNote={null}
            />

            {/* Note View Modal - Google Keep style editable */}
            <NoteViewModal
                open={showViewModal}
                note={viewingNote}
                onClose={() => {
                    setShowViewModal(false);
                    setViewingNote(null);
                }}
                onArchive={handleArchive}
                onDelete={handleDelete}
            />
        </>
    );
}

function NoteCard({ note, onArchive, onDelete, onClick }: { 
    note: Note; 
    onArchive: (id: number) => void; 
    onDelete: (id: number) => void;
    onClick?: (note: Note) => void;
}) {

    // Helper function to convert hex to rgba with opacity
    const hexToRgba = (hex: string, opacity: number): string => {
        // Remove # if present
        let cleanHex = hex.replace('#', '');
        
        // Handle 3-digit hex
        if (cleanHex.length === 3) {
            cleanHex = cleanHex.split('').map(char => char + char).join('');
        }
        
        // Handle 6-digit hex
        if (cleanHex.length === 6) {
            const r = parseInt(cleanHex.slice(0, 2), 16);
            const g = parseInt(cleanHex.slice(2, 4), 16);
            const b = parseInt(cleanHex.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        
        // Fallback to default color
        return `rgba(255, 59, 59, ${opacity})`;
    };

    const noteColor = note.color || '#ff3b3b';
    const borderColorNormal = hexToRgba(noteColor, 0.5);
    const borderColorHover = noteColor;

    return (
        <div className="relative group aspect-square">
            <div
                className="relative h-full w-full bg-white rounded-xl border transition-all duration-300 cursor-pointer p-4 flex flex-col hover:shadow-lg"
                style={{ 
                    borderColor: borderColorNormal,
                    borderWidth: '1px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = borderColorHover;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = borderColorNormal;
                }}
                onClick={(e) => {
                    // Only trigger if click is not on action buttons
                    const target = e.target as HTMLElement;
                    const isActionButton = target.closest('button');
                    
                    if (!isActionButton) {
                        onClick && onClick(note);
                    }
                }}
            >
                <div className="flex items-start justify-between mb-2 gap-2 flex-shrink-0">
                    <h4 className="font-['Manrope:SemiBold',sans-serif] text-[14px] text-[#111111] flex-1 line-clamp-2">
                        {note.title}
                    </h4>
                    {/* Action icons - appear on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0 z-10 relative">
                        <button
                            className="p-1.5 hover:bg-[#F7F7F7] rounded-md transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onArchive(note.id);
                            }}
                            title="Archive"
                        >
                            <Archive className="size-3.5 text-[#666666]" strokeWidth={2} />
                        </button>
                        <button
                            className="p-1.5 hover:bg-[#F7F7F7] rounded-md transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(note.id);
                            }}
                            title="Delete"
                        >
                            <Trash2 className="size-3.5 text-[#ff3b3b]" strokeWidth={2} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden min-h-0">
                    {(note.type === 'TEXT_NOTE' || (note.type as any) === 'text') && note.content && (
                        <div 
                            className="font-['Inter:Regular',sans-serif] text-[12px] text-[#666666] line-clamp-4 leading-normal prose prose-sm max-w-none [&>p]:m-0 h-full"
                            dangerouslySetInnerHTML={{ __html: note.content }}
                        />
                    )}
                    {(note.type === 'CHECKLIST_NOTE' || (note.type as any) === 'checklist') && note.items && Array.isArray(note.items) && note.items.length > 0 && (
                        <div className="flex flex-col gap-1.5 h-full overflow-hidden">
                            {note.items
                                .filter((item: any) => !item.isChecked && !item.checked)
                                .slice(0, 3)
                                .map((item: any, index: number) => (
                                    <div key={item.id || index} className="flex items-start gap-2 flex-shrink-0">
                                        <Checkbox
                                            checked={false}
                                            disabled
                                            className="mt-0.5 custom-checkbox-wrapper"
                                        />
                                        <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#666666] line-clamp-1">
                                            {item.text || item}
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
