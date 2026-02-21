/**
 * Admin Products Page — CRUD for standard_products.
 * Admins can search, add, edit and delete products.
 */

import { useState } from 'react';
import { AdminNav } from '../../features/admin/components/AdminNav';
import {
  useAdminProducts,
  useAddProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../../features/admin/hooks/useAdminData';
import { useTranslation } from '../../i18n';
import type { ProductNutrition, ProductCategory } from '../../types/health';

const CATEGORIES: ProductCategory[] = [
  'grain', 'dairy', 'meat', 'fish', 'fruit', 'vegetable',
  'snack', 'beverage', 'supplement', 'general',
];

const EMPTY_PRODUCT: Omit<ProductNutrition, 'id'> = {
  name: '',
  brand: '',
  category: 'general',
  serving_size_g: 100,
  serving_label: '',
  calories_per_serving: 0,
  protein_per_serving: 0,
  carbs_per_serving: 0,
  fat_per_serving: 0,
  fiber_per_serving: 0,
};

export function AdminProductsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Partial<ProductNutrition> | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const { data: products, isLoading } = useAdminProducts(search);
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const handleSave = async () => {
    if (!editingProduct) return;

    try {
      if ('id' in editingProduct && editingProduct.id) {
        await updateProduct.mutateAsync(editingProduct as Partial<ProductNutrition> & { id: string });
      } else {
        await addProduct.mutateAsync(editingProduct as Omit<ProductNutrition, 'id'>);
      }
      setEditingProduct(null);
      setIsAdding(false);
    } catch {
      // Error handled by TanStack Query
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.admin.confirmDelete)) return;
    await deleteProduct.mutateAsync(id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{t.admin.products}</h2>
          <button
            onClick={() => {
              setEditingProduct({ ...EMPTY_PRODUCT });
              setIsAdding(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + {t.products.addProduct}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.products.searchProducts}
            className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>

        {/* Edit Modal */}
        {editingProduct && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {isAdding ? t.products.addProduct : t.products.editProduct}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600">{t.meals.name}</label>
                  <input
                    type="text"
                    value={editingProduct.name ?? ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev!, name: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">{t.products.brand}</label>
                  <input
                    type="text"
                    value={editingProduct.brand ?? ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev!, brand: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">{t.products.category}</label>
                  <select
                    value={editingProduct.category ?? 'general'}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev!, category: e.target.value as ProductCategory }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {t.products[`cat_${cat}` as keyof typeof t.products]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">{t.products.servingSize} (g)</label>
                  <input
                    type="number"
                    value={editingProduct.serving_size_g ?? 100}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev!, serving_size_g: Number(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">{t.products.servingLabel}</label>
                  <input
                    type="text"
                    value={editingProduct.serving_label ?? ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev!, serving_label: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                {/* Nutrition per serving */}
                <div className="col-span-2 pt-2">
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    {t.admin.nutritionPerServing}
                  </label>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">{t.meals.calories}</label>
                  <input
                    type="number"
                    value={editingProduct.calories_per_serving ?? 0}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev!, calories_per_serving: Number(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">{t.meals.protein} (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingProduct.protein_per_serving ?? 0}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev!, protein_per_serving: Number(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">{t.meals.carbs} (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingProduct.carbs_per_serving ?? 0}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev!, carbs_per_serving: Number(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">{t.meals.fat} (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingProduct.fat_per_serving ?? 0}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev!, fat_per_serving: Number(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setEditingProduct(null); setIsAdding(false); }}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!editingProduct.name?.trim()}
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {t.common.save}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : !products || products.length === 0 ? (
          <div className="bg-gray-100 text-gray-600 p-8 rounded-xl text-center text-sm">
            {search ? t.common.noData : t.products.noProducts}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                    <th className="px-4 py-3">{t.meals.name}</th>
                    <th className="px-4 py-3">{t.products.brand}</th>
                    <th className="px-4 py-3">{t.products.category}</th>
                    <th className="px-4 py-3 text-right">{t.meals.calories}</th>
                    <th className="px-4 py-3 text-right">{t.meals.protein}</th>
                    <th className="px-4 py-3 text-right">{t.meals.carbs}</th>
                    <th className="px-4 py-3 text-right">{t.meals.fat}</th>
                    <th className="px-4 py-3 text-right">{t.products.servingSize}</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 text-gray-600">{product.brand || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                          {t.products[`cat_${product.category}` as keyof typeof t.products] ?? product.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{product.calories_per_serving}</td>
                      <td className="px-4 py-3 text-right font-mono">{product.protein_per_serving}g</td>
                      <td className="px-4 py-3 text-right font-mono">{product.carbs_per_serving}g</td>
                      <td className="px-4 py-3 text-right font-mono">{product.fat_per_serving}g</td>
                      <td className="px-4 py-3 text-right text-gray-600">{product.serving_size_g}g</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setEditingProduct({ ...product }); setIsAdding(false); }}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                          >
                            {t.common.edit}
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                          >
                            {t.common.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500 border-t border-gray-100">
              {products.length} {t.admin.productsCount}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
