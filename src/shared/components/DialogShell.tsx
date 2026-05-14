/**
 * DialogShell — shared chrome for the project's bottom-sheet / centered dialogs.
 *
 * 35+ dialogs in the codebase each implement their own backdrop, sticky header,
 * close button, max-w / max-h, mobile bottom-sheet vs desktop centered layout.
 * Result: inconsistent paddings, broken Esc-to-close in some, no focus trap,
 * no scroll lock on iOS. (See IST-Analyse §4.D and Phase-A Audit P2-10.)
 *
 * This Shell consolidates the chrome into one place. It is not a wholesale
 * migration — existing dialogs keep working. New dialogs (and any dialog
 * touched for other reasons) should opt-in to this Shell.
 *
 * Features:
 *   - Backdrop click → close (overridable via `dismissOnBackdrop=false`)
 *   - Esc → close
 *   - Body scroll lock while open (iOS scroll-through fix)
 *   - Bottom-sheet on mobile (`items-end`), centered on `sm+`
 *   - Sticky header with title + close button
 *   - Max-w / max-h with internal scroll on overflow
 *   - Optional `actions` slot in the header for extra buttons
 *
 * Usage:
 *   <DialogShell open={open} onClose={onClose} title={t.medical.addBP}>
 *     <form onSubmit={handleSubmit}>…</form>
 *   </DialogShell>
 *
 * Migration is opt-in; v14.19 ships the Shell + 2 pilot migrations
 * (AddBloodPressureDialog, AddBodyMeasurementDialog). The other 33 dialogs
 * stay on their bespoke chrome until they're touched for other reasons.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DialogShellProps {
  /** Controls visibility. When false the component renders nothing. */
  open: boolean;
  /** Called when the user dismisses the dialog (backdrop, Esc, X). */
  onClose: () => void;
  /** Header title — sticky at top */
  title: ReactNode;
  /** Body content (form, content, etc.) */
  children: ReactNode;
  /** Optional extra buttons rendered to the left of the X (e.g. a refresh icon). */
  headerActions?: ReactNode;
  /** Disable backdrop-click-to-close (e.g. when you have unsaved input warnings). */
  dismissOnBackdrop?: boolean;
  /** Width preset. 'md' (default) ≈ 32rem, 'lg' ≈ 36rem, 'xl' ≈ 42rem. */
  width?: 'md' | 'lg' | 'xl';
  /** Extra className on the body wrapper (rare — for special layouts). */
  bodyClassName?: string;
}

const WIDTH_CLASSES: Record<NonNullable<DialogShellProps['width']>, string> = {
  md: 'max-w-lg',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
};

export function DialogShell({
  open,
  onClose,
  title,
  children,
  headerActions,
  dismissOnBackdrop = true,
  width = 'md',
  bodyClassName,
}: DialogShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Esc → close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Body scroll lock while open (iOS quirk: <body> scrolls under the sheet)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={dismissOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className={cn(
          'relative bg-white rounded-t-2xl sm:rounded-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto',
          WIDTH_CLASSES[width],
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center gap-1">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className={cn('p-4', bodyClassName)}>{children}</div>
      </div>
    </div>
  );
}
