import { AlertCircle } from 'lucide-react';
import { UserAvatar } from '../../../shared/components/UserAvatar';
import type { DisplayMessage } from '../hooks/useBuddyChat';

/** Hide ACTION blocks from the display during streaming */
function stripActionBlockFromDisplay(text: string): string {
  // Remove everything from ```ACTION: onwards (including partial blocks during streaming)
  return text.replace(/```(?:ACTION|action)[\s\S]*$/i, '').trim();
}

interface ChatMessageProps {
  message: DisplayMessage;
  avatarUrl?: string | null;
}

export function ChatMessageBubble({ message, avatarUrl }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Loading state: show bouncing dots while waiting for first token
  if (message.isLoading && !message.content) {
    return (
      <div className="flex gap-3 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
          <span className="text-xs text-white font-bold">FB</span>
        </div>
        <div className="bg-white rounded-2xl rounded-tl-md p-4 shadow-sm max-w-[85%]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-gray-400">Denkt nach...</span>
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
        <UserAvatar avatarUrl={avatarUrl} size="sm" className="mt-1" />
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-3">
      <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
        <span className="text-xs text-white font-bold">
          {message.agentIcon && message.agentType !== 'general' ? message.agentIcon : 'FB'}
        </span>
      </div>
      <div className={`rounded-2xl rounded-tl-md p-4 shadow-sm max-w-[85%] ${
        message.isError ? 'bg-red-50' : 'bg-white'
      }`}>
        {/* Agent attribution — only for specialist agents, not general */}
        {message.agentType && message.agentType !== 'general' && message.agentName && (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-[10px]">{message.agentIcon}</span>
            <span className="text-[10px] text-gray-400 font-medium">{message.agentName}</span>
          </div>
        )}
        {message.isError && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-medium text-red-600">Fehler</span>
          </div>
        )}
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
          message.isError ? 'text-red-700' : 'text-gray-700'
        }`}>
          {/* During streaming, hide ACTION blocks from display */}
          {message.isStreaming ? stripActionBlockFromDisplay(message.content) : message.content}
          {/* Blinking cursor during streaming */}
          {message.isStreaming && <span className="inline-block w-1.5 h-4 bg-teal-500 animate-pulse ml-0.5 align-text-bottom" />}
        </p>
      </div>
    </div>
  );
}
