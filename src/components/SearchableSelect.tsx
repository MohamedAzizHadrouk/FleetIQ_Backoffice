import React, { useEffect, useState, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { FOCUS, TRANSITION } from './ui/focus';
import { fieldControlClass } from './ui/Field';

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  icon?: React.ReactNode;
  label?: string;
}

/** Liste searchable Industrial Tech (DL § 9.11). */
export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Rechercher...',
  icon,
  label
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = options.filter((opt) => opt.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
    setQuery('');
  };
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };
  const openDropdown = () => {
    setIsOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-label text-text mb-1 flex items-center gap-1.5">
          {icon}
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={openDropdown}
        className={`w-full flex items-center justify-between ${fieldControlClass} text-left ${
          isOpen ? 'border-primary ring-3 ring-focus/25' : ''
        }`}
      >
        <span className={value ? 'text-text' : 'text-text-muted'}>{value || placeholder}</span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
              aria-label="Effacer"
              className={`p-0.5 rounded-control text-text-muted hover:text-text ${TRANSITION}`}
            >
              <X size={14} aria-hidden="true" />
            </span>
          )}
          <ChevronDown size={16} className="text-text-muted" aria-hidden="true" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-dropdown mt-1 w-full min-w-[12rem] py-1 bg-surface border border-border-strong rounded-card shadow-raised max-h-60 overflow-auto">
          <div className="px-2 pb-1">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrer…"
                className={`${fieldControlClass} pl-8`}
              />
            </div>
          </div>
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-small text-text-muted">Aucun résultat</p>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`flex w-full items-center gap-2 h-control px-3 text-small text-text hover:bg-surface-muted text-left ${FOCUS} focus-visible:ring-inset`}
              >
                {opt}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
