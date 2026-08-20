'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, PageHeader, Select, TextArea } from '@/components/admin/ui';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

const MODELS = ['openai/gpt-4o-mini', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'meta-llama/llama-3.3-70b-instruct', 'google/gemini-flash-1.5'];

export default function OwnerAiPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState('openai/gpt-4o-mini');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [prompts, setPrompts] = useState<{ id: number; name: string; prompt_text: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/admin/prompts?per_page=100')
      .then((r) => (r.ok ? r.json() : Promise.resolve({ data: [] })))
      .then((body) => setPrompts(body.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput('');
    setError('');
    const next = [...messages, { role: 'user' as const, content }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are PortoCMS AI, a helpful assistant embedded in a portfolio CMS admin panel. Answer in Indonesian unless asked otherwise. Be concise.' },
            ...next.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'AI gagal merespons.');
      setMessages((m) => [...m, { role: 'assistant', content: body.content }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="AI Assistant" desc="Chat dengan asisten AI berbasis OpenRouter" />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select options={MODELS.map((m) => ({ value: m, label: m }))} value={model} onChange={setModel} />
        {prompts.length > 0 && (
          <select
            value=""
            onChange={(e) => { if (e.target.value) { setInput(e.target.value); } }}
            className="px-3 py-2 rounded-lg bg-slate-900/70 border border-white/10 text-sm text-slate-100 cursor-pointer"
          >
            <option value="" className="bg-slate-900">Muat prompt...</option>
            {prompts.map((p) => (
              <option key={p.id} value={p.prompt_text} className="bg-slate-900">{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {error && <p className="text-sm text-rose-400 mb-4 bg-rose-500/10 rounded-lg px-4 py-2.5">{error}</p>}

      <div className="rounded-xl bg-slate-900/70 border border-white/10 p-5 min-h-[420px] flex flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto max-h-[460px] pr-1">
          {messages.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-16">Mulai percakapan dengan AI. Misalnya: "Buatkan deskripsi project tentang Aplikasi POS".</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-cyan-500/15 text-cyan-100 ml-auto' : 'bg-white/5 text-slate-200'}`}>
              {m.content}
            </div>
          ))}
          {busy && <div className="text-slate-500 text-sm">AI sedang mengetik<span className="animate-pulse">...</span></div>}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2 mt-4">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Tulis pesan... (Enter untuk kirim)"
            className="min-h-[52px]"
          />
          <Button variant="primary" disabled={busy || !input.trim()} onClick={() => send()} className="self-end">Kirim</Button>
        </div>
      </div>
    </div>
  );
}