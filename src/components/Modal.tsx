import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { FOCUS, TRANSITION } from './ui/focus';
import { Button } from './ui/Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
  /** Pied personnalisé (boutons). Défaut : bouton Fermer. `null` = pas de pied. */
  footer?: React.ReactNode | null;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** En-tête / pied : Fond clair TUNAV (#F2F6FF) – sépare clairement du corps blanc. */
const CHROME =
  'bg-surface border-border-subtle shrink-0';

/** Modale Industrial Tech – header + footer colorés (design system TUNAV). */
export function Modal({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  const showFooter = footer !== null;
  const footerContent =
    footer === undefined ? (
      <Button type="button" variant="secondary" onClick={onClose}>
        Fermer
      </Button>
    ) : (
      footer
    );

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusFirst = () => {
      if (!panel) return;
      const targets = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
      (targets[0] ?? panel).focus();
    };
    const t = window.setTimeout(focusFirst, 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const targets = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
      );
      if (targets.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-overlay flex items-center justify-center p-0 md:p-4">
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            key="modal-content"
            ref={panelRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={`relative flex h-full w-full max-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-white outline-none shadow-2xl rounded-none md:h-auto md:w-[calc(100%-2rem)] md:rounded-xl ${sizeClasses[size]}`}
          >
            {/* Header – Fond clair */}
            <div
              className={`flex items-center justify-between gap-4 border-b px-5 py-4 ${CHROME} md:rounded-t-modal`}
            >
              <h2 id={titleId} className="truncate text-h4 text-text">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className={`flex h-control w-control items-center justify-center rounded-control text-text-muted hover:bg-surface hover:text-text ${TRANSITION} ${FOCUS}`}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* Corps – Blanc */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-surface px-5 py-4">{children}</div>

            {/* Footer – Fond clair */}
            {showFooter && (
              <div
                className={`flex flex-wrap items-center justify-between gap-2.5 border-t px-5 py-3 ${CHROME} md:rounded-b-modal [&>:only-child]:ml-auto`}
              >
                {footerContent}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
