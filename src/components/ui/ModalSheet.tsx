import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const ModalSheet: React.FC<ModalSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg'
}) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKey);
    }
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center p-0 sm:p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`bg-[#FFFDF8] sm:rounded-3xl shadow-lifted w-full ${maxWidthClasses[maxWidth]} relative animate-fadeIn overflow-hidden min-h-screen sm:min-h-0 sm:my-8 border border-slate-200 flex flex-col paper-bg-texture`}
        >
          {/* Sticky Header */}
          <div className="bg-gradient-to-r from-agri-800 to-agri-950 px-6 py-5 text-white sticky top-0 z-10 flex items-start justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-1.5">
                {title}
              </h2>
              {subtitle && (
                <p className="text-[11px] text-agri-100 mt-0.5 uppercase tracking-wide font-semibold">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            {children}
          </div>

          {/* Sticky Action Footer */}
          {footer && (
            <div className="sticky bottom-0 z-10 p-4 bg-slate-50 border-t border-slate-200">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
export default ModalSheet;
