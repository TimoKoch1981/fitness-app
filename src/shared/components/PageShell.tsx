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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-lg md:max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          <div className="flex items-center gap-2">
            {actions}
            <UserQuickMenu />
          </div>
        </div>
        {!hideModeBar && <ModeBar />}
      </header>

      {/* Content with bottom padding for navigation */}
      <main className={cn('max-w-lg md:max-w-2xl mx-auto px-4 py-4 pb-20', className)}>
        {children}
      </main>
    </div>
  );
}
