import { Component, type ReactNode } from 'react';

interface ComponentErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback UI. If not provided, a default retry card is shown. */
  fallback?: ReactNode;
  /** Label shown in the error card (e.g. component or section name) */
  label?: string;
  /** Language for default fallback messages ('de' | 'en'). Defaults to 'de'. */
  language?: 'de' | 'en';
}

interface ComponentErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

/**
 * Reusable error boundary that catches render errors in a subtree
 * and shows a compact retry card instead of crashing the whole app.
 *
 * Usage:
 *   <ComponentErrorBoundary label="AddMealDialog" language={language}>
 *     <AddMealDialog ... />
 *   </ComponentErrorBoundary>
 */
export class ComponentErrorBoundary extends Component<
  ComponentErrorBoundaryProps,
  ComponentErrorBoundaryState
> {
  constructor(props: ComponentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: null };
  }

  static getDerivedStateFromError(error: Error): ComponentErrorBoundaryState {
    return { hasError: true, error, componentStack: null };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(
      `[ComponentErrorBoundary] ${this.props.label ?? 'Component'} crashed:`,
      error,
      info.componentStack,
    );
    this.setState({ componentStack: info.componentStack ?? null });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, componentStack: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Use custom fallback if provided
    if (this.props.fallback) {
      return this.props.fallback;
    }

    const isDE = (this.props.language ?? 'de') === 'de';

    return (
      <div className="flex flex-col items-center justify-center p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <p className="text-sm font-semibold text-red-700 mb-1">
          {isDE ? 'Etwas ist schiefgelaufen' : 'Something went wrong'}
        </p>
        <p className="text-xs text-red-500 mb-3">
          {isDE
            ? 'Dieser Bereich konnte nicht geladen werden.'
            : 'This section could not be loaded.'}
        </p>
        {this.state.error && (
          <p className="text-[10px] text-red-400 mb-3 max-w-xs break-words">
            {this.state.error.message}
          </p>
        )}
        {this.state.componentStack && (
          <details className="mb-3 max-w-xs">
            <summary className="text-[10px] text-red-400 cursor-pointer">Stack</summary>
            <pre className="text-[8px] text-red-300 text-left whitespace-pre-wrap break-words mt-1 max-h-32 overflow-y-auto">
              {this.state.componentStack}
            </pre>
          </details>
        )}
        <button
          onClick={this.handleRetry}
          className="px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          {isDE ? 'Erneut versuchen' : 'Try again'}
        </button>
      </div>
    );
  }
}
