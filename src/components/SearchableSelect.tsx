import React, { useEffect, useState, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  icon?: React.ReactNode;
  label?: string;
}
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
  return <div ref={containerRef} className="relative">
      {label && <label className="block text-mention font-medium text-text mb-1 flex items-center gap-1.5">
          {icon}
          {label}
        </label>}

      {/* Trigger button */}
      <button type="button" onClick={openDropdown} className={`w-full flex items-center justify-between px-3 py-2 border rounded-card text-small transition-shadow text-left ${isOpen ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-text'}`}>
        <span className={value ? 'text-text' : 'text-text-muted'}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && <span role="button" onClick={handleClear} className="p-0.5 text-text-muted hover:text-text rounded-control transition-colors">
              <X size={14} />
            </span>}
          <ChevronDown size={16} className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && <div className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-card shadow-raised overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-border-subtle">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher..." className="w-full pl-8 pr-3 py-1.5 bg-surface-muted border border-border-strong rounded-control text-small text-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:border-primary transition-shadow" />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-44 overflow-y-auto">
            {filtered.length > 0 ? filtered.map((opt) => <button key={opt} type="button" onClick={() => handleSelect(opt)} className={`w-full text-left px-3 py-2 text-small transition-colors ${value === opt ? 'bg-primary-50 text-primary font-medium' : 'text-text hover:bg-surface-muted'}`}>
                  {opt}
                </button>) : <div className="px-3 py-4 text-center text-small text-text-muted">
                Aucun résultat
              </div>}
          </div>
        </div>}
    </div>;
}