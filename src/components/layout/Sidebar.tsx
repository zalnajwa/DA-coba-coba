"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';

interface SubMenuItem {
  name: string;
  href: string;
  badge?: string;
  isStatus?: boolean;
}

interface NavGroup {
  id: string;
  title: string;
  icon: string;
  href?: string; // If direct link
  items?: SubMenuItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: '🏠',
    href: '/',
  },
  {
    id: 'kasir',
    title: 'Kasir (POS)',
    icon: '🧾',
    href: '/kasir',
  },
  {
    id: 'transaksi',
    title: 'Transaksi',
    icon: '💳',
    items: [
      { name: 'Semua Transaksi', href: '/transaksi' },
      { name: 'Catat Penjualan', href: '/transaksi/penjualan' },
      { name: 'Catat Pembelian', href: '/transaksi/pembelian' },
      { name: 'Catat Pengeluaran', href: '/transaksi/pengeluaran' },
    ],
  },
  {
    id: 'operasional',
    title: 'Operasional & Stok',
    icon: '📦',
    items: [
      { name: 'Persediaan Stok', href: '/persediaan' },
      { name: 'Seblak & Topping BOM', href: '/seblak' },
      { name: 'Catat Bahan Rusak (Waste)', href: '/seblak/waste' },
      { name: 'Kas & Shift Kasir', href: '/kas' },
      { name: 'Utang & Piutang', href: '/utang-piutang' },
      { name: 'Aset Tetap & Depresiasi', href: '/aset' },
    ],
  },
  {
    id: 'laporan',
    title: 'Laporan SAK EMKM',
    icon: '📊',
    items: [
      { name: 'Laba Rugi', href: '/laporan/laba-rugi' },
      { name: 'Posisi Keuangan (Neraca)', href: '/laporan/posisi-keuangan' },
      { name: 'Arus Kas', href: '/laporan/arus-kas', badge: 'Bonus' },
      { name: 'Perubahan Ekuitas', href: '/laporan/perubahan-ekuitas', badge: 'Bonus' },
      { name: 'Pajak PPh Final UMKM', href: '/laporan/pajak' },
    ],
  },
  {
    id: 'ai-advisor',
    title: 'AI Advisor',
    icon: '🤖',
    href: '/ai-advisor',
  },
  {
    id: 'pengaturan',
    title: 'Pengaturan & Alat',
    icon: '⚙️',
    items: [
      { name: 'Profil & Usaha', href: '/pengaturan' },
      { name: 'Tutup Buku Bulanan', href: '/pengaturan/tutup-buku' },
      { name: 'Backup & Restore', href: '/pengaturan/backup' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();

  // Track which groups are expanded in the sidebar
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    transaksi: false,
    operasional: false,
    laporan: false,
    pengaturan: false,
  });

  // Auto-expand the group that contains the current active route
  useEffect(() => {
    NAV_GROUPS.forEach((group) => {
      if (group.items) {
        const hasActiveChild = group.items.some(
          (sub) => pathname === sub.href || pathname?.startsWith(sub.href + '/')
        );
        if (hasActiveChild) {
          setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
        }
      }
    });
  }, [pathname]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const isRouteActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const isGroupActive = (group: NavGroup) => {
    if (group.href) return isRouteActive(group.href);
    return group.items?.some((sub) => isRouteActive(sub.href)) || false;
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-maroon-950 text-white transition-all duration-300 ease-in-out border-r border-white/10
          ${/* Mobile: slide in/out */ ''}
          ${isMobileOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full'}
          ${/* Desktop: controlled width */ ''}
          md:translate-x-0 ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        `}
      >
        {/* Brand / Header Area */}
        <div className="h-16 flex items-center justify-between px-4 shrink-0 border-b border-white/10">
          <Link
            href="/"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
              <span className="text-xl">📊</span>
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0 flex-1 animate-fade-in">
                <h1 className="text-base font-bold text-white tracking-tight leading-none truncate">
                  CatatanKu
                </h1>
                <p className="text-[10px] text-maroon-300 font-medium tracking-wide mt-1 truncate">
                  Keuangan SAK EMKM
                </p>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title={isCollapsed ? 'Perluas Sidebar (Ctrl+B)' : 'Kecilkan Sidebar (Ctrl+B)'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 custom-scrollbar">
          {NAV_GROUPS.map((group) => {
            const hasSub = !!group.items && group.items.length > 0;
            const isOpen = openGroups[group.id] || false;
            const active = isGroupActive(group);

            // Direct link item (Dashboard, Kasir, AI Advisor)
            if (!hasSub && group.href) {
              const itemActive = isRouteActive(group.href);
              const isKasir = group.id === 'kasir';

              return (
                <div key={group.id} className="relative group/tooltip">
                  <Link
                    href={group.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                      ${
                        isKasir
                          ? itemActive
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-md shadow-amber-900/30'
                            : 'bg-white/10 text-white hover:bg-amber-600/30 hover:border-amber-400/40 border border-transparent'
                          : itemActive
                          ? 'bg-white/20 text-white font-semibold shadow-sm'
                          : 'text-maroon-200 hover:bg-white/10 hover:text-white'
                      }
                      ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                    `}
                  >
                    <span className="text-lg shrink-0">{group.icon}</span>
                    {(!isCollapsed || isMobileOpen) && (
                      <span className="truncate flex-1">{group.title}</span>
                    )}
                    {group.id === 'ai-advisor' && (!isCollapsed || isMobileOpen) && (
                      <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse-soft shrink-0" />
                    )}
                  </Link>

                  {/* Floating tooltip when sidebar is collapsed */}
                  {isCollapsed && !isMobileOpen && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50">
                      {group.title}
                    </div>
                  )}
                </div>
              );
            }

            // Accordion Group (Transaksi, Operasional, Laporan, Pengaturan)
            return (
              <div key={group.id} className="relative group/tooltip">
                {/* Group Trigger Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isCollapsed && !isMobileOpen) {
                      setIsCollapsed(false);
                      setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
                    } else {
                      toggleGroup(group.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left
                    ${
                      active
                        ? 'bg-white/12 text-white font-semibold'
                        : 'text-maroon-200 hover:bg-white/8 hover:text-white'
                    }
                    ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}
                  `}
                >
                  <span className="text-lg shrink-0">{group.icon}</span>
                  {(!isCollapsed || isMobileOpen) && (
                    <>
                      <span className="truncate flex-1">{group.title}</span>
                      <span className="text-xs text-white/50 bg-white/10 px-1.5 py-0.5 rounded-md font-mono shrink-0">
                        {group.items?.length}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 text-white/60 transition-transform duration-200 shrink-0 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Floating tooltip when sidebar is collapsed */}
                {isCollapsed && !isMobileOpen && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50">
                    {group.title} ({group.items?.length})
                  </div>
                )}

                {/* Sub-items (Accordion Body) */}
                {(!isCollapsed || isMobileOpen) && isOpen && group.items && (
                  <div className="ml-4 pl-3 my-1 border-l border-white/15 space-y-1 animate-fade-in">
                    {group.items.map((sub) => {
                      const subActive = isRouteActive(sub.href);
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                            ${
                              subActive
                                ? 'bg-white/20 text-white font-semibold'
                                : 'text-maroon-300 hover:text-white hover:bg-white/10'
                            }
                          `}
                        >
                          <span className="truncate">{sub.name}</span>
                          {sub.badge && (
                            <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-amber-400/20 text-amber-300 rounded">
                              {sub.badge}
                            </span>
                          )}
                          {sub.isStatus && (
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-soft ml-2" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Area */}
        <div className="p-3 border-t border-white/10 shrink-0">
          {(!isCollapsed || isMobileOpen) ? (
            <div className="flex items-center justify-between px-2 py-1.5 bg-white/5 rounded-xl">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">Warkop • PS • Seblak</p>
                <p className="text-[10px] text-maroon-400">SAK EMKM Compliant</p>
              </div>
              <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded font-mono" title="Shortcut sembunyikan sidebar">
                Ctrl+B
              </span>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => setIsCollapsed(false)}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-xs text-white/70 hover:text-white transition-colors"
                title="Buka Sidebar (Ctrl+B)"
              >
                ⇥
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
