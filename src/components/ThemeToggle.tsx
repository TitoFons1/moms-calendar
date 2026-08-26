'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

type Theme = 'light' | 'system' | 'dark';

export const THEME_KEY = 'moms-calendar-theme';
const THEME_EVENT = 'moms-calendar-theme-change';

const applyTheme = (theme: Theme) => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
};

/* El tema vive en localStorage (un sistema externo a React), así que lo leemos
   con useSyncExternalStore: sin efectos que cambien estado y sin parpadeos. */
const subscribe = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
};

const readTheme = (): Theme => {
  try {
    return (localStorage.getItem(THEME_KEY) as Theme | null) ?? 'system';
  } catch {
    return 'system';
  }
};

const readServerTheme = (): Theme => 'system';

const OPTIONS: { id: Theme; label: string; icon: React.ReactNode }[] = [
  {
    id: 'light',
    label: 'Claro',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
      </svg>
    ),
  },
  {
    id: 'system',
    label: 'Automático',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2.5" y="4" width="19" height="12.5" rx="2" />
        <path d="M8.5 20.5h7M12 16.5v4" />
      </svg>
    ),
  },
  {
    id: 'dark',
    label: 'Oscuro',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M20.5 14.4A8.6 8.6 0 1 1 9.6 3.5a7 7 0 0 0 10.9 10.9Z" />
      </svg>
    ),
  },
];

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, readServerTheme);

  const selectTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* modo privado: seguimos aplicando el tema en memoria */
    }
    applyTheme(next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  // Sincroniza el DOM con el tema elegido y sigue al sistema si está en "Automático"
  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  return (
    <div
      role="group"
      aria-label="Tema de la aplicación"
      className="flex items-center gap-1 rounded-full border border-line bg-panel p-1 shadow-sm"
    >
      {OPTIONS.map((option) => {
        const active = theme === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => selectTheme(option.id)}
            aria-pressed={active}
            title={option.label}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-all duration-200 active:scale-95 ${
              active ? 'bg-brand text-white shadow-sm' : 'text-ink-soft hover:bg-brand-soft hover:text-ink'
            }`}
          >
            <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
              {option.icon}
            </span>
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
