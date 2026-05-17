# Regression-Fix-Sprint: Workout-Flow (2026-05-17)

**Status:** Bereit zum Start. Self-contained Prompt — ein frischer Claude-Code-Agent
kann diese Datei lesen und direkt loslegen, ohne Vorwissen aus vorherigen Sessions.

**Anweisung an den Agent:** Lies dieses Dokument vollstaendig, dann arbeite die
Portionen A-G sequenziell ab. Jede Portion ist commit-baer und kann zwischen Sessions
unterbrochen werden. Frage Timo NICHT um Erlaubnis fuer dokumentierte Schritte,
sondern arbeite autonom innerhalb der Portion. Frage NUR, wenn ein Schritt vom
Plan abweicht oder eine echte User-Aktion noetig ist (Login, manuelle Verifikation
am Telefon).

---

## 0. Kontext: Was ist passiert?

Am 2026-05-16 wurden 5 Sprint-Tranchen deployed (PH4 Email-Compliance, PH5
Admin-Impersonation, PH6/9/11 Phase 4 Reste, UX-Polish Tranche 1+2). Vorherige
Tranchen seit v14.27: Look-&-Feel-Migration (Stufen 0-4 Studio+Power-Console
Theme), Telemetrie-Sprint (v14.29, ~70 Mutations gewrapt), Auth-Audit (v14.22-26).

Am 2026-05-17 hat Timo mit zwei Test-Usern den Workout-Flow durchgespielt und
**4 P0-Regressionen** gefunden, die vorher funktioniert haben. Siehe Bug-Liste
unten. Diese sind in `docs/TODO.md` als B22-B25 eingetragen.

**Methodischer Hintergrund:** Die voherige Verifikation lief mit
`tsc --noEmit + vite build + npm test (4758 gruen) + curl -s -o /dev/null -w "HTTPS %{http_code}" https://fudda.de/...`.
Das ist **NICHT ausreichend** fuer User-Flow-Regression. HTTP 200 sagt nur
"Caddy liefert irgendwas", nicht "der Workout-Flow funktioniert". Login-required
Routen konnten ohne Test-Credentials nicht durchklickt werden, und das wurde
nicht klar genug als Verifikations-Luecke kommuniziert.

**Lehre fuer diesen Sprint:** Jede Fix-Portion muss MIT user-flow-Verifikation
enden — entweder via Playwright/E2E (bevorzugt), oder via expliziter
Bitte-an-Timo-Smoke-Test mit konkreter Aktionsliste.

---

## 1. Verifizierte Bugs (aus Timos Test 2026-05-17, Original-Wortlaut)

> 1. Bei mehrtaegigen Trainings gibt es immer nur fuer den ersten Tag den
>    Start Button, die anderen kann man nicht starten
> 2. In den Trainings werden keine gewichte angezeigt, bzw. man kann sie auch
>    nicht eingeben oder aendern und in den Voreinstellung scheint er sich
>    auch nicht jeweils de letzten Gewichte der Uebungen zu merken
> 3. Video funktionieren entweder nicht oder der Videobutton wird gar nicht
>    erst mehr angezeigt
> 4. das Farbschema im Traningsmodus (Blaue Schrift auf schwarzen Grund ist
>    schwer lesbar

**Aufgeschluesselt:**

- **B22 — Multi-Day-Start-Button:** Nur Tag 1 startbar. Tag 2..n haben keinen
  klickbaren Start-Knopf. Erwartung: jeder Plan-Tag muss einzeln startbar sein.
- **B23a — Gewicht-Anzeige fehlt:** In aktiver Workout-Session werden Gewichte
  nicht angezeigt (target_weight_kg + actual_weight_kg). Erwartung: Spalte
  sichtbar in beiden Trackern (ExerciseOverview, SetBySet).
- **B23b — Gewicht-Eingabe defekt:** User kann keine Gewichte eingeben oder
  aendern. Erwartung: Number-Input klickbar + speichert via dispatch.
- **B23c — Last-Weight-Memory weg:** Vorbefuellung mit Werten aus letzter
  Session greift nicht. Erwartung: useLastExerciseData liefert Auto-Fill (war
  fertig in Phase C v12.65-67).
- **B24 — Videos defekt:** Entweder Video-Button fehlt komplett, oder
  Wiedergabe schlaegt fehl. Erwartung: PlayCircle-Icon neben Exercise-Name,
  oeffnet Player.
- **B25 — Workout-Theme schlecht lesbar:** Blaue Schrift auf schwarzem
  Hintergrund. Erwartung: Power-Console-Auto-Switch (v14.28 Stufe 3) liefert
  Acid-Lime auf Charcoal mit ausreichendem WCAG-AA-Kontrast. Aktueller Zustand
  deutet auf einen unvollstaendigen Token-Sweep im Workout-Bereich hin
  (Studio-Indigo `#3D4FB8` ueber Console-Charcoal `#0B0D0F`).

---

## 2. Arbeitsprinzipien (non-negotiable)

1. **Test-first.** Bevor du eine Zeile Fix-Code schreibst: lege einen Test an,
   der den Bug reproduziert und scheitert. Erst dann fixen. Test muss danach
   gruen. Das verhindert Wiederholungs-Regressionen.
2. **Ein Bug = ein Branch = ein Commit.** Klares Diff, einfach revertbar.
3. **Verifikations-Protokoll (siehe Abschnitt 5) muss vollstaendig sein,
   bevor du "fertig" sagst.** Speziell: User-Flow-Walkthrough auf Dev-Preview
   ODER expliziter "Timo-bitte-testen"-Block mit konkreten Klick-Schritten.
4. **Nichts aufraeumen "im Voruebergehen".** Wenn dir waehrend Bug 1 etwas an
   Bug 4 auffaellt: notiere es als FIXME in einem `regression-sprint-followups.md`
   und lass es. Scope-Creep ist der Grund warum dieser Sprint existiert.
5. **Wenn du die Login-Verifikation nicht selbst machen kannst:** Sag das
   LAUT. Schreib einen Block mit dem Wortlaut:

       ⚠ USER-VERIFIKATION ERFORDERLICH
       Ich kann den Fix nicht ohne Test-Login verifizieren.
       Bitte:
       1. Login auf https://fudda.de mit Test-Account
       2. <konkrete Klick-Schritte>
       3. Erwartung: <konkrete Erwartung>
       4. Wenn OK: weiter mit Portion X.
       5. Wenn nicht OK: Reproduktions-Screenshot + zurueck.

6. **Keine Halbsachen.** Wenn ein Fix in seiner Komplexitaet groesser wird als
   die Portion, dann splitte die Portion. Liefere lieber eine fertig
   verifizierte Portion als drei halbfertige.

---

## 3. Sprint-Portionen (sequenziell, je 1-3h, individuell commitbar)

### Portion A — Triage + Reproduktion (~2h, **NO CODE CHANGES**)

**Ziel:** Fuer jeden der 4 Bugs konkret identifizieren WO der Code haengt und
WELCHER Commit ihn wahrscheinlich gebrochen hat. Output ist ein Triage-Doc,
kein Fix.

**Schritte:**

1. Branch anlegen: `git checkout feat/telemetry-cleanup && git pull && git checkout -b investigate/regression-2026-05-17`
2. Doku-File anlegen: `docs/REGRESSION_TRIAGE_2026-05-17.md`
3. Fuer jeden Bug B22-B25:
   a. Mit Glob + Grep den/die wahrscheinlich betroffenen Files finden. Hinweise:
      - **B22:** `src/features/workouts/components/TrainingPlanList.tsx`,
        `src/features/workouts/components/WorkoutStartDialog.tsx`,
        `src/features/workouts/components/ActivePlanCard*.tsx`,
        `src/features/workouts/hooks/useTrainingPlans.ts`
      - **B23:** `src/features/workouts/components/ExerciseOverviewTracker.tsx`
        (kuerzlich um RPE-Picker erweitert),
        `src/features/workouts/components/SetBySetTracker.tsx` (kuerzlich um
        RPE+PlateCalc erweitert), `src/features/workouts/context/ActiveWorkoutContext.tsx`
        (EDIT_LOGGED_SET kuerzlich erweitert um rpe), `src/features/workouts/hooks/useLastExerciseData.ts`
      - **B24:** Such nach `video_url`, `video_link`, `youtubeId`, `PlayCircle`,
        `video` in `src/features/workouts/components/`
      - **B25:** `src/lib/theme/ThemeContext.tsx`, `src/pages/ActiveWorkoutPage.tsx`
        (verwendet `useTempSurfaceMode('console', true)` lt. MEMORY), Active-Workout-
        spezifische Komponenten
   b. `git log -p --since=2026-05-01 --follow <file>` fuer jede betroffene Datei
      lesen. Identifiziere den verdaechtigen Commit.
   c. Im Triage-Doc dokumentieren: **Symptom · Wahrscheinlicher File · Verdaechtiger
      Commit · Hypothese**.
4. Am Ende: priorisiere die Bugs nach **User-Impact × Fix-Aufwand**. Empfehle
   eine Reihenfolge fuer Portionen C-F.

**Done when:**
- Triage-Doc existiert mit 4 Sektionen (B22-B25)
- Pro Bug: mind. 1 File-Pfad, 1 verdaechtiger Commit-SHA, 1 Hypothese
- Priorisierungs-Empfehlung am Ende

**Hand-off:** Commit `investigate(regression): triage doc B22-B25`.
Schreib in der Antwort die Priorisierungs-Empfehlung + welche Hypothesen am
wahrscheinlichsten sind. KEIN Code-Change in dieser Portion.

---

### Portion B — Test-Harness aufbauen (~3h)

**Ziel:** Schreibe failing Tests fuer alle 4 Bugs, BEVOR Fixes gebaut werden.
Diese Tests sind die Spezifikation von "richtig" und werden auch zukuenftige
Regressionen abfangen.

**Schritte:**

1. Branch wechseln: `git checkout -b test/regression-harness-2026-05-17` (off
   `feat/telemetry-cleanup`)
2. Check: Ist Playwright/Cypress konfiguriert?
   `cat package.json | grep -i "playwright\|cypress"`
   - **JA:** schreibe E2E-Tests (bevorzugt — fangen UI-Regressionen)
   - **NEIN:** schreibe Component-Tests mit `@testing-library/react` (existierendes
     Vitest-Setup, siehe `src/lib/__tests__/`). Component-Tests koennen die
     meisten dieser Bugs trotzdem reproduzieren, weil sie auf Reducer-/Hook-Ebene
     ansetzen.
3. Pro Bug eine Test-Datei mit `.failing.test.ts` Suffix anlegen (damit klar
   ist: diese sollten anfangs scheitern, vor Fix). Vitest unterstuetzt `.failing()`
   nicht direkt, aber wir nutzen das Suffix nur als Marker.
4. Test-Spezifikation pro Bug:

   **B22 Test — Multi-Day-Plan Start-Button:**
   ```ts
   // tests fuer TrainingPlanList:
   //   given: ein Plan mit 3 Tagen (Push, Pull, Legs)
   //   when:  TrainingPlanList rendert
   //   then:  3 distincte Start-Buttons sind klickbar, einer pro Tag
   //   and:   click auf Day 2 navigiert/startet mit Day 2 als active
   ```

   **B23a Test — Weight-Spalte sichtbar:**
   ```ts
   // tests fuer ExerciseOverviewTracker:
   //   given: ein Workout mit Strength-Uebung (target_weight_kg=80) und 3 Saetzen
   //   when:  Component rendert mit nicht-noWeight Branch
   //   then:  Weight-Input ist sichtbar (data-testid="set-weight-input" oder Pendant)
   //   and:   value/placeholder reflects 80
   ```

   **B23b Test — Weight-Input editierbar:**
   ```ts
   // tests fuer Active-Workout-Reducer:
   //   given: aktive Session, current set, input weight=85
   //   when:  user typed in weight-input field und drueckt Confirm
   //   then:  state.exercises[0].sets[0].actual_weight_kg === 85
   ```

   **B23c Test — Last-Weight-Memory:**
   ```ts
   // tests fuer useLastExerciseData oder ExerciseOverviewTracker mit Mock-History:
   //   given: vorhandene Workout-Historie mit "Bench Press" zuletzt 85kg×8
   //   when:  neue Session mit "Bench Press" startet
   //   then:  Previous-Spalte zeigt 85kg×8
   //   and:   Auto-Fill (oder Placeholder) im Weight-Input ist 85
   ```

   **B24 Test — Video-Button:**
   ```ts
   // tests fuer Exercise-Display (welche Komponente das macht):
   //   given: Catalog-Exercise mit video_url="https://youtube.com/..."
   //   when:  Component rendert im Tracker
   //   then:  Video-Button (PlayCircle) sichtbar
   //   and:   click oeffnet Modal/Iframe (oder zumindest dispatcht das Event)
   ```

   **B25 Test — Workout-Theme-Kontrast:**
   ```ts
   // tests fuer ActiveWorkoutPage:
   //   given: Page wird montiert (useTempSurfaceMode('console', true))
   //   when:  document.documentElement liest data-surface-mode
   //   then:  === 'console'
   //   and:   ALL primary-text-elemente innerhalb der Page haben Compute-Color
   //          mit WCAG-AA-Kontrast >= 4.5:1 zum Page-Background
   //   (kann via getComputedStyle in jsdom approximiert werden — wenn zu komplex,
   //    Snapshot-Test der relevanten Klassen mit Erwartung: keine `text-blue-*`
   //    oder `text-indigo-*` mehr in der Komponente)
   ```

5. Tests laufen lassen: `npm test -- --run` — alle 4 Tests muessen SCHEITERN
   (sonst ist der Test falsch oder der Bug ist schon weg).
6. Wenn ein Test gruen ist obwohl der Bug existiert: Test ist zu schwach. Verbessern,
   bis er den Bug wirklich faengt.

**Done when:**
- 4 neue Test-Dateien mit fokussierten Tests existieren
- Alle 4 scheitern bei `npm test -- --run` (Test-Count: 4762 statt 4758)
- Test-Output ist verstaendlich (kein generisches "expected X received Y" ohne
  Kontext)

**Hand-off:** Commit `test(regression): failing tests for B22-B25`. Schreib die
Test-Output-Zusammenfassung in die Antwort (welche Assertions scheitern).

**WICHTIG:** Diese Tests duerfen NICHT in die main-Pipeline gemerged werden,
solange sie noch scheitern. Branch bleibt isoliert bis Portion G.

---

### Portion C — Fix Bug mit hoechster Priorisierung (1 von B22-B25, ~2h)

Empfehlung der Priorisierung: nimm die aus Portion A. Falls Portion A noch nicht
abgearbeitet, default = **B23 (Gewichte) first, dann B25 (Theme), dann B22
(Multi-Day), dann B24 (Videos)** — weil B23 die meisten User komplett blockiert.

**Generische Schritte fuer jeden Bug-Fix (Portionen C, D, E, F):**

1. Branch: `git checkout feat/telemetry-cleanup && git checkout -b fix/regression-B<NN>-<slug>`
2. Cherry-pick den failing Test aus Portion B in diesen Branch:
   `git checkout test/regression-harness-2026-05-17 -- src/<path>/B<NN>.failing.test.ts`
3. `npm test -- --run B<NN>` — bestaetigen dass Test scheitert
4. Fix implementieren — kleinstmoeglicher Code-Change. KEIN Refactoring nebenbei.
5. `npm test -- --run B<NN>` — Test muss gruen
6. Test umbenennen: `B<NN>.failing.test.ts` → `B<NN>.test.ts` (Marker entfernen)
7. Vollstaendige Verifikation (Abschnitt 5)
8. Commit: `fix(B<NN>): <kurze Beschreibung>`
9. Deploy (Abschnitt 6)
10. Live-Verifikation (Abschnitt 7) — entweder Playwright auf Live ODER expliziter
    USER-VERIFIKATION-Block fuer Timo

**Bug-spezifische Hinweise (verifizieren via Portion-A-Triage, nicht blind folgen):**

- **B22 Multi-Day-Start:** Schau in `WorkoutStartDialog` oder `TrainingPlanList`,
  wo der Start-Button gerendert wird. Mehrtaegige Plaene haben
  `training_plan_days[]` als Subquery. Wahrscheinliche Ursache: Render-Loop
  uebergeht days[1..n], oder ein `is_today_day` Flag wird falsch berechnet.
- **B23a Weight-Spalte:** `ExerciseOverviewTracker.tsx` hat `noWeight` Branch.
  Wenn `target_weight_kg == null` (oft bei Bodyweight) wird `noWeight=true` und
  die ganze Spalte fliegt raus. Pruefen: wird `noWeight` korrekt berechnet?
  Wahrscheinliche Regression: ein Telemetry-Wrap oder die RPE-Picker-Integration
  hat die Logic gestoert.
- **B23b Weight-Input:** Hat der Input `disabled={isInputDisabled}` und ist
  `isInputDisabled` durch eine kuerzliche Aenderung permanent true gesetzt?
- **B23c Last-Weight:** `useLastExerciseData()` (Phase C v12.65-67) liefert
  Previous-Werte. Wird der Hook noch aufgerufen? Pre-fill greift in
  WorkoutStartDialog (wo der active workout gestartet wird). Suche
  "auto-fill" oder "lastSet" in den entsprechenden Files.
- **B24 Videos:** Such nach `video_url` oder `youtubeId` in CatalogExercise.
  Wenn das Feld umbenannt wurde oder ein Render-Conditional `&& video_url`
  jetzt false ist, fehlt der Button. Pruefe Catalog-DB-Query auch.
- **B25 Theme:** `useTempSurfaceMode('console', true)` setzt `data-surface-mode`
  auf html. Pruefe ob in Active-Workout-spezifischen Komponenten noch
  hardcoded `text-indigo-*` oder `text-blue-*` Klassen drinstehen (statt Tokens
  wie `text-theme-primary`). Wenn ja: Sweep diese auf Tokens.

**Done when:**
- Test gruen
- Verifikations-Protokoll (Abschnitt 5) komplett
- Live verifiziert (Abschnitt 7)

**Hand-off:** Commit-SHA + 1 Saetze "was wars" + "naechste Portion startbar".

---

### Portion D, E, F — Restliche 3 Bugs

Wie Portion C, jeweils ein Bug.

**Sequence-Empfehlung wenn alle 4 noch offen:**

1. Portion C: B23 (Gewichte) — Block-Bug
2. Portion D: B25 (Theme) — User-sichtbar in jeder Session
3. Portion E: B22 (Multi-Day) — wichtig fuer Power-User
4. Portion F: B24 (Videos) — Komfort-Feature

Wenn Portion A eine andere Priorisierung empfiehlt, folge der.

---

### Portion G — Integration + Final-Verifikation (~2h)

**Ziel:** Alle 4 Fixes zusammenfuehren, kompletter Smoke-Test, Deploy.

**Schritte:**

1. Sicherstellen dass alle 4 Fix-Branches in `feat/telemetry-cleanup` gemerged
   sind (oder wie auch immer der Integration-Branch heisst).
2. Test-Harness-Branch ebenfalls mergen (jetzt sind alle Tests gruen).
   `git merge --no-ff test/regression-harness-2026-05-17`
3. Auf telemetry-cleanup: `npx tsc --noEmit` + `npm test -- --run` + `npx vite build`
   — alles muss gruen sein. Erwartete Test-Anzahl: 4762 (4758 + 4 neue).
4. Deploy nach Abschnitt 6
5. **Final-Verifikation (USER-VERIFIKATION ERFORDERLICH):**

       ⚠ USER-VERIFIKATION ERFORDERLICH
       Bitte vor Sprint-Abschluss diese 4 Szenarien auf https://fudda.de testen.
       Idealerweise mit dem Test-Account aus dem 2026-05-17-Test.

       Szenario 1 — Multi-Day (B22):
         1. Login
         2. /training → Plan-Tab → Aktiven Plan oeffnen mit >=2 Tagen
         3. Tag 2 antippen
         4. Erwartung: Start-Button erscheint, click startet Session mit Tag 2

       Szenario 2 — Gewichte (B23a/b/c):
         1. In Active Workout mit Strength-Uebung
         2. Erwartung: Weight-Spalte sichtbar, mit Target-Wert im Placeholder
         3. Tippe in einem Set 85 ein
         4. Erwartung: Wert wird angenommen
         5. Workout finishen, neues Workout mit gleicher Uebung starten
         6. Erwartung: Previous-Spalte zeigt 85kg

       Szenario 3 — Videos (B24):
         1. In Active Workout
         2. Suche Video-Button neben einer Uebung mit video_url im Catalog
         3. Erwartung: Button sichtbar, click oeffnet Player

       Szenario 4 — Theme (B25):
         1. Active-Workout-Session starten
         2. Erwartung: Page-BG Charcoal, Primary-Color Acid-Lime, Text gut lesbar
         3. KEIN blau-auf-schwarz mehr

       Wenn alle 4 OK: bestaetige + ich (Agent) markiere B22-B25 in TODO.md als
       gefixt + setze MEMORY-Note "Regression-Sprint 2026-05-17 abgeschlossen".

       Wenn irgendwas NOK: Screenshot/Beschreibung -> dann zurueck in Portion
       C/D/E/F je nach Bug.

6. **Nur wenn Final-Verifikation OK:** TODO.md aktualisieren (B22-B25
   durchstreichen + Fix-Commit-Hash), MEMORY.md-Eintrag.

**Done when:**
- 4 Bugs durchgestrichen in TODO.md
- Live HTTPS 200 auf fudda.de mit neuer Build-Hash
- Timo bestaetigt User-Verifikation
- MEMORY-Eintrag geschrieben

---

## 4. Verifikations-Protokoll (gilt fuer jede Fix-Portion)

Bevor du "fertig" sagst, MUESSEN folgende Punkte erfuellt sein:

| # | Check | Befehl | Bestanden wenn |
|---|-------|--------|----------------|
| 1 | TypeScript clean | `npx tsc --noEmit` | exit=0, keine Fehler |
| 2 | Tests gruen | `npm test -- --run` | alle Tests passing, mind. +1 fuer diesen Bug |
| 3 | Vite Build | `npx vite build` | exit=0, "built in Xs" |
| 4 | Regression-Test existiert | `git log --diff-filter=A -- src/**/B<NN>.test.ts` | Datei ist neu in diesem Branch |
| 5 | Regression-Test scheitert ohne Fix | git checkout~1 → npm test -- B<NN> | scheitert (=> Test wirkt) |
| 6 | Regression-Test gruen mit Fix | git checkout HEAD → npm test -- B<NN> | gruen |

Schritt 5+6 sind die kritischen — beweisen dass der Test wirklich diesen Bug
faengt. Wenn 5 schon gruen ist, ist der Test zu schwach.

---

## 5. Deploy-Workflow (per Fix-Portion)

```bash
# Auf dem Fix-Branch, nach allen Verifikations-Checks aus Abschnitt 4:

# 1. Build
cd "C:/Users/test/OneDrive/AI/Fitness App/src"
npx vite build  # -> dist/

# 2. Backup auf Server
ssh root@46.225.228.12 "cp -r /opt/fitbuddy/frontend /opt/fitbuddy/frontend.bak-pre-B<NN>-$(date +%Y%m%d-%H%M)"

# 3. Upload (tar-pipe weil rsync auf Win-Bash fehlt)
ssh root@46.225.228.12 "rm -rf /opt/fitbuddy/frontend.new && mkdir -p /opt/fitbuddy/frontend.new"
tar czf - -C dist . | ssh root@46.225.228.12 "tar xzf - -C /opt/fitbuddy/frontend.new"

# 4. Atomic swap + Caddy restart (Bind-Mount-Inode-Refresh)
ssh root@46.225.228.12 "rm -rf /opt/fitbuddy/frontend && mv /opt/fitbuddy/frontend.new /opt/fitbuddy/frontend && cd /opt/fitbuddy && docker compose restart caddy && sleep 3"

# 5. HTTP smoke
curl -s -o /dev/null -w "HTTPS %{http_code} in %{time_total}s\n" https://fudda.de/
curl -s "https://fudda.de/" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1
```

200 OK + neue Hash = technisch deployed. **Das ist NICHT "fertig".** Erst nach
User-Flow-Verifikation (Abschnitt 6) ist "fertig".

---

## 6. User-Flow-Verifikation (per Fix)

**Option 1 — Playwright (wenn Setup vorhanden):**
- Schreibe oder erweitere einen E2E-Test, der das Bug-Szenario live auf
  fudda.de durchspielt (mit Test-Account aus env).
- `npx playwright test --grep B<NN>` → muss gruen.

**Option 2 — Dev-Preview (wenn Du Test-Login einrichten kannst):**
- Login auf http://localhost:5173 mit gesepecherten Test-Credentials
- Bug-Szenario manuell durchspielen
- Console + Network auf Fehler pruefen
- preview_screenshot fuer den Beweis

**Option 3 — USER-VERIFIKATION (wenn 1 + 2 nicht moeglich):**
- Schreibe einen klaren Block (siehe Beispiel in Portion G Schritt 5) mit:
  - Exakte URL
  - Schritt-fuer-Schritt-Klicks
  - Erwartung pro Schritt
  - Erfolgs-/Misserfolgs-Kriterium
- Warte auf Timos Antwort. KEINE Behauptung "fixed" ohne Bestaetigung.

---

## 7. Was NICHT in diesem Sprint passieren darf

- Keine neuen Features
- Keine Refactorings die ueber den Bug-Scope hinausgehen
- Keine Theme-Aenderungen die ueber B25 hinausgehen
- Keine Migration-Aenderungen
- Keine Cleanup-Sweeps fuer entdeckte Aber-Verwandt-Probleme (notieren statt fixen)
- Keine Edge-Function-Aenderungen (Backend ist stabil)
- Kein PH4-Resend-Webhook-Followup (steht im Backlog)

---

## 8. Hand-off-Format (fuer Session-Wechsel zwischen Portionen)

Wenn du mitten in einer Portion in den naechsten Session-Wechsel laufen musst,
schreibe in die letzte Antwort:

```
## Sprint-Status
- Branch: <branch-name>
- Portion: <Buchstabe> — <Zustand: in_progress/done/blocked>
- Letzter Commit: <SHA + Message>
- Was als Naechstes: <konkrete naechste Schritte aus dem Plan>
- Blocker (falls): <was Du brauchst>
```

Damit kann ein frischer Agent ohne Recap weitermachen.

---

## 9. Erfolgs-Definition fuer den ganzen Sprint

- 4 Bugs B22-B25 sind in TODO.md durchgestrichen mit Fix-Commit-Hash
- 4 neue Tests in der Test-Suite (Test-Count 4762)
- Timo hat alle 4 Szenarien aus Portion G bestaetigt
- Eine kurze MEMORY-Note erklaert was die Lehre war (vermutlich:
  "user-flow-verifikation gehoert zur Definition-of-Done, HTTP 200 reicht nicht")

---

## 10. Falls etwas grundsaetzlich anders aussieht als hier beschrieben

- Test-Suite ist groesser/kleiner als 4758? → ignorieren, nimm Ist-Stand.
- Branch-Layout ist anders (kein feat/telemetry-cleanup mehr)? → frag bei Timo
  nach dem aktuellen Integration-Branch.
- Bugs reproduzieren sich nicht? → Triage-Doc trotzdem schreiben, dokumentieren
  warum nicht reproduzierbar (Cache? Browser? Specific User?). Dann pause und
  hand off an Timo.
- Test schlaegt nach Fix immer noch fehl? → Test ist falsch ODER Fix ist falsch
  ODER Bug hat 2 Ursachen. Nicht den Test entschaerfen — die Ursache finden.

---

**Ende Prompt. Viel Erfolg.**
