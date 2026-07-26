import React, { useState } from 'react';
import { Megaphone, Plus, Edit2, Archive, Trash2, Check, X, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { getAnnouncements, saveAnnouncement, archiveAnnouncement, deleteAnnouncement } from '../../lib/storage';
import { useAsyncData } from '../../lib/useAsyncData';
import { selectOnFocus } from '../../lib/uiHelpers';

const TYPE_META = {
  promo: { label: 'Push / Promo', icon: TrendingUp, badge: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  alert: { label: 'Alert / Degrowth', icon: TrendingDown, badge: 'bg-red-950 text-red-300 border-red-800' },
  info: { label: 'General Info', icon: Info, badge: 'bg-indigo-950 text-indigo-300 border-indigo-800' }
};

const emptyForm = { id: '', title: '', message: '', type: 'info', status: 'Active' };

export function Announcements() {
  const { data: announcements, loading, error, reload } = useAsyncData(getAnnouncements, []);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (a) => {
    setEditingId(a.id);
    setForm({ id: a.id, title: a.title, message: a.message, type: a.type, status: a.status });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const id = editingId || `notice-${Date.now().toString(36)}`;
      await saveAnnouncement({ ...form, id });
      setShowModal(false);
      reload();
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = async (a) => {
    if (!confirm('Take this announcement down? Promoters will stop seeing it.')) return;
    setBusy(true);
    try {
      await archiveAnnouncement(a);
      reload();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (a) => {
    if (!confirm('Permanently delete this announcement? This cannot be undone.')) return;
    setBusy(true);
    try {
      await deleteAnnouncement(a.id);
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

  const filtered = announcements.filter((a) => showArchived || a.status !== 'Archived');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-400" /> Notice Board
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Push a message to every promoter's calculator — e.g. "focus on Z Fold 8 this month" or "A27 stock delayed, degrowth expected".
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-900/50 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
          className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
        />
        Show taken-down announcements
      </label>

      <div className="space-y-3">
        {filtered.map((a) => {
          const meta = TYPE_META[a.type] || TYPE_META.info;
          const Icon = meta.icon;
          return (
            <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${meta.badge}`}>
                    <Icon className="w-3 h-3" /> {meta.label}
                  </span>
                  {a.status === 'Archived' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-slate-800 text-slate-400 border-slate-700">
                      Taken Down
                    </span>
                  )}
                </div>
                <div className="font-bold text-white text-sm">{a.title}</div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{a.message}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(a)} className="p-1.5 text-slate-400 hover:text-indigo-300 transition">
                  <Edit2 className="w-4 h-4" />
                </button>
                {a.status !== 'Archived' && (
                  <button onClick={() => handleArchive(a)} className="p-1.5 text-slate-400 hover:text-amber-400 transition">
                    <Archive className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => handleDelete(a)} className="p-1.5 text-slate-400 hover:text-red-400 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center text-xs text-slate-500 py-16 bg-slate-900 border border-slate-800 rounded-2xl">
            No announcements yet. Click "New Announcement" to post one to the notice board.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-400" /> {editingId ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(TYPE_META).map(([key, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm({ ...form, type: key })}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[11px] font-semibold transition ${form.type === key ? 'bg-indigo-950/80 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                      >
                        <Icon className="w-4 h-4" /> {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Push Galaxy Z Fold 8 this month"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  onFocus={selectOnFocus}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Z Fold 8 launched with a special ₹500/unit bonus this month — prioritize demoing it to every walk-in customer."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  onFocus={selectOnFocus}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" /> {busy ? 'Publishing…' : 'Publish to Notice Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
