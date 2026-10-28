"use client";

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSidebar } from './SidebarContext';

interface PageMeta {
  category: string;
  title: string;
}

const ROUTE_META: Record<string, PageMeta> = {
  '/': { category: 'Utama', title: 'Dashboard Ringkasan' },
  '/kasir': { category: 'Utama', title: 'Kasir Point of Sale (POS)' },
  '/transaksi': { category: 'Transaksi', title: 'Semua Transaksi' },
  '/transaksi/penjualan': { category: 'Transaksi', title: 'Catat Penjualan' },
  '/transaksi/pembelian': { category: 'Transaksi', title: 'Catat Pembelian' },
  '/transaksi/pengeluaran': { category: 'Transaksi', title: 'Catat Pengeluaran' },
  '/persediaan': { category: 'Operasional', title: 'Persediaan & Stok Bahan' },
  '/seblak': { category: 'Operasional', title: 'Menu Seblak & Topping BOM' },
  '/seblak/waste': { category: 'Operasional', title: 'Pencatatan Waste & Basi' },
  '/aset': { category: 'Operasional', title: 'Aset Tetap & Depresiasi' },
  '/utang-piutang': { category: 'Operasional', title: 'Buku Utang & Piutang' },
  '/kas': { category: 'Operasional', title: 'Kas & Rekonsiliasi' },
  '/kas/shift': { category: 'Operasional', title: 'Shift Kasir' },
  '/laporan/laba-rugi': { category: 'Laporan Keuangan', title: 'Laporan Laba Rugi' },
  '/laporan/posisi-keuangan': { category: 'Laporan Keuangan', title: 'Laporan Posisi Keuangan (Neraca)' },
  '/laporan/arus-kas': { category: 'Laporan Keuangan', title: 'Laporan Arus Kas' },
  '/laporan/perubahan-ekuitas': { category: 'Laporan Keuangan', title: 'Laporan Perubahan Ekuitas' },
  '/laporan/pajak': { category: 'Laporan Keuangan', title: 'Pajak PPh Final UMKM' },
  '/ai-advisor': { category: 'Alat & Sistem', title: 'AI Advisor Keuangan' },
  '/pengaturan': { category: 'Alat & Sistem', title: 'Pengaturan Usaha' },
  '/pengaturan/tutup-buku': { category: 'Alat & Sistem', title: 'Tutup Buku Bulanan' },
  '/pengaturan/backup': { category: 'Alat & Sistem', title: 'Backup & Restore' },
};

export function Header() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar, toggleCommandPalette } = useSidebar();
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const quickMenuRef = useRef<HTMLDivElement>(null);

  // Time & Date updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDate(
        new Intl.DateTimeFormat('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(now)
      );
      setCurrentTime(
        new Intl.DateTimeFormat('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(now)
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  // Close quick menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickMenuRef.current && !quickMenuRef.current.contains(e.target as Node)) {
        setIsQuickMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const meta = ROUTE_META[pathname] || {
    category: 'Aplikasi',
    title: pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Dashboard',
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-4 sm:px-6 z-20 sticky top-0 shrink-0 gap-4">
      {/* Left: Sidebar Toggle + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-gray-500 hover:text-maroon-900 hover:bg-gray-100 transition-colors shrink-0"
          title={isCollapsed ? 'Perluas Sidebar (Ctrl+B)' : 'Kecilkan Sidebar (Ctrl+B)'}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium leading-none mb-1">
            <span>{meta.category}</span>
            <span>/</span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-none truncate">
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Center: Command Palette Trigger (Ctrl + K) */}
      <div className="hidden md:flex flex-1 max-w-md mx-2">
        <button
          type="button"
          onClick={toggleCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 rounded-xl text-xs text-gray-500 transition-colors shadow-2xs group"
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-400 group-hover:text-gray-600 transition-colors">🔍</span>
            <span className="truncate">Cari fitur, menu, atau transaksi...</span>
          </div>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 bg-white text-[10px] font-mono text-gray-400 rounded-md border border-gray-200 shadow-2xs">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Action Buttons, Date & POS Shortcut */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Mobile Search Button */}
        <button
          onClick={toggleCommandPalette}
          className="md:hidden p-2 rounded-xl text-gray-500 hover:text-maroon-900 hover:bg-gray-100 transition-colors"
          title="Cari (Ctrl+K)"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Quick Transaction Action Dropdown */}
        <div className="relative" ref={quickMenuRef}>
          <button
            onClick={() => setIsQuickMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
          >
            <span>+ Catat</span>
            <svg className={`w-3.5 h-3.5 transition-transform ${isQuickMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isQuickMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-fade-in-up">
              <Link
                href="/transaksi/penjualan"
                onClick={() => setIsQuickMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-maroon-900 transition-colors"
              >
                <span>💰</span>
                <span>Catat Penjualan</span>
              </Link>
              <Link
                href="/transaksi/pembelian"
                onClick={() => setIsQuickMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-maroon-900 transition-colors"
              >
                <span>🛒</span>
                <span>Catat Pembelian</span>
              </Link>
              <Link
                href="/transaksi/pengeluaran"
                onClick={() => setIsQuickMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-maroon-900 transition-colors"
              >
                <span>💸</span>
                <span>Catat Pengeluaran</span>
              </Link>
              <div className="my-1 border-t border-gray-100" />
              <Link
                href="/seblak/waste"
                onClick={() => setIsQuickMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <span>🗑️</span>
                <span>Catat Bahan Basi/Waste</span>
              </Link>
            </div>
          )}
        </div>

        {/* Primary POS Button */}
        <Link
          href="/kasir"
          className="inline-flex items-center gap-1.5 bg-maroon-900 hover:bg-maroon-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          <span>🧾</span>
          <span className="hidden sm:inline">Kasir POS</span>
        </Link>

        {/* Live Date & Time Badge */}
        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-gray-200 text-xs">
          <span className="text-gray-500 font-medium">{currentDate}</span>
          <span className="bg-maroon-50 text-maroon-800 px-2 py-1 rounded-lg font-bold font-mono">
            {currentTime}
          </span>
        </div>
      </div>
    </header>
  );
}
