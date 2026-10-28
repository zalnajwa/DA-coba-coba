"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileOpen: boolean;
  setIsMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleCommandPalette: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('catatanku_sidebar_collapsed') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  // Save collapsed state to localStorage
  const handleSetCollapsed: React.Dispatch<React.SetStateAction<boolean>> = (action) => {
    setIsCollapsed((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      try {
        localStorage.setItem('catatanku_sidebar_collapsed', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileOpen((prev) => !prev);
    } else {
      handleSetCollapsed((prev) => !prev);
    }
  };

  const toggleCommandPalette = () => {
    setIsCommandPaletteOpen((prev) => !prev);
  };

  // Keyboard shortcut listener: Ctrl+B (toggle sidebar), Ctrl+K (command palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (window.innerWidth < 768) {
          setIsMobileOpen((prev) => !prev);
        } else {
          setIsCollapsed((prev) => {
            const next = !prev;
            try {
              localStorage.setItem('catatanku_sidebar_collapsed', String(next));
            } catch {
              // Ignore
            }
            return next;
          });
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed: handleSetCollapsed,
        isMobileOpen,
        setIsMobileOpen,
        toggleSidebar,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        toggleCommandPalette,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
