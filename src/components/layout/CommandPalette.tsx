"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebar } from './SidebarContext';

interface CommandItem {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  icon: string;
  href: string;
  keywords?: string[];
}

const COMMAND_ITEMS: CommandItem[] = [
  // Utama
  { id: 'dashboard', category: 'Navigasi Utama', title: 'Dashboard Ringkasan', subtitle: 'Overview kinerja & statistik hari ini', icon: '🏠', href: '/', keywords: ['home', 'beranda', 'omzet', 'laba'] },
  { id: 'pos', category: 'Navigasi Utama', title: 'Kasir POS (Point of Sale)', subtitle: 'Buka mesin kasir penjualan langsung', icon: '🧾', href: '/kasir', keywords: ['kasir', 'pos', 'bayar', 'struk', 'penjualan'] },
  
  // Transaksi
  { id: 'transaksi-list', category: 'Transaksi', title: 'Semua Transaksi', subtitle: 'Riwayat jurnal pembukuan transaksi', icon: '📋', href: '/transaksi', keywords: ['jurnal', 'riwayat', 'daftar'] },
  { id: 'transaksi-penjualan', category: 'Transaksi', title: 'Catat Penjualan Baru', subtitle: 'Input omzet penjualan produk / layanan', icon: '💰', href: '/transaksi/penjualan', keywords: ['jual', 'omzet', 'income'] },
  { id: 'transaksi-pembelian', category: 'Transaksi', title: 'Catat Pembelian Bahan', subtitle: 'Kulakan bahan baku & persediaan', icon: '🛒', href: '/transaksi/pembelian', keywords: ['beli', 'kulakan', 'supplier', 'belanja'] },
  { id: 'transaksi-pengeluaran', category: 'Transaksi', title: 'Catat Pengeluaran Operasional', subtitle: 'Biaya listrik, gaji, perawatan', icon: '💸', href: '/transaksi/pengeluaran', keywords: ['beban', 'biaya', 'operasional', 'listrik', 'gaji'] },
  
  // Operasional
  { id: 'persediaan', category: 'Operasional & Inventaris', title: 'Manajemen Persediaan & Stok', subtitle: 'Pantau stok bahan & barang dagang', icon: '📦', href: '/persediaan', keywords: ['stok', 'inventory', 'barang', 'bahan'] },
  { id: 'seblak', category: 'Operasional & Inventaris', title: 'Menu Seblak & Topping BOM', subtitle: 'Formula Bill of Materials seblak prasmanan', icon: '🍜', href: '/seblak', keywords: ['seblak', 'topping', 'bom', 'resep'] },
  { id: 'waste', category: 'Operasional & Inventaris', title: 'Catat Bahan Rusak / Basi (Waste)', subtitle: 'Pencatatan kerugian bahan terbuang', icon: '🗑️', href: '/seblak/waste', keywords: ['waste', 'basi', 'rusak', 'loss', 'rugi'] },
  { id: 'kas', category: 'Operasional & Inventaris', title: 'Kas Kecil & Rekonsiliasi Fisik', subtitle: 'Cek saldo fisik kas vs sistem', icon: '💵', href: '/kas', keywords: ['kas', 'petty cash', 'saldo', 'rekonsiliasi'] },
  { id: 'shift', category: 'Operasional & Inventaris', title: 'Buka / Tutup Shift Kasir', subtitle: 'Manajemen kas awal & kas akhir per shift', icon: '⏱️', href: '/kas/shift', keywords: ['shift', 'kasir', 'tutup shift', 'buka shift'] },
  { id: 'utang', category: 'Operasional & Inventaris', title: 'Buku Utang & Piutang', subtitle: 'Tagihan tempo pelanggan & utang supplier', icon: '💳', href: '/utang-piutang', keywords: ['utang', 'hutang', 'piutang', 'tempo', 'tagihan'] },
  { id: 'aset', category: 'Operasional & Inventaris', title: 'Aset Tetap & Depresiasi', subtitle: 'PS, TV, kulkas, peralatan & penyusutan bulanan', icon: '🏗️', href: '/aset', keywords: ['aset', 'mesin', 'ps', 'penyusutan', 'depresiasi'] },

  // Laporan SAK EMKM
  { id: 'lap-laba-rugi', category: 'Laporan Keuangan (SAK EMKM)', title: 'Laporan Laba Rugi', subtitle: 'Performa pendapatan vs HPP dan beban', icon: '📈', href: '/laporan/laba-rugi', keywords: ['laba', 'rugi', 'profit', 'margin'] },
  { id: 'lap-posisi', category: 'Laporan Keuangan (SAK EMKM)', title: 'Laporan Posisi Keuangan (Neraca)', subtitle: 'Aset, liabilitas, dan ekuitas pemilik', icon: '📊', href: '/laporan/posisi-keuangan', keywords: ['neraca', 'balance sheet', 'ekuitas', 'posisi'] },
  { id: 'lap-arus-kas', category: 'Laporan Keuangan (SAK EMKM)', title: 'Laporan Arus Kas', subtitle: 'Arus kas operasional, investasi, pendanaan', icon: '💹', href: '/laporan/arus-kas', keywords: ['cash flow', 'aliran kas'] },
  { id: 'lap-ekuitas', category: 'Laporan Keuangan (SAK EMKM)', title: 'Laporan Perubahan Ekuitas', subtitle: 'Pergerakan modal dan prive pemilik', icon: '📉', href: '/laporan/perubahan-ekuitas', keywords: ['modal', 'prive', 'ekuitas'] },
  { id: 'lap-pajak', category: 'Laporan Keuangan (SAK EMKM)', title: 'Perhitungan Pajak PPh Final UMKM', subtitle: 'Pajak 0,5% PP 55/2022 & threshold 500jt', icon: '🧾', href: '/laporan/pajak', keywords: ['pajak', 'pph final', '0.5%', 'tax'] },

  // Bantuan & Pengaturan
  { id: 'ai-advisor', category: 'Alat & Sistem', title: 'AI Advisor Keuangan (Gemini)', subtitle: 'Konsultasi bisnis cerdas & SAK EMKM', icon: '🤖', href: '/ai-advisor', keywords: ['ai', 'gemini', 'advisor', 'konsultasi', 'tanya'] },
  { id: 'tutup-buku', category: 'Alat & Sistem', title: 'Tutup Buku Bulanan', subtitle: 'Kunci periode dan update saldo laba ditahan', icon: '📅', href: '/pengaturan/tutup-buku', keywords: ['closing', 'tutup buku', 'periode'] },
  { id: 'backup', category: 'Alat & Sistem', title: 'Backup & Restore Database', subtitle: 'Cadangkan data pembukuan ke file', icon: '💾', href: '/pengaturan/backup', keywords: ['backup', 'restore', 'cadangan', 'database'] },
  { id: 'pengaturan', category: 'Alat & Sistem', title: 'Pengaturan Usaha & Profil', subtitle: 'Nama bisnis, kontak, PIN keamanan', icon: '⚙️', href: '/pengaturan', keywords: ['settings', 'pin', 'profil', 'profil usaha'] },
];

function CommandPaletteModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const filteredItems = COMMAND_ITEMS.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(q);
    const subtitleMatch = item.subtitle?.toLowerCase().includes(q);
    const categoryMatch = item.category.toLowerCase().includes(q);
    const keywordMatch = item.keywords?.some((k) => k.toLowerCase().includes(q));
    return titleMatch || subtitleMatch || categoryMatch || keywordMatch;
  });

  const handleSelect = (item: CommandItem) => {
    onClose();
    router.push(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex items-start justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-fade-in-up">
        {/* Search Input Bar */}
        <div className="relative border-b border-gray-100 flex items-center px-4 py-3">
          <span className="text-xl mr-3 text-gray-400">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm focus:outline-none"
            placeholder="Cari fitur, menu, atau transaksi... (Ketik 'kasir', 'laba', 'stok', dll.)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md shrink-0">
            ESC untuk tutup
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-gray-50 custom-scrollbar">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-maroon-900 text-white shadow-sm'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-2xl shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {item.title}
                      </p>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-maroon-100'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                    {item.subtitle && (
                      <p className={`text-xs truncate mt-0.5 ${isSelected ? 'text-maroon-200' : 'text-gray-400'}`}>
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold shrink-0 ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    ↵ Buka
                  </span>
                </button>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <span className="text-3xl block mb-2">🤔</span>
              <p className="text-sm font-semibold text-gray-700">Tidak ada fitur yang cocok</p>
              <p className="text-xs text-gray-400 mt-1">
                Coba kata kunci lain seperti &apos;pos&apos;, &apos;beli&apos;, &apos;pajak&apos;, atau &apos;aset&apos;
              </p>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="bg-gray-50/80 px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 shadow-2xs font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 shadow-2xs font-mono">↓</kbd> Navigasi</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 shadow-2xs font-mono">Enter</kbd> Pilih</span>
          </div>
          <span>CatatanKu Quick Search</span>
        </div>
      </div>
    </div>
  );
}

export function CommandPalette() {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen } = useSidebar();

  if (!isCommandPaletteOpen) return null;

  return <CommandPaletteModal onClose={() => setIsCommandPaletteOpen(false)} />;
}
