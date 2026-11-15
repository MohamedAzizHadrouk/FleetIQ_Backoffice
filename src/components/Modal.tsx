import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { FOCUS, TRANSITION } from './ui/focus';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

/** Modale Industrial Tech – shadow-overlay, z-overlay, rounded-modal 8 px (DL § 5). */
export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-overlay flex items-center justify-center">
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
            onClick={onClose}
            className="absolute inset-0 bg-tunav-anthracite/60"
          />
          <motion.div
            key="modal-content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`relative w-[calc(100%-2rem)] md:w-full ${sizeClasses[size]} bg-surface rounded-modal shadow-overlay max-h-[calc(100vh-2rem)] flex flex-col`}
          >
            <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-border">
              <h2 className="text-h4 text-text">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className={`flex h-control w-control items-center justify-center text-text-muted hover:text-text hover:bg-surface-muted rounded-control ${TRANSITION} ${FOCUS}`}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
