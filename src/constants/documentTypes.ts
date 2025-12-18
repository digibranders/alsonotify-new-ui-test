import { DocumentType } from "@/types/genericTypes";

export const DOCUMENT_TYPES_STORAGE_KEY = "alsonotify_required_documents";

// Default list of document types used across Settings and Profile pages
export const DEFAULT_DOCUMENT_TYPES: DocumentType[] = [
  { id: "1", name: "Resume / CV", required: true },
  { id: "2", name: "ID Proof", required: true },
  { id: "3", name: "Contract Agreement", required: true },
  { id: "4", name: "Supporting Documents", required: false },
  { id: "5", name: "Additional Document", required: false },
];

