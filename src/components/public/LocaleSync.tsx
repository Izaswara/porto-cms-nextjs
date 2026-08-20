'use client';

import { useEffect } from 'react';

/** Sinkronkan <html lang> dengan locale aktif (padanan app()->setLocale di Laravel) */
export default function LocaleSync({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
