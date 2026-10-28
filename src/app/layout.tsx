import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CatatanKu - Pencatatan Keuangan UMKM',
  description: 'Aplikasi pencatatan keuangan modern untuk UMKM Indonesia — Warkop, Rental PS, Seblak Prasmanan',
  keywords: 'pencatatan keuangan, UMKM, kasir, POS, akuntansi, SAK EMKM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={`${outfit.className} bg-[#f8f7f6] text-gray-900 antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
