/**
 * B22 — Multi-Day-Plan Start-Button Regression (failing test).
 *
 * Bug: In einem mehrtaegigen Trainings-Plan kann der User nur Tag 1 starten;
 * Tag 2..n haben keinen klickbaren Start-Button (oder gar keinen Button).
 *
 * Test-Spec: Wenn ein Plan-Tag mindestens eine Uebung hat, MUSS DayCard einen
 * sichtbaren, klickbaren Start-Button rendern — unabhaengig von der day_number.
 *
 * Bug-Reproduktion: Aktuelle DayCard rendert den Start-Button nur, wenn
 * `day.exercises.length > 0`. Wenn die Test-User-Plaene ueber den Wizard mit
 * leeren Tag-2-Uebungen erstellt wurden, fehlt der Button.
 *
 * Strategie: Wir testen DayCard mit Mock-Daten fuer Tag 2 mit Uebungen (sollte
 * Button rendern) UND Tag 2 OHNE Uebungen (sollte trotzdem irgendeinen CTA
 * fuer den User rendern, damit der Tag nicht "tot" ist).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DayCard } from '../DayCard';
import type { TrainingPlanDay, PlanExercise, CatalogExercise } from '../../../../types/health';

// ── Mocks ────────────────────────────────────────────────────────────────

vi.mock('../../../../i18n', () => ({
  useTranslation: () => ({
    t: { workouts: { dayLabel: 'Tag', exercises: 'Übungen' } },
    language: 'de',
  }),
}));

vi.mock('../../hooks/useDraftWorkout', () => ({
  useInProgressWorkout: () => ({ data: null }),
  useAbortDraft: () => ({ mutateAsync: vi.fn() }),
}));

// ── Fixtures ─────────────────────────────────────────────────────────────

function makeExercise(name: string): PlanExercise {
  return {
    name,
    sets: 3,
    reps: '10',
    weight_kg: 60,
    rest_seconds: 90,
  };
}

function makeDay(day_number: number, exercises: PlanExercise[]): TrainingPlanDay {
  return {
    id: `day-${day_number}`,
    plan_id: 'plan-1',
    day_number,
    name: `Tag ${day_number}`,
    focus: 'Test',
    exercises,
    created_at: '2026-01-01T00:00:00Z',
  };
}

function renderDayCard(day: TrainingPlanDay) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const catalog: CatalogExercise[] = [];
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <DayCard
          day={day}
          planId="plan-1"
          isExpanded={false}
          onToggle={vi.fn()}
          catalog={catalog}
          onExerciseClick={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('B22 — Multi-Day Plan Start-Button', () => {
  it('Tag 2 mit Uebungen rendert einen sichtbaren Start-Button (Sanity)', () => {
    const day2 = makeDay(2, [makeExercise('Klimmzuege'), makeExercise('Rudern')]);
    renderDayCard(day2);

    // Erwartung: Es gibt einen Button mit Text "Start" oder Aria-Label "Training starten"
    const startElement = screen.queryByTitle(/Training starten|Start Workout/i);
    expect(startElement, 'Tag 2 mit 2 Uebungen muss einen Start-CTA haben').not.toBeNull();
  });

  it('Tag 2 OHNE Uebungen rendert trotzdem einen User-CTA (Start oder Add)', () => {
    // Bug-Reproduktion: day.exercises = [] → aktuell wird KEIN Start-Button
    // gerendert (Conditional `day.exercises.length > 0 && (...)`). Der Nutzer
    // hat damit keine Moeglichkeit, mit diesem Tag zu interagieren.
    //
    // Spec: Es muss IRGENDEINEN klickbaren CTA geben — entweder den Start-Button
    // (graceful fallback) oder einen "Uebungen hinzufuegen"-Button.
    const day2Empty = makeDay(2, []);
    renderDayCard(day2Empty);

    const startEl = screen.queryByTitle(/Training starten|Start Workout|Fortsetzen|Resume/i);
    const addEl = screen.queryByText(/Übungen hinzufügen|Add Exercise/i);

    expect(
      startEl || addEl,
      'Empty-Day muss einen Start- oder Add-Exercise-CTA haben',
    ).toBeTruthy();
  });
});
