"use client";

import React from 'react';
import { SidebarProvider, useSidebar } from './SidebarContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from './CommandPalette';

function LayoutContainer({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f7f6]">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area — dynamically shifts with sidebar width */}
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out
          ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}
        `}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          {children}
        </main>
      </div>

      {/* Global Command Palette Dialog (Ctrl+K) */}
      <CommandPalette />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutContainer>{children}</LayoutContainer>
    </SidebarProvider>
  );
}
