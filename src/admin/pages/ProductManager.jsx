import React, { useState } from 'react';
import { Package, Plus, Edit2, Archive, Check, X, Search, Filter, RefreshCw, AlertTriangle } from 'lucide-react';
import { getProducts, saveProduct, archiveProduct } from '../../lib/storage';
import { useAsyncData } from '../../lib/useAsyncData';

export function ProductManager() {
  const { data: products, loading, error, reload } = useAsyncData(getProducts, []);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [busy, setBusy] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newModel, setNewModel] = useState({
    id: '',
    model: '',
    baseModel: '',
    category: 'Smartphone',
    series: 'A',
    dpSlab: '20k-30k',
    dp: 25000,
    flagship: false,
    status: 'Active'
  });

  const handleStartEdit = (p) => {
    setEditingId(p.id);
    setEditForm({ ...p });
  };

  const handleSaveEdit = async () => {
    setBusy(true);
    try {
      await saveProduct(editForm);
      setEditingId(null);
      reload();
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = async (product) => {
    if (!confirm('Are you sure you want to archive this model?')) return;
    setBusy(true);
    try {
      await archiveProduct(product);
      reload();
    } finally {
      setBusy(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const finalId = newModel.id || `${newModel.baseModel || newModel.model.replaceAll(' ', '-')}-${Date.now().toString(36)}`;
      await saveProduct({ ...newModel, id: finalId });
      setShowAddModal(false);
      setNewModel({
        id: '',
        model: '',
        baseModel: '',
        category: 'Smartphone',
        series: 'A',
        dpSlab: '20k-30k',
        dp: 25000,
        flagship: false,
        status: 'Active'
      });
      reload();
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-950/60 border border-red-800/60 rounded-2xl text-red-300 text-sm flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" /> {error}
      </div>
    );
  }

  const filtered = products.filter((p) => {
    if (!showArchived && p.status === 'Archived') return false;
    if (filterCategory !== 'All' && p.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.model.toLowerCase().includes(q) || (p.baseModel && p.baseModel.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" /> Product & DP Master
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage SKUs, base models, DP pricing, and DP slabs.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-900/50 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Model
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Smartphone">Smartphones</option>
            <option value="Wearable">Wearables</option>
            <option value="Tablet">Tablets</option>
            <option value="Notebook">Notebooks</option>
          </select>

          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            Show Archived
          </label>
        </div>
      </div>

      {/* Product Cards (mobile) */}
      <div className="md:hidden space-y-3">
        {filtered.map((p) => {
          const isEditing = editingId === p.id;
          return (
            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              {isEditing ? (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Model Name</label>
                    <input
                      type="text"
                      value={editForm.model}
                      onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Base Model</label>
                    <input
                      type="text"
                      value={editForm.baseModel || ''}
                      onChange={(e) => setEditForm({ ...editForm, baseModel: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-sm text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">DP Slab</label>
                      <input
                        type="text"
                        placeholder="e.g. 20k-30k"
                        value={editForm.dpSlab || ''}
                        onChange={(e) => setEditForm({ ...editForm, dpSlab: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">DP Price</label>
                      <input
                        type="number"
                        placeholder="e.g. 25000"
                        value={editForm.dp || ''}
                        onChange={(e) => setEditForm({ ...editForm, dp: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-sm text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button onClick={() => setEditingId(null)} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5">
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button onClick={handleSaveEdit} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-white text-sm truncate">{p.model} {p.flagship ? '⭐' : ''}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{p.baseModel || '—'}</div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleStartEdit(p)} className="p-1.5 text-slate-400 hover:text-indigo-300 transition">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {p.status !== 'Archived' && (
                        <button onClick={() => handleArchive(p)} className="p-1.5 text-slate-400 hover:text-red-400 transition">
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{p.category}</span>
                    {(p.series || p.subCategory) && <span className="text-slate-400">{p.series || p.subCategory}</span>}
                    <span className="text-indigo-300 font-semibold">
                      {p.dpSlab ? `Slab: ${p.dpSlab}` : p.dp ? `₹${p.dp.toLocaleString()}` : '—'}
                    </span>
                    <span className={`ml-auto px-2 py-0.5 rounded-full font-bold ${p.status === 'Archived' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                      {p.status || 'Active'}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-xs text-slate-500 py-8">No models match your filters.</p>
        )}
      </div>

      {/* Product Table (desktop) */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Model Name</th>
                <th className="px-4 py-3">Base Model</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Series / SubCat</th>
                <th className="px-4 py-3">DP Slab / Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((p) => {
                const isEditing = editingId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-semibold text-white">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.model}
                          onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                          className="bg-slate-800 border border-slate-700 px-2 py-1 rounded text-xs text-white"
                        />
                      ) : (
                        <span>{p.model} {p.flagship ? '⭐' : ''}</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.baseModel || ''}
                          onChange={(e) => setEditForm({ ...editForm, baseModel: e.target.value })}
                          className="bg-slate-800 border border-slate-700 px-2 py-1 rounded text-xs text-white"
                        />
                      ) : (
                        p.baseModel || '—'
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                        {p.category}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-400">
                      {p.series || p.subCategory || '—'}
                    </td>

                    <td className="px-4 py-3 font-semibold text-indigo-300">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="DP Slab"
                            value={editForm.dpSlab || ''}
                            onChange={(e) => setEditForm({ ...editForm, dpSlab: e.target.value })}
                            className="bg-slate-800 border border-slate-700 px-2 py-1 rounded text-xs text-white w-24"
                          />
                          <input
                            type="number"
                            placeholder="DP Price"
                            value={editForm.dp || ''}
                            onChange={(e) => setEditForm({ ...editForm, dp: parseInt(e.target.value) || 0 })}
                            className="bg-slate-800 border border-slate-700 px-2 py-1 rounded text-xs text-white w-24"
                          />
                        </div>
                      ) : (
                        p.dpSlab ? `Slab: ${p.dpSlab}` : p.dp ? `₹${p.dp.toLocaleString()}` : '—'
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'Archived' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                        {p.status || 'Active'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={handleSaveEdit} className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1 bg-slate-700 hover:bg-slate-600 text-white rounded">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleStartEdit(p)} className="p-1 text-slate-400 hover:text-indigo-300 transition">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {p.status !== 'Archived' && (
                            <button onClick={() => handleArchive(p)} className="p-1 text-slate-400 hover:text-red-400 transition">
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Add New Product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" /> Add New Model / SKU
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Model Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Galaxy A58 5G 8GB/128GB"
                  value={newModel.model}
                  onChange={(e) => setNewModel({ ...newModel, model: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Base Model Key</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. A58"
                    value={newModel.baseModel}
                    onChange={(e) => setNewModel({ ...newModel, baseModel: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newModel.category}
                    onChange={(e) => setNewModel({ ...newModel, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
                  >
                    <option value="Smartphone">Smartphone</option>
                    <option value="Wearable">Wearable</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Notebook">Notebook</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Series / Sub-Category</label>
                  <input
                    type="text"
                    placeholder="e.g. A or Watch"
                    value={newModel.series}
                    onChange={(e) => setNewModel({ ...newModel, series: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">DP Slab (Smartphones)</label>
                  <select
                    value={newModel.dpSlab}
                    onChange={(e) => setNewModel({ ...newModel, dpSlab: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
                  >
                    <option value="10k-15k">10k-15k</option>
                    <option value="15k-20k">15k-20k</option>
                    <option value="20k-30k">20k-30k</option>
                    <option value="30k-40k">30k-40k</option>
                    <option value="40k+">40k+</option>
                    <option value="70k-100k">70k-100k (Flagship)</option>
                    <option value="100k+">100k+ (Flagship)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dealer Price (DP in ₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 25000"
                  value={newModel.dp}
                  onChange={(e) => setNewModel({ ...newModel, dp: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
                >
                  Save Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
