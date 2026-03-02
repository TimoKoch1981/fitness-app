# FitBuddy — Übergabedatei für 03.03.2026

## Stand: 02.03.2026, 23:xx Uhr, v12.39

---

## Was wurde heute gemacht?

### 1. Deep-Test auf Production (fudda.de)
- **55 Tests durchgeführt, 55 bestanden (100% der getesteten Features)**
- Ernährung: 5 Mahlzeiten (3× KI-Schätzung, 2× manuell)
- Training: 1 Trainingsplan + 3 Workouts + Live-Workout-Tracker-Test
- Medizin: 3 Substanzen (TRT + Kreatin + Omega-3) + Schlaf + Symptome
- Buddy-Chat: Ernährungsberatung mit Tages-Analyse
- Cockpit: Dashboard, Wasser-Tracker, Wochen-Chart
- Profil: Einstellungen, Buddy-Kommunikation

### 2. Bug-Fixes (v12.39)
- Power+ Mode: React Anti-Pattern (DOM→State) gefixt
- Chart Y-Achse: width 50, margin 0 für volle Sichtbarkeit
- Energie-Warnung: Kontextabhängiger Titel
- **docker-compose.prod.yml**: AUTOCONFIRM `"true"` → `"false"` (Commit ef4f7ef)

### 3. Dokumentation
- `docs/20260302_deep_test_ergebnisse.md` — Vollständiges Testprotokoll
- `docs/20260302_experten_konzept.md` — 3-Experten Produktverbesserung
- `docs/FORTSCHRITT.md` — v12.39 Entry
- `docs/TODO.md` — Aktualisiert
- `MEMORY.md` — SSH-Key Info, v12.39 Status

---

## Was ist OFFEN / KRITISCH?

### 🔴 P0: Email-Verifizierung (BLOCKER für neue Nutzer!)

**Problem:** Bestätigungsmails kommen nicht an.

**Root Cause:** DNS-Records auf fudda.de Root-Domain:
- SPF TXT Record **FEHLT** auf `fudda.de` (existiert nur auf `send.fudda.de`)
- DKIM CNAME Records **FEHLEN** (`resend1._domainkey.fudda.de` etc.)
- MX Record **FEHLT** auf `fudda.de`
- GoTrue sendet als `noreply@fudda.de` → SPF-Check schlägt fehl → strenge Server (z.B. rwth-aachen.de) lehnen ab

**Fix-Schritte (auf Hetzner DNS Console):**
1. **SPF TXT Record** auf `fudda.de`:
   ```
   v=spf1 include:amazonses.com ~all
   ```
2. **DKIM CNAME Records** (3 Stück von Resend Dashboard kopieren):
   ```
   resend1._domainkey.fudda.de → CNAME → resend1.domainkey.xxx.amazonses.com
   resend2._domainkey.fudda.de → CNAME → resend2.domainkey.xxx.amazonses.com
   resend3._domainkey.fudda.de → CNAME → resend3.domainkey.xxx.amazonses.com
   ```
3. **MX Record** auf `fudda.de`:
   ```
   fudda.de MX 10 feedback-smtp.eu-west-1.amazonses.com
   ```
4. Optional: **DMARC TXT Record**:
   ```
   _dmarc.fudda.de TXT "v=DMARC1; p=none; rua=mailto:dmarc@fudda.de"
   ```

**Verifizierung nach Fix:**
```bash
# Von beliebigem Linux/Mac:
dig TXT fudda.de        # Muss SPF zeigen
dig CNAME resend1._domainkey.fudda.de  # Muss DKIM zeigen
dig MX fudda.de          # Muss MX zeigen
```
Dann neuen Account auf fudda.de registrieren und prüfen ob Email ankommt.

### 🟡 P1: Monitoring & Backups fehlen
- Kein Error-Tracking (Sentry empfohlen)
- Kein automatisches DB-Backup (pg_dump CronJob)
- Kein Health-Check Endpoint
- **Empfehlung:** Vor Beta-Launch einrichten

### 🟡 P1: CI/CD fehlt
- Aktuell: Manuelles `npm run build` + `scp` Deploy
- **Empfehlung:** GitHub Actions → Auto-Build → Auto-Deploy

---

## Server-Zugang

| Was | Wert |
|-----|------|
| SSH | `ssh root@46.225.228.12` |
| Key | `C:/Users/server2/Documents/fk_hetzner_key` (nur User server2) |
| Auth | NUR Key-Based (Passwort deaktiviert) |
| Docker | `/opt/fitbuddy/` (docker-compose.yml + .env) |
| Frontend | `/opt/fitbuddy/frontend/` |
| Domain | fudda.de |
| DNS | Hetzner DNS (Zone 919094) |
| Resend | Domain ID 395dd33d (eu-west-1) |

---

## Git-Status

| Branch | Commits | Letzter Commit |
|--------|---------|----------------|
| develop | 100+ | v12.39 (3 Bug-Fixes + AUTOCONFIRM) |
| main | — | Nicht genutzt |

**Letzter Push:** 02.03.2026 auf develop

---

## Docker-Container (11 Stück)
```
fitbuddy-db-1        PostgreSQL
fitbuddy-auth-1      GoTrue (Auth)
fitbuddy-rest-1      PostgREST (API)
fitbuddy-kong-1      Kong (Gateway)
fitbuddy-studio-1    Supabase Studio
fitbuddy-storage-1   Storage
fitbuddy-meta-1      Metadata
fitbuddy-realtime-1  Realtime
fitbuddy-functions-1 Edge Functions (ai-proxy)
fitbuddy-analytics-1 Logflare
fitbuddy-caddy-1     Caddy (Reverse Proxy + SSL)
```

**ACHTUNG:** Container-Restart kann Settings zurücksetzen! Nach jedem Restart:
```bash
grep AUTOCONFIRM /opt/fitbuddy/docker-compose.yml  # Muss "false" sein
docker logs fitbuddy-auth-1 --tail 5               # "GoTrue API started" prüfen
```

---

## Nächste Schritte (Empfohlen)

1. **🔴 SOFORT:** DNS SPF/DKIM Records auf fudda.de Root-Domain hinzufügen
2. **🟡 Diese Woche:** Sentry Error-Tracking + pg_dump Backup CronJob
3. **🟡 Diese Woche:** CI/CD Pipeline (GitHub Actions)
4. **🟢 Nächste Woche:** Barcode-Scanner MVP (Open Food Facts API)
5. **🟢 Nächste Woche:** Beta-Launch vorbereiten (Landing Page, Invite-System)

---

## Dateien in diesem Übergabe-Paket
| Datei | Inhalt |
|-------|--------|
| `docs/20260302_deep_test_ergebnisse.md` | Vollständiges Testprotokoll (55 Tests) |
| `docs/20260302_experten_konzept.md` | 3-Experten Konzept (Fitness, Marketing, Architektur) |
| `docs/20260302_uebergabe.md` | Diese Übergabedatei |

---

*Erstellt am 02.03.2026 von Claude Code (Deep-Test Session)*
