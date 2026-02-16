import { MessageCircle } from 'lucide-react';
import { useTranslation } from '../i18n';

export function BuddyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">{t.buddy.title}</h1>
        </div>
      </header>

      {/* Chat Area */}
      <div className="max-w-lg mx-auto px-4 py-4 pb-32">
        {/* Greeting */}
        <div className="flex gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
            <span className="text-xs text-white font-bold">FB</span>
          </div>
          <div className="bg-white rounded-2xl rounded-tl-md p-4 shadow-sm max-w-[85%]">
            <p className="text-sm text-gray-700 leading-relaxed">
              {t.buddy.greeting}
            </p>
          </div>
        </div>

        {/* Placeholder for future messages */}
        <div className="text-center text-gray-400 text-sm mt-12">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>Chat-Verlauf erscheint hier</p>
          <p className="text-xs mt-1">Phase 3c: KI-Integration</p>
        </div>
      </div>

      {/* Input Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-3">
        <div className="max-w-lg mx-auto flex gap-2">
          <input
            type="text"
            placeholder={t.buddy.placeholder}
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-colors"
            disabled
          />
          <button
            className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-full text-sm font-medium opacity-50 cursor-not-allowed"
            disabled
          >
            Senden
          </button>
        </div>
      </div>
    </div>
  );
}
