import React from 'react';

export const btn = {
  primary: 'inline-flex items-center justify-center gap-2 px-4 py-2 min-h-10 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  ghost: 'inline-flex items-center justify-center gap-2 px-4 py-2 min-h-10 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer',
  danger: 'inline-flex items-center justify-center gap-2 px-4 py-2 min-h-10 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-medium text-sm transition-colors cursor-pointer',
  dangerSolid: 'inline-flex items-center justify-center gap-2 px-4 py-2 min-h-10 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-colors cursor-pointer',
  link: 'text-cyan-400 hover:text-cyan-300 text-sm transition-colors cursor-pointer',
};

export function Button({ children, onClick, type = 'button', variant = 'ghost', disabled, className }: {
  children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit'; variant?: keyof typeof btn; disabled?: boolean; className?: string;
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${btn[variant]} ${className || ''}`}>
      {children}
    </button>
  );
}

export function Field({ label, hint, children, error }: { label: string; hint?: string; children: React.ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
      {error && <span className="block text-[11px] text-rose-400 mt-1">{error}</span>}
    </label>
  );
}

export const inputCls = 'w-full px-3 py-2 rounded-lg bg-slate-900/70 border border-white/10 focus:border-cyan-400/60 focus:outline-none text-sm text-slate-100 placeholder:text-slate-500';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className || ''}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} min-h-[90px] ${props.className || ''}`} />;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2 cursor-pointer group">
      <span className={`w-9 h-5 rounded-full transition-colors relative ${checked ? 'bg-cyan-500' : 'bg-slate-700'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}

export function Select({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} cursor-pointer`}>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
      ))}
    </select>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'max-w-4xl' : 'max-w-xl'} rounded-2xl bg-slate-900 border border-white/10 shadow-2xl`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Badge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/50 text-slate-400'}`}>
      {active ? 'Aktif' : 'Nonaktif'}
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
      <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="text-center text-slate-500 py-16 text-sm">{text}</p>;
}

export function PageHeader({ title, desc, actions }: { title: string; desc?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="font-[Space_Grotesk] text-2xl md:text-3xl font-bold text-white">{title}</h1>
        {desc && <p className="text-slate-400 text-sm mt-1">{desc}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Th({ children, onClick, className }: { children?: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <th onClick={onClick} className={`text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${onClick ? 'cursor-pointer select-none hover:text-slate-300' : ''} ${className || ''}`}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm text-slate-300 border-t border-white/5 align-top ${className || ''}`}>{children}</td>;
}