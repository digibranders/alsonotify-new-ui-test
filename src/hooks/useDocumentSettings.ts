
import { useState, useEffect } from 'react';
import { DOCUMENT_TYPES_STORAGE_KEY, DEFAULT_DOCUMENT_TYPES } from '@/constants/documentTypes';

export interface DocumentTypeSetting {
  id: string;
  name: string;
  required: boolean;
}

export const useDocumentSettings = () => {
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeSetting[]>(DEFAULT_DOCUMENT_TYPES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(DOCUMENT_TYPES_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Validate/Normalize structure matches SettingsPage logic
            const normalized = parsed.map((doc: any, index: number) => ({
              id: String(doc.id ?? index + 1),
              name: String(doc.name ?? ''),
              required: Boolean(doc.required),
            }));
            setDocumentTypes(normalized);
          }
        } catch (e) {
          console.error("Failed to parse document types", e);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  const updateDocumentTypes = (newTypes: DocumentTypeSetting[]) => {
    setDocumentTypes(newTypes);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DOCUMENT_TYPES_STORAGE_KEY, JSON.stringify(newTypes));
    }
  };

  const resetToDefaults = () => {
    setDocumentTypes(DEFAULT_DOCUMENT_TYPES);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DOCUMENT_TYPES_STORAGE_KEY);
    }
  };

  return {
    documentTypes,
    updateDocumentTypes,
    resetToDefaults,
    isLoaded
  };
};
