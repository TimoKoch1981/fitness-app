---
name: regression-shield
description: Apply before any non-trivial code change to prevent functional regressions. TRIGGER when about to refactor a function/component with multiple call sites; when extending shared infrastructure (telemetry, error handling, auth, validation) that needs to cover ALL siblings; when fixing a bug whose root cause might exist in similar places; when re-using a UX pattern that already exists elsewhere; after deleting or moving code. Anti-trigger: tiny single-file changes with no callers.
---

# Regression Shield — Pre-Change & Post-Change Checks

## Why this exists

Feature regressions almost never come from "I broke the thing I was working on." They come from:

1. **Refactor by omission** — you extend infrastructure (telemetry, validation, auth retry) and cover 2 of the 3 places it should apply to. The third silently rots.
2. **Sibling drift** — you fix a bug in `useAddX` but the same bug exists in `useUpdateX` and `useDeleteX` because they were copy-pasted.
3. **Platform omission** — you fix the desktop hover-state and miss the touch path that doesn't have hover.
4. **Cache invariant break** — you change a queryKey shape and a stale cache somewhere holds the old shape, redirecting users to the wrong place forever.
5. **Test/code drift** — tests pass green but exercise a code path that the runtime no longer takes.

Each of these has a cheap, repeatable check that would have caught it. This skill turns those checks into a habit.

## When the skill fires

- **Before** touching shared infrastructure (logging, telemetry, error retry, validation, auth, caching).
- **Before** refactoring a function/component with ≥3 call sites.
- **Before** changing a hook signature, return type, or queryKey.
- **Before** deleting code (file, function, route, schema column).
- **After** any of the above lands — to run the post-deploy verification.

Don't fire for: typo fixes, single-file additions with no callers, doc edits, tests-only changes.

## The five layers

### Layer 1 — Caller Map (pre-change)

Before changing anything, list every consumer.

```bash
grep -rn "<exact-symbol-name>" src/ --include="*.ts" --include="*.tsx"
```

For each caller, ask:
- Does my change keep its current behaviour?
- Does it need to be updated in lockstep (e.g. new required param)?
- Is it tested?

**Output:** an inventory of callers in the change description. If the inventory is empty, double-check — the symbol may be exported but unused, or referenced via dynamic import.

### Layer 2 — Sibling Sweep (pre-change)

The bug you're fixing — does it exist in similar code nearby?

For a hook fix: list all hooks in the same folder. For a dialog crash: list all dialogs that use the same pattern. For a validation gap: list all schemas of the same shape.

```bash
ls src/features/medical/hooks/  # all hooks in the feature
ls src/features/*/components/Add*Dialog.tsx  # all "Add" dialogs
```

**Output:** a one-line "siblings checked" note in the commit message — even if the answer is "none affected." That note proves you looked.

### Layer 3 — Coverage Inventory (pre-change)

What guards this code path *today*?

- **Unit/integration tests** — `grep -rn "<symbol>" src/**/__tests__/`
- **Type system** — does TS catch the mistake you're worried about? If not, can you add a type guard?
- **Telemetry** — does production tell you when this path fails?
- **Manual smoke** — what's the user-facing flow that would visibly break?

If a layer is missing for the change in question, add it **before** the change, not after. Adding a missing test after the fix doesn't help — the next refactor will still miss it because nothing forced you to think about it.

**Output:** a "coverage" line in the change description: which layers protect the path now.

### Layer 4 — Platform & Mode Matrix (pre-change, UI-only)

For any UI change, ask:
- **Touch vs hover** — does this require pointer hover? On iPad/iPhone there is no hover. Test `:active` and `tap`, not `:hover`.
- **Mobile vs desktop layout** — does Tailwind `sm:` / `md:` / `lg:` change anything?
- **PWA vs browser** — does Service Worker caching change the lifecycle?
- **Native (Capacitor) vs web** — does this depend on browser APIs that the WebView restricts?
- **Onboarded vs new user** — does this code path assume profile is complete?
- **Authenticated vs anonymous** — does this access user-scoped data?

**Output:** explicit mention of which modes were considered, even if the answer is "all behave the same."

### Layer 5 — Post-Deploy Verification (after change)

Within 24h of merging:

1. **Telemetry check** — is the new path actually firing in production? Pull aggregates by action_type, user, status.
2. **Error budget** — did the failure rate of any related metric move? If yes, why?
3. **Smoke flow** — execute one happy path end-to-end through the production UI (Chrome MCP or manual).
4. **Persona check** — for user-facing changes, walk through the most relevant persona's flow once. Did the change cost them anything they had before?

**Output:** a follow-up comment on the change ("verified live, X works, Y unchanged, telemetry shows Z events").

## Anti-patterns to flag

- **"I'll add tests later"** — no, write the test that reproduces the bug FIRST, watch it fail, then fix.
- **"It works for me"** — verify on the actual user's platform (their phone, their browser, their account).
- **"The old code was buggy anyway"** — if the old code had users who relied on the buggy behaviour, you have a migration problem, not a fix.
- **"This is a 1-line change"** — 1-line changes are often the most dangerous because they bypass scrutiny.
- **"The cache will fix itself"** — Service Worker / React-Query cache can hold the old shape for days. Bust it explicitly.

## Concrete patterns (FitBuddy-specific examples)

These come from real regressions in this codebase. They are the patterns the skill is designed to catch next time:

### Pattern A — Telemetry blind spots (v14.2 → v14.8)

`logActionEvent` was added in v14.2, wired into `useBuddyChat` and `useActionExecutor`. Saw 0 events for two days because the **direct UI mutation hooks** (useAddSubstance, useAddMeal, etc.) were not wrapped. Then v14.8 added `withTelemetry` HOF and wrapped 7 hooks — but **forgot `useSaveWorkoutSession`**, which is the actual workout-save path. Discovered only when the user's 50-minute workout produced 0 telemetry events.

**Catch:** Layer 2 sibling sweep. When adding telemetry to mutation hooks, the prompt should be: *"list every file that contains `useMutation(` AND writes to a user-scoped DB table."*

### Pattern B — Touch vs hover (v14.9)

5 trash buttons in MedicalPage were `sm:opacity-0 sm:group-hover:opacity-100`. On Desktop: hidden until hover, fine. On iPad: hidden permanently because no hover exists. Worked for 9 weeks before the user reported it.

**Catch:** Layer 4 platform matrix. Any element behind `:hover` on a Tailwind utility class needs an explicit answer for touch.

### Pattern C — Cache invariant break (v14.10)

`useProfile` had `queryKey: ['profile']` without `user.id`. First boot rendered with no user → cache stored `null`. Cache never invalidated because key never changed. Onboarding loop on every login for weeks.

**Catch:** Layer 3 coverage inventory. When the change touches a queryKey, ask: "is this key user-scoped?" Most user-data queries should be.

### Pattern D — Prompt regression (v14.11)

Substance-Agent prompt was tightened in earlier versions for liability ("keep responses short, 2-3 sentences"). Over time, that crowded out the depth the persona actually needs. No test caught it because there was no semantic test for prompt outputs.

**Catch:** Layer 3 coverage + LLM-Eval. Prompt changes need a golden-set check, not just unit tests.

## How to invoke

Just narrate the change you're about to make and ask the skill to walk you through. Don't skip steps; pick the layers that apply.

Minimum: every change of the type listed in "When the skill fires" should produce at least:
1. A caller-map sentence.
2. A sibling-sweep sentence.
3. A platform/mode mention (for UI).
4. A coverage-inventory mention.
5. A post-deploy verification plan.

If you can't honestly produce these in 60 seconds, you don't understand the change well enough to make it yet.
