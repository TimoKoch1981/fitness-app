/**
 * EquipmentSelector — Checkbox-Grid with category filters + Gym Profile Dropdown.
 * Used in ProfilePage to let users select their available equipment.
 */

import { useState, useEffect, useMemo } from 'react';
import { Save, Check, ChevronDown } from 'lucide-react';
import {
  useEquipmentCatalog,
  useGymProfiles,
  useUserEquipment,
  useSetUserEquipment,
} from '../hooks/useEquipment';
import { useTranslation } from '../../../i18n';
import type { EquipmentCategory } from '../../../types/health';

const CATEGORY_ORDER: EquipmentCategory[] = [
  'free_weight', 'machine', 'cable', 'bodyweight', 'cardio', 'other',
];

export function EquipmentSelector() {
  const { t, language } = useTranslation();
  const { data: catalog, isLoading: loadingCatalog } = useEquipmentCatalog();
  const { data: gymProfiles } = useGymProfiles();
  const { data: userEquip, isLoading: loadingUser } = useUserEquipment();
  const setEquipment = useSetUserEquipment();

  // Local state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<EquipmentCategory | 'all'>('all');
  const [saved, setSaved] = useState(false);

  // Sync from DB
  useEffect(() => {
    if (userEquip) {
      setSelectedIds(new Set(userEquip.equipment_ids));
      setSelectedProfile(userEquip.gym_profile_id ?? '');
    }
  }, [userEquip]);

  // Group equipment by category
  const grouped = useMemo(() => {
    if (!catalog) return {};
    const groups: Partial<Record<EquipmentCategory, typeof catalog>> = {};
    for (const item of catalog) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category]!.push(item);
    }
    return groups;
  }, [catalog]);

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelectedProfile(''); // clear profile when manually toggling
  };

  const applyProfile = (profileId: string) => {
    const profile = gymProfiles?.find(p => p.id === profileId);
    if (profile) {
      setSelectedIds(new Set(profile.equipment_ids));
      setSelectedProfile(profileId);
    }
  };

  const selectAll = () => {
    if (catalog) setSelectedIds(new Set(catalog.map(e => e.id)));
    setSelectedProfile('');
  };

  const clearAll = () => {
    setSelectedIds(new Set());
    setSelectedProfile('');
  };

  const handleSave = async () => {
    await setEquipment.mutateAsync({
      equipment_ids: Array.from(selectedIds),
      gym_profile_id: selectedProfile || null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const categoryLabel = (cat: EquipmentCategory): string => {
    return t.equipment[`cat_${cat}` as keyof typeof t.equipment] ?? cat;
  };

  const isLoading = loadingCatalog || loadingUser;

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500" />
      </div>
    );
  }

  const filteredCategories = filterCategory === 'all'
    ? CATEGORY_ORDER.filter(cat => grouped[cat]?.length)
    : [filterCategory].filter(cat => grouped[cat]?.length);

  return (
    <div className="space-y-3">
      {/* Gym Profile Dropdown */}
      {gymProfiles && gymProfiles.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {t.equipment.gymProfile}
          </label>
          <div className="relative">
            <select
              value={selectedProfile}
              onChange={(e) => {
                if (e.target.value) applyProfile(e.target.value);
              }}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm bg-white appearance-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            >
              <option value="">{t.equipment.customSelection}</option>
              {gymProfiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.description}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
            filterCategory === 'all'
              ? 'bg-teal-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.equipment.allCategories} ({catalog?.length ?? 0})
        </button>
        {CATEGORY_ORDER.filter(cat => grouped[cat]?.length).map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
              filterCategory === cat
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {categoryLabel(cat)} ({grouped[cat]?.length ?? 0})
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 text-xs">
        <button
          onClick={selectAll}
          className="text-teal-600 hover:text-teal-700 font-medium"
        >
          {t.equipment.selectAll}
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={clearAll}
          className="text-gray-500 hover:text-gray-700 font-medium"
        >
          {t.equipment.clearAll}
        </button>
        <span className="ml-auto text-gray-400">
          {selectedIds.size} {t.equipment.selected}
        </span>
      </div>

      {/* Equipment Grid */}
      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
        {filteredCategories.map(cat => (
          <div key={cat}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              {categoryLabel(cat)}
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {grouped[cat]?.map(item => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm transition-all ${
                      isSelected
                        ? 'bg-teal-50 border border-teal-300 text-teal-800'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{item.icon ?? '🔧'}</span>
                    <span className="flex-1 min-w-0 truncate text-xs">
                      {language === 'en' && item.name_en ? item.name_en : item.name}
                    </span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={setEquipment.isPending}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          saved
            ? 'bg-green-500 text-white'
            : 'bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50'
        }`}
      >
        {saved ? (
          <>
            <Check className="h-4 w-4" />
            {t.equipment.saved}
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            {t.equipment.saveEquipment}
          </>
        )}
      </button>
    </div>
  );
}
