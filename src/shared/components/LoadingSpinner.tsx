/**
 * Full-page loading spinner shown during lazy-loaded route transitions.
 * Uses Tailwind CSS with the app's teal accent color.
 */
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Laden...</span>
      </div>
    </div>
  );
}
