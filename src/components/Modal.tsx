import { useEffect, useRef, type ReactNode } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialog shell: closes on Escape and on backdrop click, keeps Tab inside the
 * dialog, locks the page behind it, and restores focus to whatever opened it.
 */
export const Modal = ({
  onClose,
  labelledBy,
  className = 'max-w-2xl',
  children,
}: {
  onClose: () => void;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Callers pass an inline arrow, so onClose is a new function every render.
  // Keeping it in a ref lets the effect below run once on mount instead of
  // re-running — and stealing focus back — on every keystroke.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        el => el.offsetParent !== null,
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4"
      onMouseDown={e => {
        // Only a press that both starts and ends on the backdrop closes, so a
        // drag that began inside the panel does not dismiss it.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`bg-white rounded-3xl p-6 w-full shadow-2xl overflow-y-auto max-h-[90vh] ${className}`}
      >
        {children}
      </div>
    </div>
  );
};
