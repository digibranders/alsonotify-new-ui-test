// Google Keep-style Note Types with strict type separation

export type NoteType = "TEXT_NOTE" | "CHECKLIST_NOTE";

export interface ChecklistItem {
  id: string;
  text: string;
  isChecked: boolean;
  order: number;
  indentLevel: number; // 0..N
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: number;
  user_id: number;
  company_id: number;
  title: string;
  type: NoteType;
  color: string;
  isPinned?: boolean;
  is_archived: boolean;
  labels?: string[];
  created_at: string;
  updated_at?: string;
  // Type-specific fields (mutually exclusive)
  content?: string; // HTML content for TEXT_NOTE only
  items?: ChecklistItem[]; // For CHECKLIST_NOTE only
}

export interface NoteCreate {
  title: string;
  type: NoteType;
  color?: string;
  content?: string; // For TEXT_NOTE
  items?: ChecklistItem[]; // For CHECKLIST_NOTE
}

export interface NoteUpdate {
  title?: string;
  type?: NoteType;
  color?: string;
  is_archived?: boolean;
  content?: string; // For TEXT_NOTE
  items?: ChecklistItem[]; // For CHECKLIST_NOTE
}

// Type conversion helpers
export function convertTextToChecklist(content: string): ChecklistItem[] {
  if (!content || content.trim() === '') {
    return [createEmptyChecklistItem(0)];
  }
  
  const lines = content.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) {
    return [createEmptyChecklistItem(0)];
  }
  
  return lines.map((line, index) => ({
    id: `item-${Date.now()}-${index}`,
    text: line.trim(),
    isChecked: false,
    order: index,
    indentLevel: 0,
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export function convertChecklistToText(items: ChecklistItem[]): string {
  if (!items || items.length === 0) {
    return '';
  }
  
  // Separate checked and unchecked
  const unchecked = items.filter(item => !item.isChecked).sort((a, b) => a.order - b.order);
  const checked = items.filter(item => item.isChecked).sort((a, b) => a.order - b.order);
  
  // Combine: unchecked first, then checked
  const allItems = [...unchecked, ...checked];
  
  // Convert to text lines (preserve indent with spaces or dashes)
  return allItems.map(item => {
    const indent = '  '.repeat(item.indentLevel);
    const prefix = item.isChecked ? '- [x] ' : '';
    return `${indent}${prefix}${item.text}`;
  }).join('\n');
}

export function createEmptyChecklistItem(order: number, indentLevel: number = 0): ChecklistItem {
  return {
    id: `item-${Date.now()}-${order}-${Math.random()}`,
    text: '',
    isChecked: false,
    order,
    indentLevel,
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function isNoteEmpty(note: { title: string; content?: string; items?: ChecklistItem[] }): boolean {
  const titleEmpty = !note.title || note.title.trim() === '';
  
  if (note.content) {
    // Strip HTML tags and check if empty
    const textContent = note.content.replace(/<[^>]*>/g, '').trim();
    return titleEmpty && textContent === '';
  }
  
  if (note.items) {
    // Check if all items are empty
    const hasNonEmptyItem = note.items.some(item => item.text && item.text.trim() !== '');
    return titleEmpty && !hasNonEmptyItem;
  }
  
  return titleEmpty;
}
