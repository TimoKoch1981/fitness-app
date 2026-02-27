# Musik & Timer Ueberarbeitung — Konzept

> User-Feedback v10.9: "ist so Mist" — Grundlegende UX-Ueberarbeitung erforderlich.
> Erstellt: 2026-02-27, Status: Konzept (noch nicht implementiert)

---

## 1. Ist-Analyse

### 1.1 Musik (WorkoutMusicPlayer.tsx)

**Aktueller Zustand:** YouTube-Einbettung via `youtube-nocookie.com` iframe.

**Identifizierte Probleme:**

| # | Problem | Schwere | Ursache |
|---|---------|---------|---------|
| 1 | **Kein Sound** — User hoert nichts | Kritisch | YouTube IFrame API Library wird NICHT geladen. `enablejsapi=1` ist gesetzt, aber `window.YT` existiert nie. Die `postMessage()`-Aufrufe zum Muten/Unmuten verpuffen. |
| 2 | **Autoplay blockiert** | Kritisch | Iframe ist `w-0 h-0 opacity-0 pointer-events-none` (unsichtbar). Browser blockieren Autoplay bei unsichtbaren Elementen. Chrome/Safari verlangen User-Interaktion VOR dem Abspielen. |
| 3 | **Mute/Unmute wirkungslos** | Hoch | Ohne geladene IFrame API sind `postMessage()`-Befehle nutzlos. State `isMuted` aendert nur das Icon, nicht den Sound. |
| 4 | **Kein Fehler-Feedback** | Mittel | Kein try/catch, kein Fallback, kein Hinweis an User dass nichts laeuft. |
| 5 | **Loop bei Playlists** | Niedrig | `&loop=1` funktioniert nur fuer Einzelvideos, nicht fuer Playlists. |

**Fazit:** Der gesamte Audio-Teil ist de facto kaputt. Nur die UI funktioniert.

### 1.2 Timer

**Aktuelle Komponenten:**

| Komponente | Datei | Funktion |
|------------|-------|----------|
| RestTimer | `RestTimer.tsx` (129 Zeilen) | Countdown zwischen Sets. Kreisfoermiger SVG-Fortschritt, Skip, +-15s, Vibration bei Ablauf. |
| ExerciseTimer | `ExerciseTimer.tsx` (177 Zeilen) | Fuer zeitgesteuerte Uebungen (Plank, Isometrie). Start/Pause/Reset, Skip, Done. |
| ManualTimer | `ManualTimer.tsx` (158 Zeilen) | Optionale Stoppuhr/Countdown. Einklappbar, unabhaengig vom Flow. |
| suggestRestTimes | `suggestRestTimes.ts` (160 Zeilen) | KI-Vorschlag: Kraft 180-210s, Hypertrophie 90-120s, Ausdauer 45-75s, Compound +30s. |

**Identifizierte UX-Probleme:**

| # | Problem | Schwere | Ursache |
|---|---------|---------|---------|
| 1 | **Uebung nicht ueberspringbar (gefuehlt)** | Kritisch | Skip ist im 3-Punkt-Menu (⋮) versteckt. User hat es nicht gefunden. Feature existiert, aber UX versagt. |
| 2 | **Timer nicht abschaltbar (gefuehlt)** | Kritisch | Timer-Toggle ist ein winziger Icon-Button im Header. User hat es nicht erkannt. Feature existiert, aber UX versagt. |
| 3 | **Kein manueller Multi-Timer** | Hoch | ManualTimer kann nur EINE Zeit tracken. User will 5 separate Bereiche gleichzeitig sehen. |
| 4 | **Keine Gesamttrainings-Uhr** | Hoch | Kein sichtbarer Countdown/Stopwatch fuer die gesamte Session-Dauer. |
| 5 | **Phasen starr gekoppelt** | Mittel | Workout-Flow: warmup → exercise → rest → summary. Man kann nicht frei zwischen Bereichen navigieren. |

**Fazit:** Features existieren, aber die UX ist so schlecht, dass sie unsichtbar sind.

---

## 2. Anforderungen (User-Vorgaben)

### 2.1 Musik

1. **YouTube muss funktionieren** — Audio muss hoerbar sein (nicht nur UI-Anzeige)
2. **Spotify als Alternative** — Spotify-Integration als zweite Option
3. **Ueberleg wie das gehen koennte** — Konzept-Freiraum

### 2.2 Timer

1. **Uebungen ueberspringbar** — Prominenter Skip-Button, nicht im Menu versteckt
2. **Timer grundsaetzlich abschaltbar** — Deutlicher ON/OFF Switch, nicht nur Icon
3. **Tabellarischer Multi-Timer** — Grosse Uhr mit 5 Sektionen:
   - **Gesamttraining:** Dauer oder Countdown
   - **Aktuelle Uebung:** Dauer oder Countdown
   - **Pause zwischen Uebungen:** Countdown
   - **Aktuelles Set:** Dauer oder Countdown
   - **Pause zwischen Sets:** Countdown
4. **Jede Sektion separat aktivierbar/deaktivierbar**
5. **Manuell startbar** — User startet selbst, kein Automatismus (optional zuschaltbar)

---

## 3. Loesungs-Konzept

### 3.1 Musik — Hybrid-Ansatz

#### Phase 1: YouTube reparieren
- YouTube IFrame Player API korrekt laden (`<script>` Tag fuer `youtube.com/iframe_api`)
- Player mit `new YT.Player()` instanziieren statt rohem iframe
- **Sichtbarer Mini-Player** (nicht mehr `w-0 h-0 opacity-0`)
  - Kleines Thumbnail + Titel am unteren Rand
  - Play/Pause/Skip/Lautstaerke als echte API-Calls
- Autoplay nur nach User-Interaktion (Playlist-Klick = Interaktion)
- Error-Handling: Fallback-Meldung wenn Playback fehlschlaegt
- `youtube-nocookie.com` beibehalten (Datenschutz)

#### Phase 2: Spotify Deep-Links
- **Kein Spotify Web Playback SDK** (braucht Premium + OAuth + komplexes Setup)
- Stattdessen: **Deep-Links** die Spotify-App direkt oeffnen
  - `spotify:playlist:37i9dQZF1DX76Wlfdnj7AP` → oeffnet Spotify App
  - `https://open.spotify.com/playlist/...` → oeffnet Spotify Web/App
- Kuratierte Spotify-Playlists parallel zu YouTube-Playlists
- "In Spotify oeffnen" Button pro Playlist
- Kein Streaming in unserer App (keine Auth noetig, kein Premium noetig)

#### Phase 3 (optional): Lokale Audio-Dateien
- Media Session API fuer System-Mediensteuerung
- User laedt eigene MP3s hoch (Capacitor File Access)
- Nur wenn genug Nachfrage

**Architektur-Aenderungen:**

```
WorkoutMusicPlayer.tsx (komplett neu)
├── MusicSourceSelector (YouTube | Spotify | Custom)
├── YouTubePlayer (YT.Player API, sichtbar)
│   ├── Thumbnail + Titel
│   ├── Play/Pause/Skip
│   └── Lautstaerke-Slider
├── SpotifyLauncher (Deep-Links)
│   ├── Kuratierte Playlists (4+)
│   └── Custom Spotify-URL
└── NowPlaying Bar (immer sichtbar wenn aktiv)
```

### 3.2 Timer — Tabellarischer Multi-Timer

#### Neue Komponente: `WorkoutTimerPanel`

```
┌─────────────────────────────────────────────────────┐
│  ⏱️  WORKOUT TIMER             [Timer AUS/AN] ━━○  │
├───────┬──────────────────┬──────────┬───────────────┤
│  ✅   │ Gesamttraining   │  45:00 ▼ │  32:17  ⏵    │
│  ✅   │ Aktuelle Uebung  │  05:00 ▼ │  03:22  ⏵    │
│  ⬜   │ Pause zw. Uebung │  02:00 ▼ │  --:--       │
│  ✅   │ Aktuelles Set    │  00:45 ▼ │  00:31  ⏵    │
│  ✅   │ Pause zw. Sets   │  01:30 ▼ │  01:30  ⏸    │
├───────┴──────────────────┴──────────┴───────────────┤
│  [ ▶ START ]  [ ⏸ PAUSE ]  [ ↺ RESET ]  [⏭ SKIP]  │
└─────────────────────────────────────────────────────┘

Spalten:
  ✅/⬜  = Sektion aktiv/inaktiv (Toggle per Tap)
  Name   = Beschreibung der Sektion
  Soll   = Eingestellte Zielzeit (editierbar, Picker oder +-Buttons)
  Ist    = Laufende Zeit (Countdown oder Stopwatch)

Buttons:
  START  = Startet alle aktiven Timer
  PAUSE  = Pausiert alles
  RESET  = Setzt aktiven Timer zurueck
  SKIP   = Springt zur naechsten Uebung (PROMINENTER Button)
```

#### Die 5 Timer-Sektionen:

| # | Sektion | Modus | Default | Auto-Trigger |
|---|---------|-------|---------|--------------|
| 1 | Gesamttraining | Countdown ODER Stopwatch | 60:00 | Startet bei Session-Beginn |
| 2 | Aktuelle Uebung | Countdown ODER Stopwatch | 05:00 | Reset bei naechster Uebung |
| 3 | Pause zw. Uebungen | Countdown | 02:00 | Startet nach letztem Set einer Uebung |
| 4 | Aktuelles Set | Countdown ODER Stopwatch | 00:45 | Reset bei naechstem Set |
| 5 | Pause zw. Sets | Countdown | suggestRestTime() | Startet nach Set-Log |

#### Verhalten:

- **Jede Sektion einzeln aktivierbar/deaktivierbar** per Checkbox
- **Countdown oder Stopwatch** pro Sektion waehlbar
- **Global ON/OFF** oben als deutlicher Switch (nicht Icon-Button)
- **Wenn alles deaktiviert:** Timer-Panel klappt zusammen, nur "Timer" Label + Switch sichtbar
- **Vibration + Sound** wenn ein Countdown auf 0 laeuft (konfigurierbar)
- **Auto-Advance optional:** User kann waehlen ob Timer automatisch Phasen triggern oder nur zaehlen
- **Skip prominent:** Grosser Button in der Button-Leiste, nicht im Menu

#### Architektur-Aenderungen:

```
Neue Dateien:
  WorkoutTimerPanel.tsx         — Haupt-Container mit Tabelle
  TimerSectionRow.tsx           — Einzelne Timer-Zeile (Toggle, Label, Soll, Ist)
  useWorkoutTimers.ts           — Hook: 5 Timer-States, Start/Pause/Reset/Skip
  timerPresets.ts               — Default-Zeiten pro Uebungstyp

Modifizierte Dateien:
  ActiveWorkoutPage.tsx         — RestTimer/ManualTimer → WorkoutTimerPanel
  ActiveWorkoutContext.tsx       — Timer-State erweitern (5 Sektionen statt 1 Phase)
  ExerciseTracker.tsx           — Skip-Button prominent, nicht im Menu

Entfaellt:
  RestTimer.tsx                 — Wird durch Sektion 5 ersetzt
  ManualTimer.tsx               — Wird durch gesamtes Panel ersetzt
  ExerciseTimer.tsx             — Wird durch Sektion 2/4 ersetzt (fuer Timed Exercises)
```

---

## 4. Migration

| Alt | Neu | Aenderung |
|-----|-----|-----------|
| RestTimer (kreisfoermig) | TimerSectionRow #5 | Tabellenzeile statt Kreis |
| ExerciseTimer (kreisfoermig) | TimerSectionRow #2 | Gleiche Logik, neues Layout |
| ManualTimer (einklappbar) | WorkoutTimerPanel | Alle 5 Sektionen statt 1 |
| Timer-Toggle (Icon im Header) | Switch mit Label | Deutlich sichtbar |
| Skip (im ⋮ Menu) | Grosser Button | Immer sichtbar |
| suggestRestTimes | timerPresets.ts | Erweitert um alle 5 Sektionen |

---

## 5. Offene Fragen (User-Entscheidung)

1. **Timer-Layout:** Tabelle (wie oben) oder separate Karten pro Sektion?
2. **Auto-Advance:** Sollen Timer automatisch Phasen wechseln oder ist alles manuell?
3. **Spotify:** Nur Deep-Links oder volles SDK (braucht Spotify Premium)?
4. **Sound bei Timer-Ablauf:** Welcher Sound? System-Beep, Custom, oder nur Vibration?
5. **Timer-Presets:** Soll der User Profile speichern koennen? ("Kraft", "Hypertrophie", "Cardio")

---

## 6. Implementierungs-Reihenfolge

| Phase | Was | Aufwand |
|-------|-----|---------|
| M1 | YouTube IFrame API fixen (Sound reparieren) | ~2h |
| M2 | Sichtbarer Mini-Player mit Controls | ~2h |
| M3 | Spotify Deep-Links + kuratierte Playlists | ~1h |
| T1 | useWorkoutTimers Hook (5 Timer-States) | ~3h |
| T2 | WorkoutTimerPanel + TimerSectionRow UI | ~3h |
| T3 | ActiveWorkoutContext umbauen (Phase → Sektionen) | ~2h |
| T4 | Skip prominent + Timer ON/OFF Switch | ~1h |
| T5 | Alte Timer-Komponenten entfernen, Tests | ~2h |
| **Gesamt** | | **~16h** |

---

*Erstellt: 2026-02-27 | Version: 1.0 | Status: Konzept — Diskussion mit User ausstehend*
