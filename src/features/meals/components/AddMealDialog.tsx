import { useState, useCallback } from 'react';
import { X, Sparkles, Loader2, Camera, ScanBarcode, Star } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddMeal } from '../hooks/useMeals';
import { useEstimateMealNutrition } from '../hooks/useEstimateMealNutrition';
import { useUserProducts, useAddUserProduct } from '../hooks/useProducts';
import { useMealFavorites, type MealFavorite } from '../hooks/useMealFavorites';
import { MealPhotoCapture } from './MealPhotoCapture';
import { BarcodeScanner, type BarcodeScanResult } from './BarcodeScanner';
import { today } from '../../../lib/utils';
import type { MealType } from '../../../types/health';
import type { MealPhotoAnalysisResult } from '../../../lib/ai/mealVision';
import type { BarcodeProduct } from '../../../services/openFoodFactsBarcode';

interface AddMealDialogProps {
  open: boolean;
  onClose: () => void;
  defaultType?: MealType;
  date?: string;
}

export function AddMealDialog({ open, onClose, defaultType = 'lunch', date }: AddMealDialogProps) {
  const { t, language } = useTranslation();
  const addMeal = useAddMeal();
  const { estimate, isEstimating, estimateError } = useEstimateMealNutrition();
  const { data: userProducts } = useUserProducts();
  const addUserProduct = useAddUserProduct();

  const [name, setName] = useState('');
  const [type, setType] = useState<MealType>(defaultType);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [error, setError] = useState('');
  const [isEstimated, setIsEstimated] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeSource, setBarcodeSource] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  const { data: favorites } = useMealFavorites();

  if (!open) return null;

  const handleSelectFavorite = (fav: MealFavorite) => {
    setName(fav.name);
    setType(fav.type);
    setCalories(String(fav.calories));
    setProtein(String(fav.protein));
    setCarbs(String(fav.carbs));
    setFat(String(fav.fat));
    setIsEstimated(false);
    setBarcodeSource(false);
    setShowFavorites(false);
  };

  const handlePhotoResult = (result: MealPhotoAnalysisResult) => {
    setName(result.name);
    setCalories(String(result.calories));
    setProtein(String(result.protein));
    setCarbs(String(result.carbs));
    setFat(String(result.fat));
    setIsEstimated(true);
    setShowPhotoCapture(false);
  };

  // ── Barcode Scanner ──────────────────────────────────────────────

  /** Look up a barcode in the user's product database */
  const lookupUserProductByBarcode = useCallback((barcode: string): BarcodeProduct | null => {
    if (!userProducts) return null;
    const match = userProducts.find((p) => p.barcode === barcode);
    if (!match) return null;
    return {
      name: match.name,
      brand: match.brand ?? '',
      calories: match.calories_per_serving,
      protein: match.protein_per_serving,
      carbs: match.carbs_per_serving,
      fat: match.fat_per_serving,
      fiber: match.fiber_per_serving ?? 0,
      serving_size_g: match.serving_size_g,
      barcode,
      image_url: null,
    };
  }, [userProducts]);

  /** Handle accepted barcode scan result */
  const handleBarcodeResult = useCallback(async (result: BarcodeScanResult) => {
    const { product, fromUserProducts } = result;
    setName(product.name + (product.brand ? ` (${product.brand})` : ''));
    setCalories(String(product.calories));
    setProtein(String(product.protein));
    setCarbs(String(product.carbs));
    setFat(String(product.fat));
    setIsEstimated(true);
    setBarcodeSource(true);
    setShowBarcodeScanner(false);

    // Save to user_products if not already from DB
    if (!fromUserProducts && product.barcode) {
      try {
        await addUserProduct.mutateAsync({
          name: product.name,
          brand: product.brand || undefined,
          barcode: product.barcode,
          serving_size_g: product.serving_size_g,
          calories_per_serving: product.calories,
          protein_per_serving: product.protein,
          carbs_per_serving: product.carbs,
          fat_per_serving: product.fat,
          fiber_per_serving: product.fiber || undefined,
          source: 'open-food-facts',
          source_ref: product.barcode,
        });
      } catch {
        // Non-critical — product was still used for the meal form
        console.warn('[AddMealDialog] Failed to save barcode product to user_products');
      }
    }
  }, [addUserProduct]);

  const handleEstimate = async () => {
    if (!name.trim()) return;
    const result = await estimate(name, language);
    if (result) {
      setCalories(String(result.calories));
      setProtein(String(result.protein));
      setCarbs(String(result.carbs));
      setFat(String(result.fat));
      setIsEstimated(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !calories) return;
    setError('');

    try {
      await addMeal.mutateAsync({
        date: date ?? today(),
        name,
        type,
        calories: parseInt(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        ...(barcodeSource
          ? { source: 'barcode' as const }
          : isEstimated
            ? { source: 'ai' as const }
            : {}),
      });

      // Reset and close
      setName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setIsEstimated(false);
      setBarcodeSource(false);
      onClose();
    } catch {
      setError(t.common.saveError);
    }
  };

  const mealTypes: { value: MealType; label: string }[] = [
    { value: 'breakfast', label: t.meals.breakfast },
    { value: 'morning_snack', label: t.meals.morning_snack },
    { value: 'lunch', label: t.meals.lunch },
    { value: 'afternoon_snack', label: t.meals.afternoon_snack },
    { value: 'dinner', label: t.meals.dinner },
    { value: 'snack', label: t.meals.snack },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{t.meals.addMeal}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Meal Type Selector */}
          <div className="flex gap-2">
            {mealTypes.map((mt) => (
              <button
                key={mt.value}
                type="button"
                onClick={() => setType(mt.value)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                  type === mt.value
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {mt.label}
              </button>
            ))}
          </div>

          {/* Favorites Section */}
          <div>
            <button
              type="button"
              onClick={() => setShowFavorites(!showFavorites)}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                showFavorites
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-50 text-gray-600 hover:bg-amber-50 hover:text-amber-600'
              }`}
            >
              <Star className={`h-4 w-4 ${showFavorites ? 'fill-amber-400' : ''}`} />
              {t.meals.favorites}
            </button>
            {showFavorites && (
              <div className="mt-2 bg-gray-50 rounded-lg p-2 max-h-48 overflow-y-auto">
                {favorites && favorites.length > 0 ? (
                  <div className="space-y-1">
                    {favorites.map((fav, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectFavorite(fav)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 truncate">{fav.name}</p>
                          <p className="text-[10px] text-gray-400">
                            {fav.calories} kcal &middot; {fav.protein}g P &middot; {fav.carbs}g C &middot; {fav.fat}g F
                          </p>
                        </div>
                        <span className="text-[10px] text-gray-300 ml-2 flex-shrink-0">
                          {fav.frequency}x
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-3">
                    {t.meals.noFavorites}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Photo Capture Section */}
          {showPhotoCapture && (
            <MealPhotoCapture
              onAccept={handlePhotoResult}
              onClose={() => setShowPhotoCapture(false)}
            />
          )}

          {/* Barcode Scanner Section */}
          {showBarcodeScanner && (
            <BarcodeScanner
              onAccept={handleBarcodeResult}
              onClose={() => setShowBarcodeScanner(false)}
              onLookupUserProduct={lookupUserProductByBarcode}
            />
          )}

          {/* Name + AI Estimate + Photo + Barcode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.meals.name}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setIsEstimated(false); }}
                placeholder={language === 'de' ? 'z.B. Hähnchenbrust mit Reis' : 'e.g. Chicken breast with rice'}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                required
                autoFocus
              />
              {/* Barcode button */}
              <button
                type="button"
                onClick={() => { setShowBarcodeScanner(!showBarcodeScanner); if (showPhotoCapture) setShowPhotoCapture(false); }}
                className={`flex items-center gap-1.5 px-3 py-2 text-white text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                  showBarcodeScanner
                    ? 'bg-teal-600'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700'
                }`}
                title={language === 'de' ? 'Barcode scannen' : 'Scan barcode'}
              >
                <ScanBarcode className="h-4 w-4" />
              </button>
              {/* Photo button */}
              <button
                type="button"
                onClick={() => { setShowPhotoCapture(!showPhotoCapture); if (showBarcodeScanner) setShowBarcodeScanner(false); }}
                className={`flex items-center gap-1.5 px-3 py-2 text-white text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                  showPhotoCapture
                    ? 'bg-teal-600'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700'
                }`}
                title={language === 'de' ? 'Mahlzeit per Foto erfassen' : 'Log meal by photo'}
              >
                <Camera className="h-4 w-4" />
              </button>
              {/* AI text estimate button */}
              <button
                type="button"
                onClick={handleEstimate}
                disabled={isEstimating || !name.trim()}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-medium rounded-lg hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 transition-all whitespace-nowrap"
                title={language === 'de' ? 'KI-Schätzung der Nährwerte' : 'AI nutrition estimate'}
              >
                {isEstimating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {language === 'de' ? 'KI' : 'AI'}
              </button>
            </div>
            {estimateError && (
              <p className="text-[10px] text-red-400 mt-1">{estimateError}</p>
            )}
            {isEstimated && !estimateError && (
              <p className={`text-[10px] mt-1 ${barcodeSource ? 'text-teal-500' : 'text-violet-500'}`}>
                {barcodeSource
                  ? (language === 'de' ? 'Barcode-Daten — bitte prüfen & anpassen' : 'Barcode data — please review & adjust')
                  : (language === 'de' ? 'KI-Schätzung — bitte prüfen & anpassen' : 'AI estimate — please review & adjust')}
              </p>
            )}
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.meals.calories} (kcal)
              </label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm ${
                  isEstimated ? (barcodeSource ? 'border-teal-300 bg-teal-50' : 'border-violet-300 bg-violet-50') : 'border-gray-300'
                }`}
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.meals.protein} (g)
              </label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm ${
                  isEstimated ? (barcodeSource ? 'border-teal-300 bg-teal-50' : 'border-violet-300 bg-violet-50') : 'border-gray-300'
                }`}
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.meals.carbs} (g)
              </label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm ${
                  isEstimated ? (barcodeSource ? 'border-teal-300 bg-teal-50' : 'border-violet-300 bg-violet-50') : 'border-gray-300'
                }`}
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.meals.fat} (g)
              </label>
              <input
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm ${
                  isEstimated ? (barcodeSource ? 'border-teal-300 bg-teal-50' : 'border-violet-300 bg-violet-50') : 'border-gray-300'
                }`}
                min="0"
                step="0.1"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={addMeal.isPending || !name || !calories}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
          >
            {addMeal.isPending ? t.common.loading : t.common.save}
          </button>
        </form>
      </div>
    </div>
  );
}
