import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Trash2, Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useBuddyChat } from '../features/buddy/hooks/useBuddyChat';
import { ChatMessageBubble } from '../features/buddy/components/ChatMessage';
import { useProfile } from '../features/auth/hooks/useProfile';
import { useDailyMealTotals } from '../features/meals/hooks/useMeals';
import { useLatestBodyMeasurement } from '../features/body/hooks/useBodyMeasurements';
import { useSubstances } from '../features/medical/hooks/useSubstances';
import { today } from '../lib/utils';
import type { HealthContext } from '../types/health';

export function BuddyPage() {
  const { t, language } = useTranslation();
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Gather health context for personalized AI responses
  const { data: profile } = useProfile();
  const { totals } = useDailyMealTotals(today());
  const { data: latestBody } = useLatestBodyMeasurement();
  const { data: activeSubstances } = useSubstances(true);

  const healthContext: Partial<HealthContext> = {
    profile: profile ?? undefined,
    dailyStats: {
      calories: totals.calories,
      caloriesGoal: profile?.daily_calories_goal ?? 2000,
      protein: totals.protein,
      proteinGoal: profile?.daily_protein_goal ?? 150,
      carbs: totals.carbs,
      fat: totals.fat,
      water: 0,
      waterGoal: profile?.daily_water_goal ?? 8,
    },
    latestBodyMeasurement: latestBody ?? undefined,
    activeSubstances: activeSubstances ?? [],
  };

  const {
    messages,
    isLoading,
    isConnected,
    sendMessage,
    clearMessages,
    checkConnection,
    providerName,
  } = useBuddyChat({ context: healthContext, language });

  // Check AI connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput('');
    await sendMessage(message);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t.buddy.title}</h1>
              <div className="flex items-center gap-1">
                {isConnected === true ? (
                  <Wifi className="h-2.5 w-2.5 text-green-500" />
                ) : isConnected === false ? (
                  <WifiOff className="h-2.5 w-2.5 text-red-500" />
                ) : null}
                <span className="text-[9px] text-gray-400">{providerName}</span>
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title={t.buddy.clearChat}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <div className="max-w-lg mx-auto px-4 py-4 pb-36">
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

        {/* Connection Warning */}
        {isConnected === false && (
          <div className="bg-yellow-50 rounded-xl p-3 mb-4 text-center">
            <WifiOff className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
            <p className="text-xs text-yellow-700">{t.buddy.connectionError}</p>
            <button
              onClick={checkConnection}
              className="mt-2 text-xs text-teal-600 hover:underline font-medium"
            >
              {language === 'de' ? 'Erneut versuchen' : 'Retry'}
            </button>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}

        {/* Help hint when no messages */}
        {messages.length === 0 && isConnected !== false && (
          <div className="text-center text-gray-400 text-sm mt-8">
            <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-xs">{t.buddy.helpHint}</p>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <div className="fixed bottom-14 left-0 right-0 bg-white border-t border-gray-200 p-3">
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.buddy.placeholder}
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-teal-600 hover:to-emerald-700 transition-all flex items-center gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            {t.buddy.send}
          </button>
        </form>
      </div>
    </div>
  );
}
