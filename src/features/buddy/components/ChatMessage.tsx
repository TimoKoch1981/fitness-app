import { AlertCircle } from 'lucide-react';
import type { DisplayMessage } from '../hooks/useBuddyChat';

interface ChatMessageProps {
  message: DisplayMessage;
}

export function ChatMessageBubble({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  if (message.isLoading) {
    return (
      <div className="flex gap-3 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
          <span className="text-xs text-white font-bold">FB</span>
        </div>
        <div className="bg-white rounded-2xl rounded-tl-md p-4 shadow-sm max-w-[85%]">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex gap-3 mb-3 justify-end">
        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl rounded-tr-md p-4 shadow-sm max-w-[85%]">
          <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-3">
      <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
        <span className="text-xs text-white font-bold">FB</span>
      </div>
      <div className={`rounded-2xl rounded-tl-md p-4 shadow-sm max-w-[85%] ${
        message.isError ? 'bg-red-50' : 'bg-white'
      }`}>
        {message.isError && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-medium text-red-600">Fehler</span>
          </div>
        )}
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
          message.isError ? 'text-red-700' : 'text-gray-700'
        }`}>
          {message.content}
        </p>
      </div>
    </div>
  );
}
