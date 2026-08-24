'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, TextInput, Button } from '@/components/admin/ui';

export default function OwnerLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, remember }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || 'Login gagal.');
        setLoading(false);
        return;
      }
      router.push('/owner/dashboard');
      router.refresh();
    } catch {
      setError('Terjadi kesalahan jaringan.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 font-[Inter]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl mb-3">🚀</div>
          <h1 className="font-display text-2xl font-bold text-white">Porto CMS</h1>
          <p className="text-slate-400 text-sm mt-1">Masuk ke dashboard owner</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 bg-slate-900/60 border border-white/10 rounded-2xl p-6">
          <Field label="Username">
            <TextInput value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="username" required />
          </Field>
          <Field label="Password">
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" required />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-cyan-400 w-4 h-4" />
            Ingat saya 30 hari
          </label>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <Button type="submit" variant="primary" disabled={loading} className="w-full justify-center">
            {loading ? 'Memproses...' : 'Masuk'}
          </Button>
          <a href="/" className="block text-center text-xs text-slate-500 hover:text-slate-300 transition-colors">← Kembali ke situs</a>
        </form>
      </div>
    </div>
  );
}