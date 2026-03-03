import { Copy, Check, MessageCircle, Mail, Users, Gift } from 'lucide-react';
import { useInviteCode } from '../hooks/useInviteCode';
import { useTranslation } from '../../../i18n';

/**
 * InviteCard — shown on the ProfilePage.
 * Displays the user's invite code, share buttons, and referral count.
 */
export function InviteCard() {
  const { inviteCode, inviteLink, copied, copyToClipboard, referralCount } = useInviteCode();
  const { t } = useTranslation();

  if (!inviteCode) return null;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `${(t.invite as Record<string, string>).shareText ?? 'Komm zu FitBuddy!'} ${inviteLink}`
  )}`;

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(
    (t.invite as Record<string, string>).emailSubject ?? 'FitBuddy Einladung'
  )}&body=${encodeURIComponent(
    `${(t.invite as Record<string, string>).emailBody ?? 'Ich nutze FitBuddy und moechte dich einladen!'}\n\n${inviteLink}`
  )}`;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-3">
        <div className="flex items-center gap-2 text-white">
          <Gift className="w-5 h-5" />
          <h3 className="font-semibold text-sm">{(t.invite as Record<string, string>).title}</h3>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Invite code display */}
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">{(t.invite as Record<string, string>).yourCode}</p>
          <p className="text-2xl font-mono font-bold text-teal-600 tracking-wider">{inviteCode}</p>
        </div>

        {/* Invite link + copy button */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 truncate font-mono">
            {inviteLink}
          </div>
          <button
            onClick={copyToClipboard}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              copied
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-teal-50 text-teal-600 border border-teal-200 hover:bg-teal-100'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied
              ? (t.invite as Record<string, string>).copied
              : (t.invite as Record<string, string>).copyLink}
          </button>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors border border-green-200"
          >
            <MessageCircle className="w-4 h-4" />
            {(t.invite as Record<string, string>).shareWhatsApp}
          </a>
          <a
            href={mailtoUrl}
            className="flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <Mail className="w-4 h-4" />
            {(t.invite as Record<string, string>).shareEmail}
          </a>
        </div>

        {/* Referral count */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-2 border-t border-gray-100">
          <Users className="w-4 h-4 text-teal-500" />
          <span>
            {(t.invite as Record<string, string>).referralCount?.replace('{count}', String(referralCount))}
          </span>
        </div>
      </div>
    </div>
  );
}
