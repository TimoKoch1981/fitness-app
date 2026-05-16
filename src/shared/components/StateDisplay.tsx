/**
 * StateDisplay — Konsistente Empty/Loading/Error-States (UX7 / Phase 5).
 *
 * Bisher hat jedes Feature seinen eigenen "Noch keine Daten"-Block. Folge:
 * unterschiedliche Layouts, verschiedene Loading-Indikatoren, kein
 * Retry-Button bei Errors. Ergebnis: Lina-Persona-Review: "App fuehlt
 * sich uneinheitlich an."
 *
 * Dieses Component vereinheitlicht alle drei States mit einheitlichem
 * Spacing, Iconography, Typography. Nicht zwanglaeufig - existierende
 * Custom-Empty-States bleiben — neue Features sollten StateDisplay nutzen.
 *
 * Usage:
 *   <StateDisplay variant="empty" icon={Utensils} title="Noch keine Mahlzeiten"
 *     description="Tippe auf Plus um deine erste Mahlzeit zu loggen." />
 *   <StateDisplay variant="loading" />
 *   <StateDisplay variant="error" message={err.message} onRetry={refetch} />
 */

import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type StateVariant = 'empty' | 'loading' | 'error';

interface StateDisplayProps {
  variant: StateVariant;
  /** Icon for empty state. Defaults to a neutral icon. */
  icon?: LucideIcon;
  /** Title text for empty/error. */
  title?: string;
  /** Description / hint text for empty. */
  description?: string;
  /** Error message for error variant. */
  message?: string;
  /** Retry handler for error variant — shows a "Wiederholen" button. */
  onRetry?: () => void;
  /** Custom action button (e.g. "Erste Mahlzeit anlegen"). */
  action?: ReactNode;
  /** Compact mode — less vertical padding, for in-card displays. */
  compact?: boolean;
}

export function StateDisplay({
  variant,
  icon: Icon,
  title,
  description,
  message,
  onRetry,
  action,
  compact = false,
}: StateDisplayProps) {
  const padding = compact ? 'py-6 px-4' : 'py-12 px-4';

  if (variant === 'loading') {
    return (
      <div className={`flex flex-col items-center justify-center ${padding} text-theme-ink-3`}>
        <Loader2 className="h-6 w-6 animate-spin mb-2" aria-hidden="true" />
        <p className="text-sm">{title ?? 'Lädt...'}</p>
      </div>
    );
  }

  if (variant === 'error') {
    return (
      <div className={`flex flex-col items-center justify-center ${padding} text-center`}>
        <AlertCircle className="h-8 w-8 text-theme-danger mb-2" aria-hidden="true" />
        <p className="text-sm font-semibold text-theme-ink mb-1">
          {title ?? 'Etwas ist schiefgelaufen'}
        </p>
        {message && (
          <p className="text-xs text-theme-ink-3 mb-3 max-w-sm">{message}</p>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-theme-md border border-theme-line text-theme-ink hover:bg-theme-surface-2"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Wiederholen
          </button>
        )}
      </div>
    );
  }

  // empty
  return (
    <div className={`flex flex-col items-center justify-center ${padding} text-center`}>
      {Icon && <Icon className="h-8 w-8 text-theme-ink-3 mb-2" aria-hidden="true" />}
      {title && (
        <p className="text-sm font-semibold text-theme-ink mb-1">{title}</p>
      )}
      {description && (
        <p className="text-xs text-theme-ink-3 mb-3 max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
}
