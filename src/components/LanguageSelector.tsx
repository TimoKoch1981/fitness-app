/**
 * LanguageSelector — Compact language picker for login/register pages.
 *
 * Shows current language flag + code, opens a dropdown with all 17 languages.
 * Designed for top-right corner placement on auth pages.
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation, LANGUAGE_OPTIONS } from '../i18n';
import type { Language } from '../i18n';

export function LanguageSelector() {
  const { language, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const current = LANGUAGE_OPTIONS.find(l => l.code === language) ?? LANGUAGE_OPTIONS[0];

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/80 hover:bg-white border border-gray-200 rounded-lg text-sm text-gray-700 shadow-sm transition-colors"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="font-medium text-xs">{current.code.toUpperCase()}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[180px] max-h-[320px] overflow-y-auto z-50">
          {LANGUAGE_OPTIONS.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setLanguage(lang.code as Language);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-teal-50 transition-colors ${
                lang.code === language ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'
              }`}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
