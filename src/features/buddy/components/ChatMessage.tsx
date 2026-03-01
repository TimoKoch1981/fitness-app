import { useState, type ReactNode } from 'react';
import { AlertCircle, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { UserAvatar } from '../../../shared/components/UserAvatar';
import { useTranslation } from '../../../i18n';
import type { DisplayMessage } from '../hooks/useBuddyChat';

/** Hide ACTION blocks from the display during streaming */
function stripActionBlockFromDisplay(text: string): string {
  // Remove everything from ```ACTION: onwards (including partial blocks during streaming)
  return text.replace(/```(?:ACTION|action)[\s\S]*$/i, '').trim();
}

/**
 * Parse message content and convert PMID references to PubMed links.
 * Handles formats: [PMID:12345678], (PMID:12345678), PMID:12345678, PMID 12345678
 */
function renderContentWithCitations(content: string): ReactNode[] {
  const parts: ReactNode[] = [];
  // Match PMID patterns: [PMID:xxxxx], (PMID:xxxxx), PMID:xxxxx, PMID xxxxx
  const pmidRegex = /(?:\[|\()?PMID[:\s]?\s*(\d{6,10})(?:\]|\))?/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = pmidRegex.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const pmid = match[1];
    parts.push(
      <a
        key={`pmid-${keyIdx++}`}
        href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-0.5 text-[10px] text-teal-600 bg-teal-50 px-1 py-0.5 rounded font-mono hover:bg-teal-100 transition-colors no-underline"
        title={`PubMed PMID:${pmid}`}
      >
        <BookOpen className="h-2.5 w-2.5" />
        {pmid}
      </a>,
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}

/** Extract unique PMIDs from content */
function extractPMIDs(content: string): string[] {
  const pmidRegex = /PMID[:\s]?\s*(\d{6,10})/gi;
  const pmids = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = pmidRegex.exec(content)) !== null) {
    pmids.add(match[1]);
  }
  return Array.from(pmids);
}

/** Skill Sources Footer — shows which knowledge skills were used */
function SkillSourcesFooter({ skillVersions, pmids, language }: {
  skillVersions?: Record<string, string>;
  pmids: string[];
  language: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const de = language === 'de';

  const hasSkills = skillVersions && Object.keys(skillVersions).length > 0;
  const hasPmids = pmids.length > 0;

  if (!hasSkills && !hasPmids) return null;

  const skillLabels: Record<string, string> = {
    nutrition: de ? 'Ernaehrung' : 'Nutrition',
    training: de ? 'Training' : 'Training',
    medical: de ? 'Medizin' : 'Medical',
    substances: de ? 'Substanzen' : 'Substances',
    anabolics: de ? 'Anabolika' : 'Anabolics',
    supplements: de ? 'Supplements' : 'Supplements',
    sleep: de ? 'Schlaf' : 'Sleep',
    pct: 'PCT',
    competition: de ? 'Wettkampf' : 'Competition',
    femaleFitness: de ? 'Frauen-Fitness' : 'Female Fitness',
    analysis: de ? 'Analyse' : 'Analysis',
    beauty: de ? 'Beauty' : 'Beauty',
    lifestyle: 'Lifestyle',
    nutritionScience: de ? 'Ernaehrungswiss.' : 'Nutrition Sci.',
    general: de ? 'Allgemein' : 'General',
  };

  return (
    <div className="mt-1.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[9px] text-gray-300 hover:text-gray-500 transition-colors"
      >
        <BookOpen className="h-2.5 w-2.5" />
        <span>{de ? 'Quellen' : 'Sources'}</span>
        {hasPmids && (
          <span className="bg-teal-50 text-teal-600 px-1 rounded text-[8px] font-medium">
            {pmids.length} PMID{pmids.length > 1 ? 's' : ''}
          </span>
        )}
        {expanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
      </button>

      {expanded && (
        <div className="mt-1 pl-3.5 border-l border-gray-100 space-y-0.5">
          {hasSkills && (
            <div className="text-[9px] text-gray-400">
              <span className="font-medium">{de ? 'Wissensbasis:' : 'Knowledge base:'}</span>{' '}
              {Object.entries(skillVersions!).map(([skill, version], i) => (
                <span key={skill}>
                  {i > 0 && ', '}
                  {skillLabels[skill] ?? skill} v{version}
                </span>
              ))}
            </div>
          )}
          {hasPmids && (
            <div className="text-[9px] text-gray-400">
              <span className="font-medium">{de ? 'Referenzen:' : 'References:'}</span>{' '}
              {pmids.map((pmid, i) => (
                <span key={pmid}>
                  {i > 0 && ', '}
                  <a
                    href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-500 hover:text-teal-700 hover:underline"
                  >
                    PMID:{pmid}
                  </a>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ChatMessageProps {
  message: DisplayMessage;
  avatarUrl?: string | null;
}

export function ChatMessageBubble({ message, avatarUrl }: ChatMessageProps) {
  const { t, language } = useTranslation();
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

  // Extract PMIDs from completed messages
  const isComplete = !message.isStreaming && !message.isError && !message.isLoading;
  const pmids = isComplete ? extractPMIDs(message.content) : [];
  const displayContent = message.isStreaming
    ? stripActionBlockFromDisplay(message.content)
    : message.content;

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
          {/* Render content with PMID citations as clickable links */}
          {isComplete && pmids.length > 0
            ? renderContentWithCitations(displayContent)
            : displayContent}
          {/* Blinking cursor during streaming */}
          {message.isStreaming && <span className="inline-block w-1.5 h-4 bg-teal-500 animate-pulse ml-0.5 align-text-bottom" />}
        </p>
        {/* AI accuracy disclaimer — shown on completed, non-error messages */}
        {isComplete && (
          <p className="text-[9px] text-gray-300 mt-1.5 select-none">
            ⚠ {t.buddy.aiDisclaimer}
          </p>
        )}
        {/* Source citations footer — skill versions + PMID links */}
        {isComplete && (
          <SkillSourcesFooter
            skillVersions={message.skillVersions}
            pmids={pmids}
            language={language}
          />
        )}
      </div>
    </div>
  );
}
