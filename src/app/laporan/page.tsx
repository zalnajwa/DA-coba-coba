'use client'
import React from 'react';
import Link from 'next/link';

export default function LaporanPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Laporan Keuangan & Pajak</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/laporan/laba-rugi" className="block p-6 bg-white border rounded shadow hover:shadow-md transition-shadow">
          <div className="text-4xl mb-3">📈</div>
          <h2 className="text-xl font-bold mb-2">Laporan Laba Rugi</h2>
          <p className="text-gray-600 text-sm">Melihat pendapatan dan beban, serta laba bersih periode tertentu.</p>
        </Link>
        
        <Link href="/laporan/posisi-keuangan" className="block p-6 bg-white border rounded shadow hover:shadow-md transition-shadow">
          <div className="text-4xl mb-3">📊</div>
          <h2 className="text-xl font-bold mb-2">Posisi Keuangan (Neraca)</h2>
          <p className="text-gray-600 text-sm">Melihat ringkasan aset, liabilitas (hutang), dan ekuitas (modal).</p>
        </Link>

        <Link href="/laporan/pajak" className="block p-6 bg-white border rounded shadow hover:shadow-md transition-shadow border-blue-200">
          <div className="text-4xl mb-3">🧾</div>
          <h2 className="text-xl font-bold mb-2">Pajak PPh Final 0.5%</h2>
          <p className="text-gray-600 text-sm">Tracking peredaran bruto (omzet) dan status kewajiban pajak UMKM.</p>
        </Link>
        
        <Link href="/laporan/arus-kas" className="block p-6 bg-white border rounded shadow hover:shadow-md transition-shadow relative">
          <span className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium">Lanjutan</span>
          <div className="text-4xl mb-3">💹</div>
          <h2 className="text-xl font-bold mb-2">Laporan Arus Kas</h2>
          <p className="text-gray-600 text-sm">Melihat detail aliran uang masuk dan keluar dari kas/bank.</p>
        </Link>

        <Link href="/laporan/perubahan-ekuitas" className="block p-6 bg-white border rounded shadow hover:shadow-md transition-shadow relative">
          <span className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium">Lanjutan</span>
          <div className="text-4xl mb-3">📉</div>
          <h2 className="text-xl font-bold mb-2">Perubahan Ekuitas</h2>
          <p className="text-gray-600 text-sm">Melihat perubahan modal awal ke modal akhir akibat laba dan prive.</p>
        </Link>
      </div>
    </div>
  );
}
