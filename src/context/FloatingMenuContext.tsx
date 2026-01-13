import { createContext, useContext, useState, ReactNode } from 'react';

interface FloatingMenuContextType {
  expandedContent: ReactNode | null;
  setExpandedContent: (content: ReactNode | null) => void;
}

const FloatingMenuContext = createContext<FloatingMenuContextType | undefined>(undefined);

export function FloatingMenuProvider({ children }: { children: ReactNode }) {
  const [expandedContent, setExpandedContent] = useState<ReactNode | null>(null);

  return (
    <FloatingMenuContext.Provider value={{ expandedContent, setExpandedContent }}>
      {children}
    </FloatingMenuContext.Provider>
  );
}

export function useFloatingMenu() {
  const context = useContext(FloatingMenuContext);
  if (!context) {
    throw new Error('useFloatingMenu must be used within FloatingMenuProvider');
  }
  return context;
}
