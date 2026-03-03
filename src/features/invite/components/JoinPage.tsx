import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Gift, ArrowRight, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../../i18n';
import { storeReferralCode } from '../hooks/useInviteCode';
import { APP_NAME } from '../../../lib/constants';

/**
 * JoinPage — public page at /join/:code
 * Shows a welcome message for invited users and stores the referral code.
 */
export function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const { t } = useTranslation();

  // Store referral code in localStorage on mount
  useEffect(() => {
    if (code) {
      storeReferralCode(code);
    }
  }, [code]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="relative max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          {/* Gift icon */}
          <motion.div
            className="w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-teal-500/20"
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
          >
            <Gift className="w-10 h-10 text-white" />
          </motion.div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-3">
            {(t.invite as Record<string, string>).joinTitle}
          </h1>

          <p className="text-gray-400 mb-2">
            {(t.invite as Record<string, string>).joinMessage}
          </p>

          {/* Code display */}
          {code && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded-lg text-teal-400 font-mono text-sm mb-6">
              <Users className="w-4 h-4" />
              {code}
            </div>
          )}

          {/* CTA Button */}
          <Link
            to="/register"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25 transition-all text-lg mt-6"
          >
            {(t.invite as Record<string, string>).joinCta}
            <ArrowRight className="w-5 h-5" />
          </Link>

          {/* Already have account */}
          <p className="text-sm text-gray-500 mt-4">
            {t.auth.hasAccount}{' '}
            <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium">
              {t.auth.login}
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-600">
          {APP_NAME} &copy; {new Date().getFullYear()}
        </div>
      </motion.div>
    </div>
  );
}
