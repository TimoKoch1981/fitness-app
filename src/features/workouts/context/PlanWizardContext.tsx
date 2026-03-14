/**
 * PlanWizardContext — Shared state for the unified PlanWizard.
 *
 * Manages wizard lifecycle (open/close), step navigation, form data,
 * and the bridge between Buddy chat actions and the wizard form.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAddTrainingPlan, useUpdateTrainingPlan } from '../hooks/useTrainingPlans';
import { getDefaultDayNames } from '../data/planConstants';
import { useTranslation } from '../../../i18n';
import { useInlineBuddyChat } from '../../../shared/components/InlineBuddyChatContext';
import type { TrainingPlan, SplitType, PlanExercise } from '../../../types/health';

// ── Types ───────────────────────────────────────────────────────────────────────

export type WizardMode = 'create' | 'edit';
export type WizardStep = 1 | 2;

export interface WizardDay {
  day_number: number;
  name: string;
  focus: string;
  exercises: PlanExercise[];
  notes: string;
}

interface PlanWizardContextType {
  /** Whether the wizard is currently open */
  isActive: boolean;
  /** Create or edit mode */
  mode: WizardMode;
  /** Current step (1=metadata, 2=exercises) */
  step: WizardStep;
  /** Whether the buddy is docked next to the wizard */
  buddyDocked: boolean;

  // Form data
  planId: string | null;
  name: string;
  splitType: SplitType;
  daysPerWeek: number;
  notes: string;
  days: WizardDay[];

  // Saving state
  isSaving: boolean;
  error: string | null;

  // Actions
  openWizard: (mode: WizardMode, plan?: TrainingPlan) => void;
  closeWizard: () => void;
  setStep: (step: WizardStep) => void;
  setBuddyDocked: (docked: boolean) => void;
  updateMeta: (field: 'name' | 'splitType' | 'daysPerWeek' | 'notes', value: string | number) => void;
  updateDay: (dayIndex: number, updates: Partial<WizardDay>) => void;
  addExerciseToDay: (dayIndex: number, exercise: PlanExercise) => void;
  removeExerciseFromDay: (dayIndex: number, exerciseIndex: number) => void;
  reorderExerciseInDay: (dayIndex: number, fromIndex: number, toIndex: number) => void;
  populateFromBuddy: (actionData: BuddyPlanData) => void;
  goToStep2: () => void;
  saveWizard: () => Promise<string | undefined>;
}

/** Data shape coming from the buddy's save_training_plan action */
export interface BuddyPlanData {
  name?: string;
  split_type?: SplitType;
  days_per_week?: number;
  notes?: string;
  days?: {
    day_number: number;
    name: string;
    focus?: string;
    exercises?: PlanExercise[];
    notes?: string;
  }[];
}

const PlanWizardContext = createContext<PlanWizardContextType | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function PlanWizardProvider({ children }: { children: ReactNode }) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const queryClient = useQueryClient();
  const addPlan = useAddTrainingPlan();
  const updatePlan = useUpdateTrainingPlan();

  // Wizard state
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<WizardMode>('create');
  const [step, setStepState] = useState<WizardStep>(1);
  const [buddyDocked, setBuddyDockedState] = useState(false);

  // Form data
  const [planId, setPlanId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('upper_lower');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [notes, setNotes] = useState('');
  const [days, setDays] = useState<WizardDay[]>([]);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setPlanId(null);
    setName('');
    setSplitType('upper_lower');
    setDaysPerWeek(4);
    setNotes('');
    setDays([]);
    setStepState(1);
    setError(null);
    setIsSaving(false);
  }, []);

  const openWizard = useCallback((wizardMode: WizardMode, plan?: TrainingPlan) => {
    resetForm();
    setMode(wizardMode);

    if (wizardMode === 'edit' && plan) {
      setPlanId(plan.id);
      setName(plan.name);
      setSplitType(plan.split_type);
      setDaysPerWeek(plan.days_per_week);
      setNotes(plan.notes ?? '');
      if (plan.days && plan.days.length > 0) {
        setDays(plan.days.map((d) => ({
          day_number: d.day_number,
          name: d.name,
          focus: d.focus ?? '',
          exercises: d.exercises ?? [],
          notes: d.notes ?? '',
        })));
      }
    }

    setIsActive(true);
  }, [resetForm]);

  const closeWizard = useCallback(() => {
    setIsActive(false);
    setBuddyDockedState(false);
    resetForm();
  }, [resetForm]);

  const setStep = useCallback((s: WizardStep) => {
    setStepState(s);
  }, []);

  const setBuddyDocked = useCallback((docked: boolean) => {
    setBuddyDockedState(docked);
  }, []);

  const updateMeta = useCallback((field: 'name' | 'splitType' | 'daysPerWeek' | 'notes', value: string | number) => {
    switch (field) {
      case 'name': setName(value as string); break;
      case 'splitType': setSplitType(value as SplitType); break;
      case 'daysPerWeek': setDaysPerWeek(value as number); break;
      case 'notes': setNotes(value as string); break;
    }
  }, []);

  const updateDay = useCallback((dayIndex: number, updates: Partial<WizardDay>) => {
    setDays((prev) => prev.map((d, i) => i === dayIndex ? { ...d, ...updates } : d));
  }, []);

  const addExerciseToDay = useCallback((dayIndex: number, exercise: PlanExercise) => {
    setDays((prev) => prev.map((d, i) =>
      i === dayIndex ? { ...d, exercises: [...d.exercises, exercise] } : d
    ));
  }, []);

  const removeExerciseFromDay = useCallback((dayIndex: number, exerciseIndex: number) => {
    setDays((prev) => prev.map((d, i) =>
      i === dayIndex ? { ...d, exercises: d.exercises.filter((_, ei) => ei !== exerciseIndex) } : d
    ));
  }, []);

  const reorderExerciseInDay = useCallback((dayIndex: number, fromIndex: number, toIndex: number) => {
    setDays((prev) => prev.map((d, i) => {
      if (i !== dayIndex) return d;
      const arr = [...d.exercises];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      return { ...d, exercises: arr };
    }));
  }, []);

  /** Transition from Step 1 to Step 2: generate default days if none exist */
  const goToStep2 = useCallback(() => {
    if (days.length === 0 || days.length !== daysPerWeek) {
      const defaultNames = getDefaultDayNames(splitType, daysPerWeek, isDE);
      setDays(defaultNames.map((dayName, i) => ({
        day_number: i + 1,
        name: dayName,
        focus: '',
        exercises: days[i]?.exercises ?? [],
        notes: days[i]?.notes ?? '',
      })));
    }
    setStepState(2);
  }, [days, daysPerWeek, splitType, isDE]);

  /** Populate wizard form from buddy action data */
  const populateFromBuddy = useCallback((data: BuddyPlanData) => {
    if (data.name) setName(data.name);
    if (data.split_type) setSplitType(data.split_type);
    if (data.days_per_week) setDaysPerWeek(data.days_per_week);
    if (data.notes) setNotes(data.notes);

    if (data.days && data.days.length > 0) {
      setDays(data.days.map((d) => ({
        day_number: d.day_number,
        name: d.name,
        focus: d.focus ?? '',
        exercises: d.exercises ?? [],
        notes: d.notes ?? '',
      })));
      // Jump to step 2 so user can see the exercises
      setStepState(2);
    }
  }, []);

  /** Save the wizard: create or update depending on mode */
  const saveWizard = useCallback(async (): Promise<string | undefined> => {
    setError(null);
    setIsSaving(true);

    try {
      if (mode === 'create') {
        const result = await addPlan.mutateAsync({
          name: name.trim() || (isDE ? 'Neuer Plan' : 'New Plan'),
          split_type: splitType,
          days_per_week: daysPerWeek,
          notes: notes.trim() || undefined,
          days: days.map((d) => ({
            day_number: d.day_number,
            name: d.name.trim() || `${isDE ? 'Tag' : 'Day'} ${d.day_number}`,
            focus: d.focus.trim() || undefined,
            exercises: d.exercises,
            notes: d.notes.trim() || undefined,
          })),
        });
        closeWizard();
        return result.id;
      } else if (mode === 'edit' && planId) {
        // Update metadata
        await updatePlan.mutateAsync({
          id: planId,
          name: name.trim() || undefined,
          split_type: splitType,
          days_per_week: daysPerWeek,
          notes: notes.trim() || undefined,
        });

        // Update each day's exercises via direct supabase call
        const { supabase } = await import('../../../lib/supabase');
        for (const day of days) {
          // Find existing day by plan_id + day_number
          const { data: existingDay } = await supabase
            .from('training_plan_days')
            .select('id')
            .eq('plan_id', planId)
            .eq('day_number', day.day_number)
            .maybeSingle();

          if (existingDay) {
            await supabase
              .from('training_plan_days')
              .update({
                name: day.name,
                focus: day.focus || null,
                exercises: day.exercises,
                notes: day.notes || null,
              })
              .eq('id', existingDay.id);
          }
        }

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['training_plans'] });
        queryClient.invalidateQueries({ queryKey: ['training_plans', 'active'] });
        queryClient.invalidateQueries({ queryKey: ['training_plans', 'detail', planId] });
        closeWizard();
        return planId;
      }
    } catch (err) {
      console.error('[PlanWizard] Save failed:', err);
      setError(isDE
        ? 'Speichern fehlgeschlagen. Bitte erneut versuchen.'
        : 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
    return undefined;
  }, [mode, planId, name, splitType, daysPerWeek, notes, days, isDE, addPlan, updatePlan, queryClient, closeWizard]);

  /** Add a single day to the wizard from buddy */
  const addDayFromBuddy = useCallback((data: unknown) => {
    const d = data as { day_number: number; name: string; focus?: string; exercises?: PlanExercise[]; notes?: string };
    setDays(prev => {
      // Check if day_number already exists — if so, replace it
      const exists = prev.some(day => day.day_number === d.day_number);
      if (exists) {
        return prev.map(day => day.day_number === d.day_number
          ? { day_number: d.day_number, name: d.name, focus: d.focus ?? '', exercises: d.exercises ?? [], notes: d.notes ?? '' }
          : day
        );
      }
      return [...prev, { day_number: d.day_number, name: d.name, focus: d.focus ?? '', exercises: d.exercises ?? [], notes: d.notes ?? '' }];
    });
    setStepState(2);
  }, []);

  /** Modify exercises of an existing day in the wizard */
  const modifyDayFromBuddy = useCallback((data: unknown) => {
    const d = data as { day_number: number; name?: string; focus?: string; exercises: PlanExercise[] };
    setDays(prev => prev.map(day =>
      day.day_number === d.day_number
        ? { ...day, exercises: d.exercises, ...(d.name && { name: d.name }), ...(d.focus !== undefined && { focus: d.focus }) }
        : day
    ));
  }, []);

  /** Remove a day from the wizard */
  const removeDayFromBuddy = useCallback((data: unknown) => {
    const d = data as { day_number: number };
    setDays(prev => prev.filter(day => day.day_number !== d.day_number));
  }, []);

  // Register/unregister the wizard action interceptor
  const { setWizardActionInterceptor } = useInlineBuddyChat();

  useEffect(() => {
    if (isActive) {
      setWizardActionInterceptor((actionType: string, actionData: unknown) => {
        switch (actionType) {
          case 'save_training_plan':
            populateFromBuddy(actionData as BuddyPlanData);
            return true;
          case 'add_training_day':
            addDayFromBuddy(actionData);
            return true;
          case 'modify_training_day':
            modifyDayFromBuddy(actionData);
            return true;
          case 'remove_training_day':
            removeDayFromBuddy(actionData);
            return true;
          default:
            return false;
        }
      });
    } else {
      setWizardActionInterceptor(null);
    }
    return () => setWizardActionInterceptor(null);
  }, [isActive, populateFromBuddy, addDayFromBuddy, modifyDayFromBuddy, removeDayFromBuddy, setWizardActionInterceptor]);

  return (
    <PlanWizardContext.Provider
      value={{
        isActive, mode, step, buddyDocked,
        planId, name, splitType, daysPerWeek, notes, days,
        isSaving, error,
        openWizard, closeWizard, setStep, setBuddyDocked,
        updateMeta, updateDay, addExerciseToDay, removeExerciseFromDay,
        reorderExerciseInDay, populateFromBuddy, goToStep2, saveWizard,
      }}
    >
      {children}
    </PlanWizardContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePlanWizard(): PlanWizardContextType {
  const ctx = useContext(PlanWizardContext);
  if (!ctx) {
    throw new Error('usePlanWizard must be used within PlanWizardProvider');
  }
  return ctx;
}
