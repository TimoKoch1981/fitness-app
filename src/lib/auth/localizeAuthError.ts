/**
 * localizeAuthError — Map GoTrue / Supabase error messages to friendly,
 * localized, **account-enumeration-resistant** strings.
 *
 * GoTrue returns errors in English. Some of those errors reveal whether an
 * email is registered (e.g. "User already registered"). For the public-
 * facing forms (Register, Login, Forgot) we re-map those to neutral
 * messages so an attacker can't enumerate registered users by reading
 * the error text.
 *
 * Used by:
 *   - ForgotPasswordPage   (v14.22)
 *   - LoginPage            (v14.25)
 *   - RegisterPage         (v14.25)
 *
 * Reference: OWASP ASVS V2.2.1, V2.5.7.
 */

export interface LocalizedAuthError {
  message: string;
  /** Optional cooldown to enforce in the UI (seconds). */
  cooldownSec?: number;
  /**
   * Indicates the raw error was rewritten for enumeration safety. The form
   * may want to show a *success-like* UX instead of a red error banner.
   */
  isEnumerationGuard?: boolean;
}

export function localizeAuthError(raw: string, language: string): LocalizedAuthError {
  const isDE = language === 'de';

  // ── Rate-Limit mit Sekunden ───────────────────────────────────────────
  const rateLimitMatch = raw.match(/after\s+(\d+)\s+seconds?/i);
  if (rateLimitMatch) {
    const sec = parseInt(rateLimitMatch[1], 10);
    return {
      message: isDE
        ? `Aus Sicherheitsgruenden kannst du erst in ${sec} Sekunden neu versuchen.`
        : `For security reasons, please try again in ${sec} seconds.`,
      cooldownSec: sec,
    };
  }

  if (/rate\s*limit|too\s*many/i.test(raw)) {
    return {
      message: isDE
        ? 'Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut.'
        : 'Too many requests. Please wait a moment and try again.',
      cooldownSec: 60,
    };
  }

  // ── Invalid login credentials (Login) ─────────────────────────────────
  // GoTrue gibt das gleiche bei "falsches Passwort" und "User existiert nicht"
  // zurueck — gut so, wir leiten weiter:
  if (/invalid\s*login\s*credentials/i.test(raw)) {
    return {
      message: isDE
        ? 'E-Mail oder Passwort stimmt nicht.'
        : 'Email or password is incorrect.',
    };
  }

  // ── Email not confirmed (Login) ───────────────────────────────────────
  if (/email\s*not\s*confirmed/i.test(raw)) {
    return {
      message: isDE
        ? 'Bitte bestaetige zuerst deine E-Mail-Adresse.'
        : 'Please confirm your email address first.',
    };
  }

  // ── User already registered (Register) — ENUMERATION GUARD ────────────
  // Statt zu verraten dass die Email schon vergeben ist, geben wir dieselbe
  // Erfolgs-aehnliche Antwort wie bei einer neuen Adresse. Der echte Nutzer
  // bekommt zusaetzlich eine Mail mit Login-Hinweis (separat eingerichtet
  // in GoTrue's smtp_template, sobald noetig).
  if (/user\s*already\s*registered|already\s*been\s*registered/i.test(raw)) {
    return {
      message: isDE
        ? 'Falls diese E-Mail neu ist, hast du eine Bestaetigungs-Mail erhalten. Andernfalls melde dich einfach an.'
        : 'If this email is new, you have received a confirmation email. Otherwise, just sign in.',
      isEnumerationGuard: true,
    };
  }

  // ── User not found (Reset/Recovery) — ENUMERATION GUARD ───────────────
  if (/user\s*not\s*found|not\s*registered/i.test(raw)) {
    return {
      message: isDE
        ? 'Falls diese E-Mail registriert ist, haben wir einen Link gesendet.'
        : 'If this email is registered, we have sent a link.',
      isEnumerationGuard: true,
    };
  }

  // ── Invalid email format ──────────────────────────────────────────────
  if (/invalid.*email|email.*invalid/i.test(raw)) {
    return {
      message: isDE
        ? 'Ungueltige E-Mail-Adresse.'
        : 'Invalid email address.',
    };
  }

  // ── Password too short / weak ─────────────────────────────────────────
  if (/password.*too\s*short|password.*weak/i.test(raw)) {
    return {
      message: isDE
        ? 'Passwort zu schwach. Bitte mindestens 8 Zeichen verwenden.'
        : 'Password too weak. Please use at least 8 characters.',
    };
  }

  // ── Fallback: raw message ────────────────────────────────────────────
  return { message: raw };
}
