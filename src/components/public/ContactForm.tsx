'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus('idle');
    setError('');
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Gagal mengirim pesan.');
      setStatus('ok');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    'w-full px-4 py-3 text-sm outline-none transition-all glass-card';
  const labelCls = 'block text-xs uppercase tracking-wider mb-1.5';
  const labelStyle = { color: 'var(--app-muted)' };
  const textStyle = { color: 'var(--app-text)' };

  if (status === 'ok') {
    return (
      <div className="glass-card  p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="font-display font-bold text-lg" style={textStyle}>
          Pesan terkirim!
        </h3>
        <p className="text-sm mt-2" style={labelStyle}>
          Terima kasih, saya akan segera membalas ke email Anda.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="btn-solid mt-5 px-6 py-2.5 text-sm font-semibold transition-all hover:opacity-85 cursor-pointer"
          
        >
          Kirim pesan lain
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass-card  p-6 sm:p-8 text-left max-w-xl mx-auto">
      {error && <p className="text-sm text-rose-400 mb-4 bg-rose-500/10 px-4 py-2.5">{error}</p>}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} style={labelStyle}>Nama</label>
          <input
            required
            minLength={2}
            maxLength={100}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nama Anda"
            className={inputCls}
            style={{ ...textStyle, background: 'transparent' }}
          />
        </div>
        <div>
          <label className={labelCls} style={labelStyle}>Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="email@contoh.com"
            className={inputCls}
            style={{ ...textStyle, background: 'transparent' }}
          />
        </div>
      </div>
      <div className="mt-4">
        <label className={labelCls} style={labelStyle}>Subjek <span className="normal-case font-normal" style={labelStyle}>(opsional)</span></label>
        <input
          maxLength={200}
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          placeholder="Topik pesan"
          className={inputCls}
          style={{ ...textStyle, background: 'transparent' }}
        />
      </div>
      <div className="mt-4">
        <label className={labelCls} style={labelStyle}>Pesan</label>
        <textarea
          required
          minLength={5}
          maxLength={5000}
          rows={5}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="Tulis pesan Anda di sini..."
          className={`${inputCls} resize-y`}
          style={{ ...textStyle, background: 'transparent' }}
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="btn-solid mt-6 w-full sm:w-auto px-8 py-3 text-sm font-semibold transition-all hover:opacity-85 disabled:opacity-50 cursor-pointer shine"
        
      >
        {busy ? 'Mengirim...' : 'Kirim Pesan'}
      </button>
    </form>
  );
}
