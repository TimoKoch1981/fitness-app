# PH4 — Email-Compliance (DSGVO/CAN-SPAM/RFC 8058)

**Datum:** 2026-05-16
**Status:** Implementiert. Wartet auf Resend-Webhook-Konfiguration im Dashboard.

## Was wurde gebaut

| Komponente | Datei | Zweck |
|---|---|---|
| Migration | `supabase/migrations/20260516000005_email_compliance.sql` | Tabellen `email_logs` + `email_suppressions` + 3 RPCs |
| Edge Function | `supabase/functions/resend-webhook/index.ts` | Empfaengt Bounce-/Complaint-Webhooks von Resend, schreibt Suppression |
| Edge Function | `supabase/functions/send-welcome-email/index.ts` (Update) | Suppression-Check + email_logs insert + Unsubscribe-Link/Header |
| Edge Function | `supabase/functions/email-unsubscribe/index.ts` | Token-validierter Unsubscribe-Endpoint (GET HTML + POST One-Click) |

## Architektur

```
Mail ausgehend:
  send-welcome-email
    -> is_email_suppressed(recipient)? ja -> log status=suppressed, kein send, 200 skipped
    -> Resend POST mit List-Unsubscribe-Header
    -> email_logs insert (status=sent, resend_message_id)

Webhook eingehend:
  Resend POST -> resend-webhook
    -> Svix-Signatur validieren (HMAC-SHA256 ueber svix-id.svix-timestamp.body)
    -> log_email_event(message_id, status, raw_event) -> email_logs.status update
    -> bei bounced(hard)/complained: add_email_suppression(email, reason)

Unsubscribe:
  User klickt Link in Mail -> /functions/v1/email-unsubscribe?email=...&token=...
    -> token = base64url(hmac_sha256(secret, lower(email)))
    -> validieren -> add_email_suppression(email, 'manual_unsubscribe')
    -> HTML "Du bist abgemeldet"
  Gmail/Yahoo One-Click POST -> selbe URL -> JSON {ok:true}
```

## DSGVO/Compliance-Pflicht abgedeckt

| Anforderung | Wo umgesetzt |
|---|---|
| DSGVO Art. 21 — Widerspruchsrecht | email-unsubscribe Endpoint + Footer-Link in jeder Mail |
| DSGVO Art. 30 — Verarbeitungsverzeichnis | email_logs Audit-Trail |
| CAN-SPAM §5 — Unsubscribe-Link Pflicht | Footer-Link in welcome-email |
| RFC 8058 — One-Click-Unsubscribe (Gmail/Yahoo Pflicht 2024+) | `List-Unsubscribe` + `List-Unsubscribe-Post` Headers in Resend-Call |
| Bounce-Handling (Sender-Reputation) | resend-webhook -> suppressions -> send-welcome-email blockt |
| Complaint-Handling (Spam-Markierungen) | resend-webhook -> suppressions sofort |
| Beweissicherung bei Abuse-Komplaints | email_logs.raw_event jsonb persists webhook-payload |

## ⚠️ USER-ACTION nach Deploy

### 1. Resend-Webhook konfigurieren

1. Resend-Dashboard: https://resend.com/webhooks
2. **Add Endpoint:** `https://fudda.de/functions/v1/resend-webhook`
3. **Events abonnieren:**
   - `email.bounced` (PFLICHT)
   - `email.complained` (PFLICHT)
   - `email.delivered` (optional, fuer Audit)
   - `email.opened` (optional, fuer Analytics)
   - `email.clicked` (optional, fuer Analytics)
4. **Webhook-Secret kopieren** (`whsec_xxx`)
5. In `/opt/fitbuddy/.env` auf dem Server eintragen:
   ```
   RESEND_WEBHOOK_SECRET=whsec_xxx
   ```

### 2. EMAIL_UNSUBSCRIBE_SECRET generieren

Eigenes geheimes Secret fuer Token-HMAC. Sollte NICHT identisch mit RESEND_WEBHOOK_SECRET sein.

```bash
# Generieren (z.B.)
openssl rand -base64 32
```

In `/opt/fitbuddy/.env`:
```
EMAIL_UNSUBSCRIBE_SECRET=<base64-string>
```

**WICHTIG:** Wenn das Secret rotiert wird, sind ALLE alten Unsubscribe-Links in bereits versendeten Mails ungueltig. Plane mit User-Communication wenn Rotation noetig.

### 3. Service-Container neustarten

```bash
cd /opt/fitbuddy
docker compose down functions
docker compose up -d functions
```

oder den Function-Container individuell.

### 4. Resend-Webhook testen

Im Resend-Dashboard "Send Test Event" -> Status sollte 200 sein, im Container-Log:

```
[resend-webhook] email.bounced msg_xxx user@example.com
[resend-webhook] Suppressed: user@example.com hard_bounce
```

## Smoke-Test (manuell nach Deploy)

```bash
# 1. Suppression-Check vorher
psql -c "SELECT * FROM email_suppressions WHERE email='test@example.com';"
# leer

# 2. Bounce-Event simulieren — Webhook anrufen mit gueltiger Signatur ist
#    nur ueber Resend-Dashboard "Send Test" sauber moeglich (Svix-Sig haengt am Body).
#    Alternativ: Manuell als Service-Role via RPC:
psql -c "SELECT add_email_suppression('test@example.com', 'hard_bounce', 'manual test');"

# 3. Pruefen
psql -c "SELECT * FROM email_suppressions WHERE email='test@example.com';"
# 1 Eintrag

# 4. send-welcome fuer test@example.com triggern und beobachten dass Status=skipped ist
#    (im Frontend: User loescht profile.welcome_email_sent_at, dann erneut login)

# 5. Cleanup
psql -c "DELETE FROM email_suppressions WHERE email='test@example.com';"
```

## Negative-Tests

| Szenario | Erwartung |
|---|---|
| Webhook ohne Signatur | 401 "Invalid signature" |
| Webhook mit altem timestamp (> 5min) | 401 "Invalid signature" |
| Webhook mit veraendertem body (tampered) | 401 "Invalid signature" |
| Unsubscribe-Link ohne token | 400 HTML_ERROR |
| Unsubscribe-Link mit falschem token | 403 HTML_ERROR |
| Unsubscribe-Link 2x klicken | 1x 200 success, 2x 200 success (idempotent ON CONFLICT) |
| send-welcome fuer suppressed user | 200 {skipped:true, reason:'suppression'} |

## Offen / Stretch fuer Folge-Sprints

- [ ] **Reset-Password-Mail** ebenfalls auf suppressions checken (aktuell GoTrue-built-in, nicht durch unsere Functions)
- [ ] **Admin-UI** `AdminEmailSuppressionsPage.tsx` — manuelle Suppression-Verwaltung, Re-Subscribe (z.B. Customer-Support call)
- [ ] **Resend-Bouncetypen erweitern:** `soft_bounce_repeat` nach 3 wiederholten Soft-Bounces in 30 Tagen (aktuell nur hard-bounce)
- [ ] **Marketing-Mails** (falls je gebaut): separater Opt-In + eigenes List-Unsubscribe-Token-Schema
- [ ] **Notifications.send_push** (Phase 8.2+): bei Cloud-Push Subscribe-Status pruefen analog

## Restore-Plan

Falls die PH4-Migration Probleme macht:

```sql
DROP FUNCTION IF EXISTS log_email_event(text, text, jsonb);
DROP FUNCTION IF EXISTS add_email_suppression(text, text, text);
DROP FUNCTION IF EXISTS is_email_suppressed(text);
DROP TABLE IF EXISTS email_suppressions;
DROP TABLE IF EXISTS email_logs;
```

Edge Functions `resend-webhook` + `email-unsubscribe` aus `/opt/fitbuddy/volumes/functions/` loeschen.

`send-welcome-email` auf alte Version vor 2026-05-16 zurueckrollen (git revert dieser Migration-Commit).
