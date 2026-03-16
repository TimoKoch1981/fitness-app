/**
 * PhaseCyclePlanner — Manages automated phase cycling (Bulk→Cut→Maint→Repeat).
 * Features:
 * - Create from template or custom
 * - Visual timeline of phases
 * - Edit phase order, add/remove phases, adjust durations
 * - Activate/deactivate cycle
 * - Advance to next phase manually
 */

import { useState, useMemo } from 'react';
import {
  X, ChevronRight, ChevronLeft, Play, Pause, SkipForward,
  Plus, Trash2, RotateCcw, Check, Copy,
  TrendingUp, TrendingDown, Minus, Zap, RotateCcw as ReverseIcon, Sun,
} from 'lucide-react';
import { useTranslation } from '../../../../i18n';
import {
  usePhaseCycles,
  useActivePhaseCycle,
  useCreatePhaseCycle,
  useActivatePhaseCycle,
  useDeactivatePhaseCycle,
  useAdvancePhase,
  useUpdatePhaseCycle,
  useDeletePhaseCycle,
} from '../../hooks/usePhaseCycles';
import { CYCLE_TEMPLATES, type CyclePhaseEntry } from '../../types/phaseCycle';
import type { TrainingPhase } from '../../../../types/health';

// ---------------------------------------------------------------------------
// Phase config (reuse from PhaseProgressBar styling)
// ---------------------------------------------------------------------------

const PHASE_META: Record<TrainingPhase, {
  icon: typeof TrendingUp;
  emoji: string;
  color: string;
  bgColor: string;
  barColor: string;
  de: string;
  en: string;
}> = {
  bulk: { icon: TrendingUp, emoji: '💪', color: 'text-emerald-600', bgColor: 'bg-emerald-100', barColor: 'bg-emerald-500', de: 'Aufbau', en: 'Bulk' },
  cut: { icon: TrendingDown, emoji: '🔥', color: 'text-red-500', bgColor: 'bg-red-100', barColor: 'bg-red-500', de: 'Definition', en: 'Cut' },
  maintenance: { icon: Minus, emoji: '⚖️', color: 'text-blue-500', bgColor: 'bg-blue-100', barColor: 'bg-blue-500', de: 'Erhaltung', en: 'Maint.' },
  peak_week: { icon: Zap, emoji: '🏆', color: 'text-amber-600', bgColor: 'bg-amber-100', barColor: 'bg-amber-500', de: 'Peak Week', en: 'Peak Week' },
  reverse_diet: { icon: ReverseIcon, emoji: '📈', color: 'text-purple-500', bgColor: 'bg-purple-100', barColor: 'bg-purple-500', de: 'Reverse', en: 'Reverse' },
  off_season: { icon: Sun, emoji: '🌴', color: 'text-gray-500', bgColor: 'bg-gray-100', barColor: 'bg-gray-400', de: 'Off-Season', en: 'Off-Season' },
};

const ALL_PHASES: TrainingPhase[] = ['bulk', 'cut', 'maintenance', 'reverse_diet', 'peak_week', 'off_season'];

const WEEK_PRESETS: Record<TrainingPhase, number[]> = {
  bulk: [8, 12, 16, 20],
  cut: [6, 8, 12, 16],
  maintenance: [4, 8, 12],
  reverse_diet: [4, 6, 8],
  peak_week: [1],
  off_season: [4, 8, 12],
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PhaseCyclePlannerProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PhaseCyclePlanner({ open, onClose }: PhaseCyclePlannerProps) {
  const { language } = useTranslation();
  const de = language === 'de';

  const { data: cycles, isLoading } = usePhaseCycles();
  const { data: activeCycle } = useActivePhaseCycle();
  const createCycle = useCreatePhaseCycle();
  const activateCycle = useActivatePhaseCycle();
  const deactivateCycle = useDeactivatePhaseCycle();
  const advancePhase = useAdvancePhase();
  const updateCycle = useUpdatePhaseCycle();
  const deleteCycle = useDeletePhaseCycle();

  // View state
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);

  // Editor state
  const [editorName, setEditorName] = useState('');
  const [editorPhases, setEditorPhases] = useState<CyclePhaseEntry[]>([]);
  const [editorAutoRepeat, setEditorAutoRepeat] = useState(true);
  const [editorTemplate, setEditorTemplate] = useState<string | null>(null);
  const [addPhaseOpen, setAddPhaseOpen] = useState(false);

  // Confirm dialogs
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmAdvance, setConfirmAdvance] = useState(false);

  const totalWeeks = useMemo(
    () => editorPhases.reduce((sum, p) => sum + p.weeks, 0),
    [editorPhases]
  );

  if (!open) return null;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const startFromTemplate = (templateName: string) => {
    const tpl = CYCLE_TEMPLATES.find((t) => t.name === templateName);
    if (!tpl) return;
    setEditorName(de ? tpl.de : tpl.en);
    setEditorPhases([...tpl.phases]);
    setEditorAutoRepeat(tpl.auto_repeat);
    setEditorTemplate(templateName);
    setEditingCycleId(null);
    setView('create');
  };

  const startCustom = () => {
    setEditorName(de ? 'Mein Zyklus' : 'My Cycle');
    setEditorPhases([
      { phase: 'bulk', weeks: 12 },
      { phase: 'cut', weeks: 8 },
      { phase: 'maintenance', weeks: 4 },
    ]);
    setEditorAutoRepeat(true);
    setEditorTemplate(null);
    setEditingCycleId(null);
    setView('create');
  };

  const startEdit = (cycleId: string) => {
    const cycle = cycles?.find((c) => c.id === cycleId);
    if (!cycle) return;
    setEditorName(cycle.name);
    setEditorPhases([...cycle.phases]);
    setEditorAutoRepeat(cycle.auto_repeat);
    setEditorTemplate(cycle.template_name);
    setEditingCycleId(cycleId);
    setView('edit');
  };

  const handleSave = async () => {
    if (editorPhases.length === 0) return;

    if (editingCycleId) {
      await updateCycle.mutateAsync({
        id: editingCycleId,
        name: editorName,
        phases: editorPhases,
        auto_repeat: editorAutoRepeat,
      });
    } else {
      await createCycle.mutateAsync({
        name: editorName,
        phases: editorPhases,
        auto_repeat: editorAutoRepeat,
        template_name: editorTemplate ?? undefined,
        activate: true,
      });
    }
    setView('list');
  };

  const addPhaseEntry = (phase: TrainingPhase) => {
    const defaultWeeks = WEEK_PRESETS[phase][0];
    setEditorPhases((prev) => [...prev, { phase, weeks: defaultWeeks }]);
    setAddPhaseOpen(false);
  };

  const removePhaseEntry = (index: number) => {
    setEditorPhases((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePhaseWeeks = (index: number, weeks: number) => {
    setEditorPhases((prev) =>
      prev.map((p, i) => (i === index ? { ...p, weeks } : p))
    );
  };

  const movePhase = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= editorPhases.length) return;
    const arr = [...editorPhases];
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    setEditorPhases(arr);
  };

  const handleAdvance = async () => {
    if (!activeCycle) return;
    await advancePhase.mutateAsync(activeCycle);
    setConfirmAdvance(false);
  };

  const handleDelete = async (id: string) => {
    await deleteCycle.mutateAsync(id);
    setConfirmDelete(null);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-teal-600" />
            <h2 className="font-bold text-gray-900">
              {de ? 'Phasen-Zyklus-Planer' : 'Phase Cycle Planner'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="px-4 pb-6 pt-3">
          {/* ============================================================== */}
          {/* LIST VIEW */}
          {/* ============================================================== */}
          {view === 'list' && (
            <div className="space-y-4">
              {/* Active Cycle Banner */}
              {activeCycle && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-teal-900 text-sm">{activeCycle.name}</h3>
                      <p className="text-[10px] text-teal-600 mt-0.5">
                        {activeCycle.auto_repeat
                          ? (de ? 'Automatische Wiederholung' : 'Auto-repeat')
                          : (de ? 'Einmaliger Durchlauf' : 'Single run')}
                        {' · '}
                        {de ? 'Phase' : 'Phase'} {activeCycle.current_phase_index + 1}/{activeCycle.phases.length}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setConfirmAdvance(true)}
                        className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                        title={de ? 'Nächste Phase' : 'Next Phase'}
                      >
                        <SkipForward className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deactivateCycle.mutate()}
                        className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                        title={de ? 'Pausieren' : 'Pause'}
                      >
                        <Pause className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Phase Timeline */}
                  <PhaseTimeline
                    phases={activeCycle.phases}
                    currentIndex={activeCycle.current_phase_index}
                    de={de}
                  />
                </div>
              )}

              {/* Confirm Advance Dialog */}
              {confirmAdvance && activeCycle && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800 mb-3">
                    {de
                      ? `Zur nächsten Phase wechseln? Aktuelle Phase wird beendet.`
                      : `Switch to next phase? Current phase will end.`}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmAdvance(false)}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                    >
                      {de ? 'Abbrechen' : 'Cancel'}
                    </button>
                    <button
                      onClick={handleAdvance}
                      disabled={advancePhase.isPending}
                      className="flex-1 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {advancePhase.isPending
                        ? (de ? 'Wechsle...' : 'Switching...')
                        : (de ? 'Nächste Phase' : 'Next Phase')}
                    </button>
                  </div>
                </div>
              )}

              {/* Templates */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {de ? 'Vorlagen' : 'Templates'}
                </h3>
                <div className="space-y-2">
                  {CYCLE_TEMPLATES.map((tpl) => {
                    const totalW = tpl.phases.reduce((s, p) => s + p.weeks, 0);
                    return (
                      <button
                        key={tpl.name}
                        onClick={() => startFromTemplate(tpl.name)}
                        className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{tpl.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-900">
                              {de ? tpl.de : tpl.en}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {de ? tpl.description_de : tpl.description_en}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              {tpl.phases.map((p, i) => (
                                <span key={i} className="flex items-center gap-0.5">
                                  <span className={`inline-block w-2 h-2 rounded-full ${PHASE_META[p.phase].barColor}`} />
                                  <span className="text-[9px] text-gray-400">
                                    {de ? PHASE_META[p.phase].de : PHASE_META[p.phase].en}
                                  </span>
                                  {i < tpl.phases.length - 1 && (
                                    <ChevronRight className="h-2.5 w-2.5 text-gray-300" />
                                  )}
                                </span>
                              ))}
                              <span className="text-[9px] text-gray-400 ml-1">
                                ({totalW} {de ? 'Wo.' : 'wk'})
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </div>
                      </button>
                    );
                  })}

                  {/* Custom */}
                  <button
                    onClick={startCustom}
                    className="w-full text-left p-3 rounded-xl border border-dashed border-gray-300 hover:border-teal-400 hover:bg-teal-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Plus className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-gray-900">
                          {de ? 'Eigener Zyklus' : 'Custom Cycle'}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {de ? 'Phasen und Dauer frei zusammenstellen' : 'Freely configure phases and durations'}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Existing Cycles */}
              {cycles && cycles.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {de ? 'Gespeicherte Zyklen' : 'Saved Cycles'}
                  </h3>
                  <div className="space-y-2">
                    {cycles.filter(c => !c.is_active).map((cycle) => (
                      <div
                        key={cycle.id}
                        className="p-3 rounded-xl border border-gray-200 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-gray-900">{cycle.name}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => activateCycle.mutate(cycle.id)}
                              className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg"
                              title={de ? 'Aktivieren' : 'Activate'}
                            >
                              <Play className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => startEdit(cycle.id)}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                              title={de ? 'Bearbeiten' : 'Edit'}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(cycle.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                              title={de ? 'Löschen' : 'Delete'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <PhaseTimeline phases={cycle.phases} currentIndex={-1} de={de} compact />

                        {/* Confirm Delete */}
                        {confirmDelete === cycle.id && (
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium"
                            >
                              {de ? 'Abbrechen' : 'Cancel'}
                            </button>
                            <button
                              onClick={() => handleDelete(cycle.id)}
                              className="flex-1 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium"
                            >
                              {de ? 'Löschen' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full mx-auto" />
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* CREATE / EDIT VIEW */}
          {/* ============================================================== */}
          {(view === 'create' || view === 'edit') && (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {de ? 'Name' : 'Name'}
                </label>
                <input
                  type="text"
                  value={editorName}
                  onChange={(e) => setEditorName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>

              {/* Phases Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500">
                    {de ? 'Phasen-Reihenfolge' : 'Phase Order'}
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {totalWeeks} {de ? 'Wochen gesamt' : 'total weeks'}
                  </span>
                </div>

                <div className="space-y-2">
                  {editorPhases.map((entry, index) => {
                    const meta = PHASE_META[entry.phase];
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border ${meta.bgColor} border-gray-200`}
                      >
                        {/* Reorder buttons */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => movePhase(index, -1)}
                            disabled={index === 0}
                            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20"
                          >
                            <ChevronLeft className="h-3 w-3 rotate-90" />
                          </button>
                          <button
                            onClick={() => movePhase(index, 1)}
                            disabled={index === editorPhases.length - 1}
                            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20"
                          >
                            <ChevronRight className="h-3 w-3 rotate-90" />
                          </button>
                        </div>

                        {/* Phase info */}
                        <span className="text-lg">{meta.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900">
                            {de ? meta.de : meta.en}
                          </span>
                        </div>

                        {/* Duration selector */}
                        <div className="flex items-center gap-1">
                          {WEEK_PRESETS[entry.phase].map((w) => (
                            <button
                              key={w}
                              onClick={() => updatePhaseWeeks(index, w)}
                              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                                entry.weeks === w
                                  ? 'bg-teal-500 text-white'
                                  : 'bg-white/80 text-gray-600 hover:bg-white'
                              }`}
                            >
                              {w}{de ? 'W' : 'w'}
                            </button>
                          ))}
                          {/* Custom weeks input */}
                          <input
                            type="number"
                            min={1}
                            max={52}
                            value={entry.weeks}
                            onChange={(e) => updatePhaseWeeks(index, Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-10 px-1 py-1 text-center text-[10px] border border-gray-300 rounded bg-white"
                          />
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removePhaseEntry(index)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add Phase */}
                {!addPhaseOpen ? (
                  <button
                    onClick={() => setAddPhaseOpen(true)}
                    className="w-full mt-2 py-2 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    {de ? 'Phase hinzufügen' : 'Add Phase'}
                  </button>
                ) : (
                  <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-[10px] text-gray-500 mb-2">
                      {de ? 'Phase wählen:' : 'Select phase:'}
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {ALL_PHASES.map((p) => {
                        const meta = PHASE_META[p];
                        return (
                          <button
                            key={p}
                            onClick={() => addPhaseEntry(p)}
                            className={`flex flex-col items-center gap-0.5 p-2 rounded-lg ${meta.bgColor} hover:opacity-80 transition-opacity`}
                          >
                            <span className="text-base">{meta.emoji}</span>
                            <span className="text-[9px] font-medium text-gray-700">
                              {de ? meta.de : meta.en}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setAddPhaseOpen(false)}
                      className="mt-2 w-full py-1.5 text-xs text-gray-500 hover:text-gray-700"
                    >
                      {de ? 'Abbrechen' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>

              {/* Auto-Repeat Toggle */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {de ? 'Automatisch wiederholen' : 'Auto-repeat'}
                  </span>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {de
                      ? 'Nach der letzten Phase wieder von vorne beginnen'
                      : 'Start over after the last phase'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editorAutoRepeat}
                    onChange={(e) => setEditorAutoRepeat(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500" />
                </label>
              </div>

              {/* Timeline Preview */}
              {editorPhases.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    {de ? 'Vorschau' : 'Preview'}
                  </label>
                  <PhaseTimeline phases={editorPhases} currentIndex={-1} de={de} />
                  {editorAutoRepeat && (
                    <div className="flex items-center justify-center mt-1.5 text-[10px] text-teal-600">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      {de ? 'Wiederholt sich endlos' : 'Repeats infinitely'}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setView('list')}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {de ? 'Zurück' : 'Back'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={editorPhases.length === 0 || createCycle.isPending || updateCycle.isPending}
                  className="flex-1 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {createCycle.isPending || updateCycle.isPending
                    ? (de ? 'Speichern...' : 'Saving...')
                    : view === 'edit'
                      ? (de ? 'Aktualisieren' : 'Update')
                      : (de ? 'Erstellen & Aktivieren' : 'Create & Activate')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PhaseTimeline — Visual horizontal bar showing phase sequence
// ---------------------------------------------------------------------------

function PhaseTimeline({
  phases,
  currentIndex,
  de,
  compact = false,
}: {
  phases: CyclePhaseEntry[];
  currentIndex: number;
  de: boolean;
  compact?: boolean;
}) {
  const totalWeeks = phases.reduce((s, p) => s + p.weeks, 0);

  return (
    <div>
      {/* Bar */}
      <div className="flex rounded-full overflow-hidden h-3">
        {phases.map((p, i) => {
          const meta = PHASE_META[p.phase];
          const widthPct = totalWeeks > 0 ? (p.weeks / totalWeeks) * 100 : 100 / phases.length;
          const isCurrent = i === currentIndex;
          return (
            <div
              key={i}
              className={`${meta.barColor} ${isCurrent ? 'ring-2 ring-white ring-inset animate-pulse' : ''} relative`}
              style={{ width: `${Math.max(widthPct, 5)}%` }}
              title={`${de ? meta.de : meta.en}: ${p.weeks} ${de ? 'Wochen' : 'weeks'}`}
            >
              {isCurrent && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Labels */}
      {!compact && (
        <div className="flex mt-1.5">
          {phases.map((p, i) => {
            const meta = PHASE_META[p.phase];
            const widthPct = totalWeeks > 0 ? (p.weeks / totalWeeks) * 100 : 100 / phases.length;
            const isCurrent = i === currentIndex;
            return (
              <div
                key={i}
                className="text-center px-0.5"
                style={{ width: `${Math.max(widthPct, 5)}%` }}
              >
                <span className={`text-[9px] ${isCurrent ? 'font-bold text-teal-700' : 'text-gray-500'}`}>
                  {de ? meta.de : meta.en}
                </span>
                <br />
                <span className="text-[8px] text-gray-400">{p.weeks}W</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
