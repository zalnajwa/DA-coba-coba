'use client'

import React, { useState, useEffect, useRef } from 'react';
import { sendAiMessage, getAiHistory, clearAiHistory, getGeminiModelStatus } from '@/actions/ai';

interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  text: string;
  createdAt?: Date;
}

export default function AIAdvisorPage() {
  const [modelStatus, setModelStatus] = useState<{ activeModel: string; hasApiKey: boolean }>({
    activeModel: 'Mendeteksi versi Gemini...',
    hasApiKey: false,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Halo! Saya CatatanKu AI Advisor didukung oleh **Google Gemini (Auto-Linked versi terbaru)**. Saya siap menganalisis keuangan bisnis Anda, memberikan rekomendasi efisiensi sesuai SAK EMKM, dan menjawab pertanyaan operasional seputar Warkop, Rental PS, atau Seblak Prasmanan. Silakan tanyakan apa saja! 😊'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load chat history & dynamic model status on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [history, status] = await Promise.all([
          getAiHistory('WEB', 30),
          getGeminiModelStatus(),
        ]);
        if (history && history.length > 0) {
          const formattedHistory: ChatMessage[] = history.map((item) => ({
            id: item.id,
            role: item.role,
            text: item.content,
            createdAt: item.createdAt,
          }));
          setMessages(formattedHistory);
        }
        if (status) {
          setModelStatus(status);
        }
      } catch (err) {
        console.warn('Gagal memuat data awal AI Advisor:', err);
      }
    }
    loadInitialData();
  }, []);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendAiMessage(textToSend, 'WEB');
      setMessages((prev) => [...prev, { role: 'assistant', text: response }]);
    } catch (err: unknown) {
      console.error('Error saat menghubungi AI:', err);
      const errMsg = err instanceof Error ? err.message : 'Terjadi kendala jaringan';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ Maaf, terjadi kendala saat memproses jawaban dengan Google Gemini Flash: ${errMsg}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua riwayat percakapan AI Advisor?')) {
      try {
        await clearAiHistory('WEB');
        setMessages([
          {
            role: 'assistant',
            text: 'Riwayat percakapan telah dibersihkan. Halo! Saya CatatanKu AI Advisor dengan Google Gemini Flash. Ada yang bisa saya bantu hari ini?'
          }
        ]);
      } catch (err) {
        console.error('Gagal menghapus riwayat:', err);
      }
    }
  };

  // Helper untuk format teks pesan sederhana (bold, list, newline)
  const renderMessageContent = (text: string) => {
    return text.split('\n').map((line, lineIdx) => {
      // Bold text processing **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={lineIdx} className="block min-h-[1.25rem]">
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </span>
      );
    });
  };

  const quickPrompts = [
    'Bagaimana performa laba usaha bulan ini?',
    'Lini usaha mana yang paling menguntungkan?',
    'Apa saja bahan atau stok yang menipis?',
    'Jelaskan prinsip dasar SAK EMKM untuk UMKM',
    'Tips efisiensi HPP dan pencegahan waste seblak'
  ];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">AI Advisor Keuangan</h1>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
              title="Versi Gemini terdeteksi dan terhubung secara otomatis via Google API tanpa perlu setting manual"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ⚡ Auto-Linked: {modelStatus.activeModel}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Konsultasi akuntansi SAK EMKM, evaluasi bisnis & optimasi biaya bertenaga Google Gemini
          </p>
        </div>
        <button
          onClick={handleClear}
          className="self-start sm:self-auto text-xs px-3 py-1.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
          title="Hapus riwayat chat"
        >
          🗑️ Bersihkan Chat
        </button>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-gray-50 rounded-t-xl border border-b-0 p-4 md:p-6 overflow-y-auto flex flex-col space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center space-x-1.5 mb-1.5 pb-1 border-b border-gray-100 text-xs font-semibold text-blue-600">
                  <span>🤖</span>
                  <span>Gemini Flash Advisor</span>
                </div>
              )}
              <div className="space-y-1">{renderMessageContent(msg.text)}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-2 text-sm text-gray-500">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              <span>Gemini Flash sedang menganalisis data keuangan Anda...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input & Quick Suggestions Bar */}
      <div className="bg-white p-4 border border-gray-200 rounded-b-xl shadow-sm space-y-3">
        {/* Quick Action Chips */}
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-thin">
          {quickPrompts.map((q, i) => (
            <button
              key={i}
              type="button"
              disabled={loading}
              onClick={() => handleSend(q)}
              className="whitespace-nowrap bg-gray-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-gray-700 text-xs px-3 py-1.5 rounded-full border border-gray-200 transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex space-x-2"
        >
          <input
            type="text"
            className="flex-1 border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Tanyakan analisis keuangan, laba, HPP, atau aturan SAK EMKM..."
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
          >
            <span>Kirim</span>
            <span>⚡</span>
          </button>
        </form>
      </div>
    </div>
  );
}
