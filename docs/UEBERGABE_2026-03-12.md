# Übergabedokument — 2026-03-12 (v12.76)

> **Session-Zusammenfassung:** Granulare Plan-Bearbeitung + Trainingsplan-UI Feinschliff

---

## 1. Was wurde gemacht?

### Feature A: Granulare Plan-Bearbeitung (Kern-Feature)

**Problem:** Der Buddy erstellte bei JEDER Plan-Änderung (Tag hinzufügen, Übung tauschen, Tag löschen) einen komplett neuen Trainingsplan via `save_training_plan`. Das führte zu:
- Verlust von Kalibrierung (Gewichte, RIR-Feedback)
- Verlust von Review-Konfiguration (ai_supervised, review_config)
- Verlust der Plan-Historie (ID ändert sich)
- Schlechte UX (Nutzer sieht "Trainingsplan speichern?" statt "Übung ändern?")

**Lösung:** 3 neue granulare Action-Types, die den aktiven Plan in-place modifizieren:

| Action-Type | Trigger (Beispiele) | Was passiert |
|---|---|---|
| `add_training_day` | "Füge einen Ganzkörpertag hinzu", "5. Tag" | Neuer Tag wird zum Plan hinzugefügt |
| `modify_training_day` | "Ersetze Bankdrücken durch Schrägbank", "Füge Face Pulls hinzu" | Übungen eines Tags werden aktualisiert |
| `remove_training_day` | "Lösche Tag 4", "Brauche den Schultertag nicht" | Tag wird aus dem Plan entfernt |

### Feature B: Trainingsplan-UI Feinschliff (aus Plan-Datei)

1. **BuddyQuickAccess Chips bereinigt:** "Plan anpassen" + "Plan bewerten" Chips entfernt (redundant mit Buttons im aufgeklappten Plan). Stattdessen "Trainingstipp" Chip hinzugefügt.
2. **Trainingstage einzeln löschbar:** Mülleimer-Icon neben Stift-Icon auf jeder DayCard. Bestätigungs-Dialog mit Übungszähler.

---

## 2. Geänderte Dateien (12)

### Action-System (8 Dateien — Feature A)

| Datei | Änderungen | Zeilen |
|---|---|---|
| `src/lib/ai/actions/types.ts` | 3 ActionTypes + Display-Info im Confirmation-Banner | +21 |
| `src/lib/ai/actions/schemas.ts` | 3 Zod-Schemas + `toNum`/`toStr` Type-Coercion Helper | +44 |
| `src/features/workouts/hooks/useTrainingPlans.ts` | 3 Mutation-Hooks + `useDeleteTrainingPlanDay` | +248 |
| `src/features/buddy/hooks/useActionExecutor.ts` | 3 Executor-Cases + Import der neuen Hooks | +41 |
| `src/lib/ai/agents/trainingAgent.ts` | "GRANULAR BEARBEITEN" Prompt-Sektion (DE+EN) | +154/-52 |
| `src/shared/components/InlineBuddyChatContext.tsx` | Interceptor-Signatur `(actionType, actionData)` | +10 |
| `src/shared/components/InlineBuddyChat.tsx` | `PLAN_ACTIONS` Array + Multi-Type Interception | +11 |
| `src/features/workouts/context/PlanWizardContext.tsx` | 3 Buddy-Handler + Switch-Interceptor | +55 |

### UI-Feinschliff (4 Dateien — Feature B)

| Datei | Änderungen |
|---|---|
| `src/features/buddy/hooks/usePageBuddySuggestions.ts` | `plan_edit`+`plan_evaluate` Chips entfernt, "Trainingstipp" hinzugefügt |
| `src/features/workouts/components/DayCard.tsx` | `onDelete` Prop + Trash2-Icon |
| `src/features/workouts/components/TrainingPlanList.tsx` | Delete-Day State + Handler + Bestätigungs-Dialog |
| `src/features/workouts/components/WorkoutsTabContent.tsx` | `plan_edit`/`plan_evaluate` Handler entfernt |

---

## 3. Architektur-Entscheidungen

### Action-Flow (pro granularer Action)
```
LLM-Response (ACTION_REQUEST Block)
  → InlineBuddyChat.tsx (parseActions)
    → PLAN_ACTIONS Check
      → IF Wizard aktiv: wizardActionInterceptor(actionType, actionData)
        → PlanWizardContext: switch(actionType) → addDay/modifyDay/removeDay
      → ELSE: useActionExecutor.executeAction()
        → Hook (z.B. useModifyTrainingPlanDay)
          → Supabase: find active plan → find day → update/insert/delete
```

### Type-Coercion (schemas.ts)
LLMs senden häufig inkonsistente Typen:
- `sets: "3"` statt `sets: 3` → `z.preprocess(toNum, z.number())`
- `reps: 10` statt `reps: "10"` → `z.preprocess(toStr, z.string())`

### Auto-Detect aktiver Plan
Die Hooks brauchen KEIN `plan_id` vom LLM — sie finden automatisch den aktiven Plan des Users via `is_active = true`. Das reduziert LLM-Fehler erheblich.

---

## 4. Bugfixes während Entwicklung

| Bug | Ursache | Fix |
|---|---|---|
| Zod-Validierungsfehler bei modify_training_day | LLM sendet `reps` als Number | `z.preprocess(toStr, ...)` Coercion |
| Wizard fängt nur save_training_plan ab | Alter Interceptor prüft nur einen Type | `PLAN_ACTIONS` Array + Switch-Handler |
| Doppelte `setWizardActionInterceptor` Deklaration | Node.js-Script hat alte Zeile nicht entfernt | Erste Deklaration entfernt |
| InlineBuddyChatContext Typ-Mismatch | State/Callback noch alte `(actionData)` Signatur | Synchronisiert auf `(actionType, actionData)` |

---

## 5. Verifikation

- [x] **TypeScript:** 0 Fehler (`npx tsc --noEmit`)
- [x] **Build:** Vite Production Build erfolgreich (111 PWA Precache Entries)
- [x] **Build-Check:** `fudda.de` in Assets, kein `127.0.0.1:54321`
- [x] **Deployed:** fudda.de (alte Assets gelöscht, neue via SCP)
- [x] **Live-Test:** Tag hinzufügen OK, Tag bearbeiten OK
- [x] **Git:** Commit `368b6a6` auf develop, gepusht
- [x] **Doku:** FORTSCHRITT.md, TODO.md, DEPENDENCIES.md, MEMORY.md aktualisiert

---

## 6. Bekannte Einschränkungen

1. **LLM-Abhängigkeit:** Die granularen Actions funktionieren nur, wenn der LLM die richtigen Action-Types auswählt. Die Prompt-Instruktionen sind ausführlich (Trigger-Wörter, Workflows, Beispiele), aber LLMs können trotzdem manchmal `save_training_plan` statt `modify_training_day` wählen.

2. **Kein Undo:** Wenn der Buddy via `remove_training_day` einen Tag löscht (außerhalb des Wizards), gibt es kein Undo. Der Tag ist direkt in der DB gelöscht.

3. **Day-Numbering:** `modify_training_day` und `remove_training_day` identifizieren Tage über `day_number`. Wenn der LLM die falsche Nummer sendet, wird der falsche Tag geändert.

---

## 7. Nächste Schritte

Die Plan-Datei `magical-fluttering-treehouse.md` ist jetzt **vollständig abgearbeitet**:
- [x] Änderung 1: BuddyQuickAccess-Chips bereinigen
- [x] Änderung 2: Trainingstag löschen

**Offene Themen für zukünftige Sessions:**
- LLM-Optimierung Phase 2+ (siehe `docs/KONZEPT_LLM_OPTIMIERUNG.md`)
- Voice Agent Implementierung (siehe `docs/KONZEPT_VOICE_AGENT.md`)
- Cloud-Push Notifications (Firebase/WhatsApp/Telegram)

---

*Erstellt: 2026-03-12 | Version: v12.76 | Commit: 368b6a6*
