import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { UserQuickMenu } from './UserQuickMenu';
import { ModeBar } from './ModeBar';

interface PageShellProps {
  title: string;
  children: ReactNode;
  className?: string;
  /** Extra actions rendered in the header (right side) */
  actions?: ReactNode;
  /** Hide the mode bar (e.g. for fullscreen flows like onboarding) */
  hideModeBar?: boolean;
}

/**
 * Shared page layout shell.
 * Provides consistent padding for bottom navigation (pb-20),
 * a sticky header, and an optional ModeBar surfacing active profile toggles
 * (Power+, Cut/Bulk, Stillzeit, …) — v14.14 / P1-4.
 */
export function PageShell({ title, children, className, actions, hideModeBar }: PageShellProps) {
  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Header — Editorial-Look: Page-Titel als Source Serif Display,
          hoeher (h-16 statt h-14), grosszuegigeres Padding. */}
      <header className="sticky top-0 z-40 bg-theme-surface/90 backdrop-blur-md border-b border-theme-line">
        <div className="max-w-lg md:max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-theme-ink font-theme-display tracking-tight">
            {title}
          </h1>
          <div className="flex items-center gap-2">
            {actions}
            <UserQuickMenu />
          </div>
        </div>
        {!hideModeBar && <ModeBar />}
      </header>

      {/* Content — generoese Padding fuer editorialen Eindruck */}
      <main className={cn('max-w-lg md:max-w-2xl mx-auto px-5 py-6 pb-24', className)}>
        {children}
      </main>
    </div>
  );
}
