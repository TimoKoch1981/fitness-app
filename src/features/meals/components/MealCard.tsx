import { useState } from 'react';
import { Trash2, Pencil, Camera, Check, X, Calendar } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { Meal, MealType } from '../../../types/health';

interface MealCardProps {
  meal: Meal;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, updates: Partial<Pick<Meal, 'name' | 'calories' | 'protein' | 'carbs' | 'fat' | 'type' | 'date'>>) => void;
}

const mealTypeEmojis: Record<string, string> = {
  breakfast: '🌅',
  morning_snack: '☕',
  lunch: '☀️',
  afternoon_snack: '🍵',
  dinner: '🌙',
  snack: '🍪',
};

export function MealCard({ meal, onDelete, onEdit }: MealCardProps) {
  const { t } = useTranslation();
  const emoji = mealTypeEmojis[meal.type] ?? '🍽️';
  const typeLabel = t.meals[meal.type as keyof typeof t.meals] ?? meal.type;

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(meal.name);
  const [editDate, setEditDate] = useState(meal.date);
  const [editType, setEditType] = useState<MealType>(meal.type);
  const [editCalories, setEditCalories] = useState(String(meal.calories));
  const [editProtein, setEditProtein] = useState(String(meal.protein));
  const [editCarbs, setEditCarbs] = useState(String(meal.carbs));
  const [editFat, setEditFat] = useState(String(meal.fat));
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const mealTypes: { value: MealType; label: string }[] = [
    { value: 'breakfast', label: t.meals?.breakfast ?? 'Frühstück' },
    { value: 'morning_snack', label: t.meals?.morning_snack ?? 'Vormittag' },
    { value: 'lunch', label: t.meals?.lunch ?? 'Mittagessen' },
    { value: 'afternoon_snack', label: t.meals?.afternoon_snack ?? 'Nachmittag' },
    { value: 'dinner', label: t.meals?.dinner ?? 'Abendessen' },
    { value: 'snack', label: t.meals?.snack ?? 'Snack' },
  ];

  const handleStartEdit = () => {
    setEditName(meal.name);
    setEditDate(meal.date);
    setEditType(meal.type);
    setEditCalories(String(meal.calories));
    setEditProtein(String(meal.protein));
    setEditCarbs(String(meal.carbs));
    setEditFat(String(meal.fat));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (onEdit && editName.trim()) {
      onEdit(meal.id, {
        name: editName.trim(),
        calories: parseInt(editCalories) || 0,
        protein: parseFloat(editProtein) || 0,
        carbs: parseFloat(editCarbs) || 0,
        fat: parseFloat(editFat) || 0,
        ...(editDate !== meal.date ? { date: editDate } : {}),
        ...(editType !== meal.type ? { type: editType } : {}),
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (showConfirmDelete) {
      onDelete?.(meal.id);
      setShowConfirmDelete(false);
    } else {
      setShowConfirmDelete(true);
      // Auto-hide confirmation after 3s
      setTimeout(() => setShowConfirmDelete(false), 3000);
    }
  };

  // ── Edit mode ──
  if (isEditing) {
    return (
      <div className="bg-white rounded-xl p-3 shadow-sm space-y-2 border border-teal-200">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-teal-500 outline-none"
          autoFocus
        />
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-teal-500 outline-none"
          />
        </div>
        {/* Meal type selector */}
        <div className="flex flex-wrap gap-1">
          {mealTypes.map((mt) => (
            <button
              key={mt.value}
              type="button"
              onClick={() => setEditType(mt.value)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                editType === mt.value
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {mt.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="text-[9px] text-gray-400 block">kcal</label>
            <input
              type="number"
              value={editCalories}
              onChange={(e) => setEditCalories(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-teal-500"
              min="0"
            />
          </div>
          <div>
            <label className="text-[9px] text-gray-400 block">P (g)</label>
            <input
              type="number"
              value={editProtein}
              onChange={(e) => setEditProtein(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-teal-500"
              min="0" step="0.1"
            />
          </div>
          <div>
            <label className="text-[9px] text-gray-400 block">K (g)</label>
            <input
              type="number"
              value={editCarbs}
              onChange={(e) => setEditCarbs(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-teal-500"
              min="0" step="0.1"
            />
          </div>
          <div>
            <label className="text-[9px] text-gray-400 block">F (g)</label>
            <input
              type="number"
              value={editFat}
              onChange={(e) => setEditFat(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-teal-500"
              min="0" step="0.1"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleCancelEdit}
            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-3.5 w-3.5 inline mr-1" />
            Abbrechen
          </button>
          <button
            onClick={handleSaveEdit}
            className="px-3 py-1 text-xs bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            <Check className="h-3.5 w-3.5 inline mr-1" />
            Speichern
          </button>
        </div>
      </div>
    );
  }

  // ── View mode ──
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 relative">
      {/* Emoji */}
      <div className="text-2xl flex-shrink-0">{emoji}</div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{meal.name}</p>
        <p className="text-xs text-gray-400">{typeLabel}</p>
      </div>

      {/* Macros */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-gray-900">{meal.calories} kcal</p>
        <div className="flex gap-2 text-[10px] text-gray-400">
          <span>P: {meal.protein}g</span>
          <span>K: {meal.carbs}g</span>
          <span>F: {meal.fat}g</span>
        </div>
      </div>

      {/* Action buttons — always visible */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        {onEdit && (
          <button
            onClick={handleStartEdit}
            className="p-1 text-gray-300 hover:text-teal-500 transition-colors"
            title="Bearbeiten"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className={`p-1 transition-colors ${
              showConfirmDelete
                ? 'text-red-500'
                : 'text-gray-300 hover:text-red-500'
            }`}
            title={showConfirmDelete ? 'Nochmal klicken zum Löschen' : 'Löschen'}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Source indicator */}
      {meal.source === 'ai' && (
        <span className="text-[10px] text-amber-500 font-medium absolute top-1 right-1 flex items-center gap-0.5">
          <Camera className="h-2.5 w-2.5" />
          {t.common.estimated}
        </span>
      )}
    </div>
  );
}
