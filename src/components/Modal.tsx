import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}: ModalProps) {
  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  return createPortal(<AnimatePresence>
      {isOpen && <div className="fixed inset-0 z-[9998] flex items-center justify-center">
          <motion.div key="modal-backdrop" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} onClick={onClose} className="absolute inset-0 bg-tunav-anthracite/60" />
          <motion.div key="modal-content" initial={{
        opacity: 0,
        y: 20,
        scale: 0.95
      }} animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }} exit={{
        opacity: 0,
        y: 20,
        scale: 0.95
      }} transition={{
        duration: 0.2,
        ease: 'easeOut'
      }} role="dialog" aria-modal="true" aria-label={title} className={`relative w-[calc(100%-2rem)] md:w-full ${sizeClasses[size]} bg-surface rounded-modal shadow-overlay max-h-[calc(100vh-2rem)] flex flex-col`}>
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border-subtle">
              <h2 className="text-h4 text-text">{title}</h2>
              <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-9 w-9 items-center justify-center text-text-muted hover:text-text hover:bg-surface-muted rounded-control transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </div>}
    </AnimatePresence>, document.body);
}