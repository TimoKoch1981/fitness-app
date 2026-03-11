# Konzept: Robuste KI-Aktionen — Analyse & Verbesserung

> **Ziel:** Die KI-Aktionspipeline (LLM → Aktion → Datenbank) ist aktuell unzuverlaessig.
> Der Buddy verspricht Aktionen ("Ich speichere den Plan jetzt!"), fuehrt sie aber haeufig
> nicht aus — oder fuehrt sie fehlerhaft aus. Dieses Dokument ist der Arbeitsauftrag fuer
> eine Experten-Analyse und die Entwicklung einer robusten Loesung.

---

## Aufgabenstellung

Analysiere das gesamte KI-Aktionssystem der FitBuddy-App mit dem Ziel, jede Aktion
(Trainingsplan erstellen, Mahlzeit loggen, Koerperdaten speichern, etc.) **zuverlaessig,
nachvollziehbar und fehlertolerant** zu machen.

### Konkretes Problem (Beispiel)
- User bittet den Buddy: "Erstelle mir einen 3-Tage Push/Pull/Legs Plan"
- Buddy antwortet mit einem vollstaendigen Plan und schreibt "Ich speichere diesen Plan jetzt fuer dich!"
- **Nichts passiert.** Der Plan wird nicht gespeichert, kein Fehler angezeigt.
- Das passiert regelmaessig, aber nicht immer — manchmal klappt es, manchmal nicht.

### Zielzustand
1. **100% Zuverlaessigkeit**: Wenn der Buddy sagt "Ich speichere", MUSS gespeichert werden
2. **Transparenz**: User sieht jederzeit, was passiert (Aktion erkannt → wird ausgefuehrt → Erfolg/Fehler)
3. **Fehlertoleranz**: Bei Fehlern klare Meldung + Retry-Option
4. **Nachvollziehbarkeit**: Jede Aktion wird geloggt, Fehler sind analysierbar

---

## Experten-Rollen

Fuehre die Analyse aus der Perspektive folgender Experten durch:

| Rolle | Fokus |
|-------|-------|
| **Data Scientist / NLP-Experte** | LLM-Output-Qualitaet, Prompt Engineering, ACTION-Block-Zuverlaessigkeit, Token-Budget-Optimierung, Structured Output vs. Free-Text |
| **KI-Agent-Architekt** | Agent-Routing, Skill-Injection, Context-Window-Management, Multi-Turn-Konsistenz, Action-Planung vs. -Ausfuehrung |
| **System-Architekt** | Pipeline-Design, Fehlerbehandlung, Transaktionssicherheit, Idempotenz, Event-Sourcing, Observability |
| **Frontend-UX-Experte** | Bestaetigung-Flow, Feedback-Anzeige, Lade-/Fehler-Zustaende, Undo/Redo, Vertrauensanzeige |
| **QA / Reliability Engineer** | Testbarkeit, Edge Cases, Monitoring, Alerting, Regressionstests |

---

## Analyse-Phasen

### Phase 1: Ist-Zustand kartieren

Kartiere die GESAMTE Pipeline Schritt fuer Schritt:

```
User-Nachricht
  → useBuddyChat Hook (Orchestrierung)
    → Agent Router (Keyword-Routing, Confidence-Score)
      → Spezialisierter Agent (System-Prompt + Skills + User-Context)
        → AI Provider (OpenAI/Ollama/Supabase Proxy, Streaming SSE)
          → LLM-Antwort (Freitext + ACTION-Bloecke)
            → Action Parser (Regex + JSON Repair + Zod-Validierung)
              → Auto-Execute (ALLE Aktionen sofort, OHNE Bestaetigung)
                → Action Executor (Mutations → Supabase DB)
                  → UI-Feedback (System-Nachricht: Erfolg oder Fehler)
```

**Fuer JEDEN Schritt analysieren:**
- Was kann schiefgehen? (Failure Modes)
- Wie wird der Fehler aktuell behandelt? (Error Handling)
- Was sieht der User bei einem Fehler? (User Experience)
- Wie koennte man den Fehler verhindern? (Prevention)
- Wie koennte man den Fehler erkennen? (Detection)
- Wie koennte man den Fehler beheben? (Recovery)

### Schluessel-Dateien fuer Phase 1

| Komponente | Pfad |
|-----------|------|
| Action-Typen | `src/lib/ai/actions/types.ts` |
| Zod-Schemas | `src/lib/ai/actions/schemas.ts` |
| Action-Parser | `src/lib/ai/actions/actionParser.ts` |
| Action-Executor | `src/features/buddy/hooks/useActionExecutor.ts` |
| Buddy-Chat-Hook | `src/features/buddy/hooks/useBuddyChat.ts` |
| BuddyPage | `src/pages/BuddyPage.tsx` |
| InlineBuddyChat | `src/shared/components/InlineBuddyChat.tsx` |
| ActionConfirmBanner (UNBENUTZT) | `src/features/buddy/components/ActionConfirmBanner.tsx` |
| Agent-Router | `src/lib/ai/agents/router.ts` |
| Base-Agent | `src/lib/ai/agents/baseAgent.ts` |
| Training-Agent | `src/lib/ai/agents/trainingAgent.ts` |
| Skills-Index | `src/lib/ai/skills/index.ts` |
| User-Skills | `src/lib/ai/skills/userSkills.ts` |
| OpenAI Provider | `src/lib/ai/openai.ts` |
| Supabase Proxy | `src/lib/ai/supabaseProxy.ts` |
| SSE-Parser | `src/lib/ai/sseParser.ts` |

---

### Phase 2: Bekannte Schwachstellen vertiefen

Basierend auf der Voranalyse gibt es diese bekannten Schwachstellen. Jede muss
mit Root-Cause-Analyse, Impact-Bewertung und Loesungsvorschlag bearbeitet werden.

#### S1: ACTION-Block wird vom LLM nicht generiert
**Symptom:** Buddy schreibt "Ich speichere den Plan", aber kein `ACTION:save_training_plan` Block im Output.
**Moegliche Ursachen:**
- Token-Limit erreicht bevor ACTION-Block geschrieben wird (max_tokens: 4096)
- LLM "vergisst" den ACTION-Block nach langem Konversationstext
- System-Prompt zu lang, verdraengt Instruktionen fuer ACTION-Bloecke
- Das Wort "speichere" im Freitext wird vom User als Versprechen gelesen, das LLM meint es aber beschreibend
**Analyse-Fragen:**
- Wie gross ist der System-Prompt des Training-Agents in Tokens? (mit allen Skills)
- Wie viel Token-Budget bleibt fuer den Output nach System-Prompt + Conversation-History?
- Gibt es Faelle, wo das LLM ACTION-Bloecke konsistent am Ende des Outputs platziert? Oder mittendrin?
- Koennte man das LLM anweisen, ACTION-Bloecke ZUERST zu generieren, dann den Erklaerungstext?

#### S2: ACTION-Block generiert, aber JSON abgeschnitten
**Symptom:** Parser findet den ACTION-Block, aber das JSON ist unvollstaendig.
**Moegliche Ursachen:**
- max_tokens erreicht mitten im JSON (besonders bei grossen Trainingsplaenen)
- SSE-Stream bricht ab (Netzwerkfehler, Timeout)
- JSON-Repair schlaegt fehl oder produziert valides aber inhaltlich falsches JSON
**Analyse-Fragen:**
- Wie gross ist ein typischer Trainingsplan-ACTION-Block in Tokens? (3-Tage PPL vs. 6-Tage)
- Reichen 4096 Output-Tokens fuer Plan + Erklaerungstext?
- Wie oft greift die JSON-Repair? (Logging hinzufuegen)
- Verliert JSON-Repair Uebungen am Ende? (z.B. Tag 3 hat weniger Uebungen als geplant)

#### S3: ACTION-Block generiert + JSON valid, aber Executor schlaegt fehl
**Symptom:** Parser extrahiert die Aktion, Executor wirft aber einen Fehler.
**Moegliche Ursachen:**
- Session abgelaufen (JWT expired) — Retry existiert, aber reicht es?
- Supabase RLS blockiert den Insert (user_id stimmt nicht)
- Validierungsfehler im Zod-Schema (z.B. fehlender Pflichtfeld)
- Netzwerkfehler zur Supabase-Instanz
**Analyse-Fragen:**
- Gibt es Logging im Executor, das zeigt ob er ueberhaupt aufgerufen wird?
- Werden Fehler an den User zurueckgemeldet oder nur in console.error?
- Was passiert wenn der Executor fuer `save_training_plan` fehlschlaegt — wird der User informiert?

#### S4: Executor erfolgreich, aber falsches Ergebnis
**Symptom:** Plan wird gespeichert, aber mit falschen Daten (fehlende Uebungen, falscher Split).
**Moegliche Ursachen:**
- LLM halluziniert Uebungsnamen die nicht im Katalog existieren
- JSON-Repair hat Daten abgeschnitten
- LLM hat beim "Editieren" Teile des Plans vergessen (kein Patch, nur Full Replace)
**Analyse-Fragen:**
- Validiert der Executor exercise_id gegen den Katalog?
- Gibt es eine Vorschau bevor gespeichert wird?
- Koennte man "Plan-Diff" anzeigen (was aendert sich gegenueber vorher)?

#### S5: Auto-Execute ohne Bestaetigung
**Symptom:** JEDE Aktion wird sofort ausgefuehrt, auch wenn das LLM halluziniert.
**Ist-Zustand:** `ActionConfirmBanner` Komponente existiert, ist aber NICHT eingebunden.
**Analyse-Fragen:**
- Soll es eine Bestaetigungsstufe geben? Fuer welche Aktionen?
- Wie wuerde ein Bestaetigungs-Flow aussehen der nicht nervt?
- Koennte man "low-risk" (Produktsuche) vs. "high-risk" (Plan ueberschreiben) unterscheiden?

#### S6: Konversationshistorie zu kurz
**Ist-Zustand:** Nur die letzten 8 Nachrichten werden an das LLM gesendet.
**Problem:** Bei mehrstufigen Plan-Bearbeitungen geht Kontext verloren.
**Analyse-Fragen:**
- 8 Nachrichten — reicht das fuer typische Workflows?
- Koennte man statt "letzte N" ein Token-Budget verwenden?
- Koennte man einen "Plan-Editing-Modus" haben, der den aktiven Plan immer im Kontext haelt?

#### S7: Kein Feedback-Loop bei fehlendem ACTION-Block
**Ist-Zustand:** Wenn das LLM keinen ACTION-Block generiert, merkt es niemand.
**Analyse-Fragen:**
- Koennte man nach jeder LLM-Antwort pruefen: "Hat der Buddy eine Aktion versprochen?"
- Koennte man Fallback-Heuristiken erweitern? (4 existieren bereits fuer search_product, log_body, etc.)
- Koennte man einen zweiten LLM-Call machen: "Du hast gesagt du speicherst — hier ist das JSON"?

---

### Phase 3: Loesungsarchitektur entwerfen

Basierend auf den Ergebnissen von Phase 1+2, entwerfe eine robuste Architektur:

#### 3.1 Structured Output
- Kann man `response_format: { type: "json_schema" }` nutzen? (OpenAI Structured Outputs)
- Oder: Zwei-Phasen-Ansatz — erst Freitext streamen, dann separater Call fuer die Aktion?
- Oder: Function Calling / Tool Use statt freiem ACTION-Block-Format?

#### 3.2 Bestaetigungsflow
- Welche Aktionen brauchen Bestaetigung? (Training-Plan = Ja, Produktsuche = Nein)
- UI-Design: Vorschau-Card mit "Speichern" / "Abbrechen" Buttons
- Wie integriert man das in den Chat-Flow ohne den UX-Flow zu brechen?

#### 3.3 Fehlerbehandlung
- Retry-Strategie (exponential backoff?)
- Fehler-Anzeige im Chat (nicht nur console.error)
- "Plan konnte nicht gespeichert werden — erneut versuchen?" Button

#### 3.4 Observability
- Logging: Jeder Pipeline-Schritt loggt Erfolg/Misserfolg
- Metriken: Wie oft werden ACTIONs generiert vs. erfolgreich ausgefuehrt?
- Debug-Modus: Action-Pipeline-Details im Chat anzeigbar (fuer Entwickler)

#### 3.5 Token-Budget-Optimierung
- System-Prompt-Groesse messen und budgetieren
- Output-Token-Budget fuer ACTION-Bloecke reservieren
- Trainingsplaene kompakter serialisieren (weniger JSON-Overhead)

#### 3.6 Plan-spezifische Verbesserungen
- `modify_training_plan` Action (Patch statt Full Replace)?
- Plan-Vorschau vor dem Speichern
- Exercise-ID-Validierung gegen Katalog
- Intelligentes Tage-Management bei days_per_week-Aenderung

---

### Phase 4: Implementierungsplan

Erstelle einen priorisierten Implementierungsplan:

| Prio | Aenderung | Aufwand | Impact |
|------|-----------|---------|--------|
| P0 | ... | ... | ... |
| P1 | ... | ... | ... |
| P2 | ... | ... | ... |

**Kriterien fuer Priorisierung:**
- P0: Behebt das Kernproblem (Aktionen werden nicht ausgefuehrt)
- P1: Verbessert Zuverlaessigkeit signifikant
- P2: Nice-to-have, langfristige Verbesserung

---

### Phase 5: Verifikation

Definiere Testszenarien die beweisen, dass die Loesung funktioniert:

| # | Testfall | Erwartung |
|---|---------|-----------|
| T1 | "Erstelle 3-Tage PPL Plan" | Plan wird erstellt, 3 Tage, PPL Split, Uebungen vorhanden |
| T2 | "Aendere meinen Plan auf 4 Tage" | Plan wird modifiziert, 4 Tage, bestehende Uebungen bleiben |
| T3 | "Logge 500g Haehnchenbrust" | Mahlzeit wird geloggt mit korrekten Makros |
| T4 | Token-Limit-Test: 6-Tage-Plan mit 8 Uebungen pro Tag | Plan vollstaendig gespeichert, keine abgeschnittenen Tage |
| T5 | Netzwerkfehler waehrend Speichern | Fehlermeldung + Retry-Button |
| T6 | Session abgelaufen waehrend Speichern | Auto-Retry mit frischer Session |

---

## Abgrenzung

**IN Scope:**
- Gesamte Pipeline: LLM-Prompt → Response → Parsing → Execution → Feedback
- Alle 14 Action-Types
- Training-Agent als Hauptfokus (groesste Probleme)
- Token-Budget-Optimierung
- Fehlerbehandlung und Feedback

**OUT of Scope:**
- Neuer AI-Provider oder Modellwechsel
- Neue Features (nur bestehende Features robuster machen)
- Aenderungen an der Supabase-DB-Struktur (ausser wenn zwingend noetig)

---

## Ergebnisformat

Am Ende der Analyse soll ein konkreter, implementierbarer Plan stehen:

1. **Root-Cause-Bericht**: Warum scheitern Aktionen? (mit Daten/Logs)
2. **Architektur-Vorschlag**: Wie soll die Pipeline kuenftig aussehen?
3. **Implementierungsplan**: Reihenfolge der Aenderungen, geschaetzte Aufwaende
4. **Dateien-Liste**: Welche Dateien werden geaendert, was aendert sich?
5. **Testplan**: Wie verifizieren wir, dass es funktioniert?
