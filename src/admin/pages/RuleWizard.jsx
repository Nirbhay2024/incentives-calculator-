import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Check, HelpCircle, AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { getProducts, saveRule, getActiveScheme, getRules } from '../../lib/storage';
import { useAsyncData } from '../../lib/useAsyncData';
import { ruleToEnglish } from '../../lib/rulePreview';

async function loadWizardData() {
  const activeScheme = await getActiveScheme();
  const [products, existingRules] = await Promise.all([getProducts(), getRules(activeScheme.id)]);
  return { products, schemeId: activeScheme.id, existingRules };
}

const RULE_TEMPLATES = [
  { id: 'focus_model_volume', icon: '🎯', title: 'Focus Model (Volume Slabs)', category: 'Smartphone', desc: 'Higher unit volume unlocks higher per-unit earnings (e.g. A57).' },
  { id: 'kicker_bonus', icon: '💰', title: 'Kicker Bonus', category: 'Smartphone', desc: 'Sell N+ units to unlock a flat bonus per unit across all units (e.g. A27).' },
  { id: 'dp_slab_base', icon: '📱', title: 'DP Slab Base Incentive', category: 'Smartphone', desc: 'Standard per-unit incentive based on phone DP price range.' },
  { id: 'series_multiplier', icon: '⚡', title: 'Series Multiplier / Override', category: 'Smartphone', desc: 'Apply a multiplier to specific series (e.g. F & M series 0.5x).' },
  { id: 'target_gate', icon: '🔒', title: 'Target Achievement Gate', category: 'Smartphone', desc: 'Lock or pro-rate earnings unless promoter hits 80%+ target.' },
  { id: 'flagship_achievement_grid', icon: '⭐', title: 'Flagship Achievement Grid', category: 'Smartphone', desc: 'Matrix of rewards based on achievement % band and DP slab.' },
  { id: 'wearable_flat', icon: '⌚', title: 'Wearables Flat Reward', category: 'Wearable', desc: 'Fixed reward per watch, buds, or ring model.' },
  { id: 'volume_incremental', icon: '🎧', title: 'Volume Incremental Bonus', category: 'Wearable', desc: 'Bonus per unit when total category volume crosses threshold.' },
  { id: 'dp_range_slab', icon: '📱', title: 'Tablet DP Slabs & Gate', category: 'Tablet', desc: 'Tablet rewards by DP slab with minimum quantity gate.' },
  { id: 'volume_bonus_gate', icon: '💻', title: 'Notebook Reward & Gate', category: 'Notebook', desc: 'Notebook rewards per model + bonus gate when 10+ sold.' }
];

// ── Conflict detection ──────────────────────────────────────────────────────
// Mirrors the lookup keys ruleEngine.js uses (rules.find(...)) so we can tell
// the admin exactly which rule their new one would silently be shadowed by,
// or would silently shadow.
function getConflictKey(r) {
  switch (r.type) {
    case 'dp_slab_base':
    case 'series_multiplier':
    case 'kicker_bonus':
    case 'dp_range_slab':
    case 'volume_bonus_gate':
      return `${r.type}::${r.category}`;
    case 'target_gate':
      return `${r.type}::${r.segment}`;
    case 'focus_model_volume':
      return `${r.type}::${r.category}::${r.model}`;
    case 'flagship_achievement_grid':
    case 'wearable_flat':
    case 'volume_incremental':
      return r.type;
    default:
      return null;
  }
}

function getDefaultFieldsForType(type, category, products) {
  const firstModel = Array.from(new Set(products.filter(p => p.category === category).map(p => p.baseModel || p.model)))[0] || '';

  switch (type) {
    case 'focus_model_volume':
      return { model: firstModel, slabs: [{ min: 1, max: 2, reward: 550 }, { min: 3, max: 4, reward: 600 }, { min: 5, max: 999, reward: 650 }] };
    case 'kicker_bonus':
      return { model: firstModel, minUnits: 5, rewardPerUnit: 150 };
    case 'dp_slab_base':
      return {
        slabs: {
          '10k-15k': { reward: 30, label: '₹10k–15k' },
          '15k-20k': { reward: 75, label: '₹15k–20k' },
          '20k-30k': { reward: 250, label: '₹20k–30k' },
          '30k-40k': { reward: 300, label: '₹30k–40k' },
          '40k+': { reward: 400, label: '₹40k+' }
        }
      };
    case 'series_multiplier':
      return { series: ['F', 'M'], multiplier: 0.5, exceptions: [] };
    case 'target_gate':
      return { segment: 'Innovative', minAchievement: 0.8, fullAchievement: null };
    case 'flagship_achievement_grid':
      return {
        grid: [
          { achieveMin: 0.8, achieveMax: 0.8999, dpSlab: '70k-100k', reward: 350 },
          { achieveMin: 0.8, achieveMax: 0.8999, dpSlab: '100k+', reward: 400 },
          { achieveMin: 0.9, achieveMax: 0.9999, dpSlab: '70k-100k', reward: 450 },
          { achieveMin: 0.9, achieveMax: 0.9999, dpSlab: '100k+', reward: 500 },
          { achieveMin: 1.0, achieveMax: 1.1999, dpSlab: '70k-100k', reward: 550 },
          { achieveMin: 1.0, achieveMax: 1.1999, dpSlab: '100k+', reward: 600 },
          { achieveMin: 1.2, achieveMax: 999, dpSlab: '70k-100k', reward: 650 },
          { achieveMin: 1.2, achieveMax: 999, dpSlab: '100k+', reward: 750 }
        ]
      };
    case 'wearable_flat':
      return { flatRewards: { 'Other Watches': 500, 'Other Buds': 200 } };
    case 'volume_incremental':
      return { incrementalRewards: { Watch: [{ min: 1, max: 1, reward: 300 }, { min: 2, max: 999, reward: 500 }], Buds: [{ min: 1, max: 1, reward: 100 }, { min: 2, max: 999, reward: 200 }] } };
    case 'dp_range_slab':
      return {
        minimumGate: 2,
        maximumEarning: 20000,
        slabs: [
          { dpMin: 10000, dpMax: 14999, reward: 100 },
          { dpMin: 15000, dpMax: 19999, reward: 200 },
          { dpMin: 20000, dpMax: 29999, reward: 300 },
          { dpMin: 30000, dpMax: 39999, reward: 500 },
          { dpMin: 40000, dpMax: 69999, reward: 600 },
          { dpMin: 70000, dpMax: 999999, reward: 800 }
        ],
        focusModels: {}
      };
    case 'volume_bonus_gate':
      return { rewards: { 'Other Models': 750 }, additionalRewardGate: 10, additionalReward: 500, maximumEarning: 50000 };
    default:
      return {};
  }
}

// ── Small field helpers ─────────────────────────────────────────────────────
function NumField({ label, value, onChange, step }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-1">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(step ? (parseFloat(e.target.value) || 0) : (parseInt(e.target.value) || 0))}
        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
      />
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
      />
    </div>
  );
}

// ── Reusable row editors for reward configuration ───────────────────────────
function MinMaxRewardEditor({ label, rows, onChange }) {
  const update = (i, field, val) => {
    const next = [...rows];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };
  const addRow = () => onChange([...rows, { min: 1, max: 999, reward: 0 }]);
  const removeRow = (i) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-300">{label}</label>
        <button type="button" onClick={addRow} className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold">+ Add Tier</button>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <input type="number" value={row.min} onChange={(e) => update(i, 'min', parseInt(e.target.value) || 0)} placeholder="Min" className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white w-16" />
          <span className="text-xs text-slate-500">to</span>
          <input type="number" value={row.max} onChange={(e) => update(i, 'max', parseInt(e.target.value) || 0)} placeholder="Max" className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white w-16" />
          <span className="text-xs text-slate-500">→ ₹</span>
          <input type="number" value={row.reward} onChange={(e) => update(i, 'reward', parseInt(e.target.value) || 0)} placeholder="Reward" className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white w-24" />
          <button type="button" onClick={() => removeRow(i)} className="text-slate-500 hover:text-red-400 text-xs px-1">✕</button>
        </div>
      ))}
      {rows.length === 0 && <p className="text-xs text-slate-500">No tiers yet — add one above.</p>}
    </div>
  );
}

function DpRangeEditor({ rows, onChange }) {
  const update = (i, field, val) => {
    const next = [...rows];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };
  const addRow = () => onChange([...rows, { dpMin: 0, dpMax: 0, reward: 0 }]);
  const removeRow = (i) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-300">DP Price Slabs</label>
        <button type="button" onClick={addRow} className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold">+ Add Slab</button>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-slate-500">₹</span>
          <input type="number" value={row.dpMin} onChange={(e) => update(i, 'dpMin', parseInt(e.target.value) || 0)} placeholder="Min DP" className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white w-24" />
          <span className="text-xs text-slate-500">to ₹</span>
          <input type="number" value={row.dpMax} onChange={(e) => update(i, 'dpMax', parseInt(e.target.value) || 0)} placeholder="Max DP" className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white w-24" />
          <span className="text-xs text-slate-500">→ ₹</span>
          <input type="number" value={row.reward} onChange={(e) => update(i, 'reward', parseInt(e.target.value) || 0)} placeholder="Reward" className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white w-20" />
          <button type="button" onClick={() => removeRow(i)} className="text-slate-500 hover:text-red-400 text-xs px-1">✕</button>
        </div>
      ))}
      {rows.length === 0 && <p className="text-xs text-slate-500">No slabs yet — add one above.</p>}
    </div>
  );
}

function DpSlabEditor({ values, onChange }) {
  const entries = Object.entries(values || {});
  const updateEntry = (i, field, val) => {
    const next = [...entries];
    const [k, v] = next[i];
    next[i] = field === 'key' ? [val, v] : [k, { ...v, [field]: val }];
    onChange(Object.fromEntries(next));
  };
  const addEntry = () => onChange({ ...values, 'new-slab': { reward: 0, label: 'New Slab' } });
  const removeEntry = (key) => {
    const next = { ...values };
    delete next[key];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-300">DP Slab Rewards</label>
        <button type="button" onClick={addEntry} className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold">+ Add Slab</button>
      </div>
      {entries.map(([key, val], i) => (
        <div key={i} className="flex items-center gap-2">
          <input type="text" value={key} onChange={(e) => updateEntry(i, 'key', e.target.value)} placeholder="e.g. 20k-30k" className="w-24 bg-slate-800 border border-slate-700 px-2 py-1.5 rounded-lg text-xs text-white" />
          <input type="text" value={val.label || ''} onChange={(e) => updateEntry(i, 'label', e.target.value)} placeholder="Label" className="flex-1 bg-slate-800 border border-slate-700 px-2 py-1.5 rounded-lg text-xs text-white" />
          <span className="text-xs text-slate-500">₹</span>
          <input type="number" value={val.reward} onChange={(e) => updateEntry(i, 'reward', parseInt(e.target.value) || 0)} className="w-20 bg-slate-800 border border-slate-700 px-2 py-1.5 rounded-lg text-xs text-white" />
          <button type="button" onClick={() => removeEntry(key)} className="text-slate-500 hover:text-red-400 text-xs px-1">✕</button>
        </div>
      ))}
      {entries.length === 0 && <p className="text-xs text-slate-500">No slabs yet — add one above.</p>}
    </div>
  );
}

function KeyValueRewardEditor({ label, values, onChange }) {
  const entries = Object.entries(values || {});
  const updateEntry = (i, field, val) => {
    const next = [...entries];
    next[i] = field === 'key' ? [val, next[i][1]] : [next[i][0], val];
    onChange(Object.fromEntries(next));
  };
  const addEntry = () => onChange({ ...values, 'New Item': 0 });
  const removeEntry = (key) => {
    const next = { ...values };
    delete next[key];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-300">{label}</label>
        <button type="button" onClick={addEntry} className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold">+ Add</button>
      </div>
      {entries.map(([key, val], i) => (
        <div key={i} className="flex items-center gap-2">
          <input type="text" value={key} onChange={(e) => updateEntry(i, 'key', e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white" />
          <span className="text-xs text-slate-500">₹</span>
          <input type="number" value={val} onChange={(e) => updateEntry(i, 'value', parseInt(e.target.value) || 0)} className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white w-24" />
          <button type="button" onClick={() => removeEntry(key)} className="text-slate-500 hover:text-red-400 text-xs px-1">✕</button>
        </div>
      ))}
      {entries.length === 0 && <p className="text-xs text-slate-500">No entries yet — add one above.</p>}
    </div>
  );
}

function FlagshipGridEditor({ rows, onChange }) {
  const update = (i, field, val) => {
    const next = [...rows];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };
  const addRow = () => onChange([...rows, { achieveMin: 0.8, achieveMax: 1.1999, dpSlab: '70k-100k', reward: 0 }]);
  const removeRow = (i) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-300">Achievement × DP Slab Reward Grid</label>
        <button type="button" onClick={addRow} className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold">+ Add Row</button>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2 flex-wrap">
          <input type="number" step="0.01" value={row.achieveMin} onChange={(e) => update(i, 'achieveMin', parseFloat(e.target.value) || 0)} placeholder="Min %" className="w-20 bg-slate-800 border border-slate-700 px-2 py-1.5 rounded-lg text-xs text-white" />
          <span className="text-xs text-slate-500">to</span>
          <input type="number" step="0.01" value={row.achieveMax} onChange={(e) => update(i, 'achieveMax', parseFloat(e.target.value) || 0)} placeholder="Max %" className="w-20 bg-slate-800 border border-slate-700 px-2 py-1.5 rounded-lg text-xs text-white" />
          <select value={row.dpSlab} onChange={(e) => update(i, 'dpSlab', e.target.value)} className="bg-slate-800 border border-slate-700 px-2 py-1.5 rounded-lg text-xs text-white">
            <option value="70k-100k">₹70k–100k</option>
            <option value="100k+">₹100k+</option>
          </select>
          <span className="text-xs text-slate-500">→ ₹</span>
          <input type="number" value={row.reward} onChange={(e) => update(i, 'reward', parseInt(e.target.value) || 0)} className="w-20 bg-slate-800 border border-slate-700 px-2 py-1.5 rounded-lg text-xs text-white" />
          <button type="button" onClick={() => removeRow(i)} className="text-slate-500 hover:text-red-400 text-xs px-1">✕</button>
        </div>
      ))}
      {rows.length === 0 && <p className="text-xs text-slate-500">No rows yet — add one above.</p>}
    </div>
  );
}

export function RuleWizard({ onComplete }) {
  const { data, loading, error } = useAsyncData(loadWizardData, []);
  const [step, setStep] = useState(1);
  const [ruleData, setRuleData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (data && !ruleData) {
      setRuleData({
        id: `rule-${Date.now()}`,
        schemeId: data.schemeId,
        name: '',
        type: 'focus_model_volume',
        category: 'Smartphone',
        description: '',
        status: 'Active',
        ...getDefaultFieldsForType('focus_model_volume', 'Smartphone', data.products)
      });
    }
  }, [data, ruleData]);

  if (loading || !ruleData) {
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

  const products = data.products;

  const selectTemplate = (template) => {
    setRuleData((prev) => ({
      id: prev.id,
      schemeId: prev.schemeId,
      name: `${template.title} Rule`,
      type: template.id,
      category: template.category,
      description: '',
      status: 'Active',
      ...getDefaultFieldsForType(template.id, template.category, products)
    }));
    setStep(2);
  };

  const handleSaveRule = async (conflict) => {
    if (conflict) {
      if (!confirm(`This will archive the existing rule "${conflict.name}" and replace it with your new rule. Continue?`)) return;
    }
    setSaveError('');
    setSaving(true);
    try {
      if (conflict) {
        await saveRule({ ...conflict, status: 'Archived' });
      }
      await saveRule(ruleData);
      onComplete();
    } catch (err) {
      setSaveError(err.message || 'Failed to save rule.');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Progress Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Create New Incentive Rule
            </h2>
            {step > 1 && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <span>{RULE_TEMPLATES.find(t => t.id === ruleData.type)?.icon}</span>
                {RULE_TEMPLATES.find(t => t.id === ruleData.type)?.title}
              </p>
            )}
          </div>
          <span className="text-xs text-indigo-400 font-semibold bg-indigo-950 px-3 py-1 rounded-full border border-indigo-800 flex-shrink-0">
            Step {step} of 5
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: Select Rule Type Template */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Step 1: What is this rule for?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RULE_TEMPLATES.map((t) => (
              <div
                key={t.id}
                onClick={() => selectTemplate(t)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${ruleData.type === t.id ? 'bg-indigo-950/80 border-indigo-500 shadow-lg shadow-indigo-950/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.icon}</span>
                  <div>
                    <div className="font-bold text-white text-sm">{t.title}</div>
                    <div className="text-xs text-indigo-400 font-semibold">{t.category}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Products & Scope */}
      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Step 2: Which products does this apply to?</h3>

          {ruleData.type === 'target_gate' ? (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Segment</label>
              <select
                value={ruleData.segment}
                onChange={(e) => setRuleData({ ...ruleData, segment: e.target.value, name: `${e.target.value} Target Gate Rule` })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
              >
                <option value="Innovative">Innovative</option>
                <option value="Flagship">Flagship</option>
              </select>
            </div>
          ) : ruleData.type === 'flagship_achievement_grid' ? (
            <p className="text-xs text-slate-400 bg-slate-800/60 border border-slate-700 rounded-xl p-3">
              This rule always applies to Flagship (S &amp; Z series) smartphones — no category selection needed.
            </p>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Category</label>
              <select
                value={ruleData.category}
                onChange={(e) => setRuleData({ ...ruleData, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
              >
                <option value="Smartphone">Smartphone</option>
                <option value="Wearable">Wearable</option>
                <option value="Tablet">Tablet</option>
                <option value="Notebook">Notebook</option>
              </select>
            </div>
          )}

          {(ruleData.type === 'focus_model_volume' || ruleData.type === 'kicker_bonus') && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Select Specific Base Model</label>
              <select
                value={ruleData.model}
                onChange={(e) => setRuleData({ ...ruleData, model: e.target.value, name: `${e.target.value} ${ruleData.type === 'kicker_bonus' ? 'Kicker Bonus' : 'Focus Model'}` })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
              >
                {Array.from(new Set(products.filter(p => p.category === ruleData.category).map(p => p.baseModel || p.model))).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(1)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold">
              Back
            </button>
            <button onClick={() => setStep(3)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2">
              Next: Conditions <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Conditions */}
      {step === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Step 3: Does this depend on any conditions?</h3>

          {ruleData.type === 'kicker_bonus' && (
            <NumField label="Minimum Units Required" value={ruleData.minUnits} onChange={(v) => setRuleData({ ...ruleData, minUnits: v })} />
          )}

          {ruleData.type === 'target_gate' && (
            <>
              <NumField label="Minimum Achievement % Required (e.g. 0.8 = 80%)" step="0.05" value={ruleData.minAchievement} onChange={(v) => setRuleData({ ...ruleData, minAchievement: v })} />
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={!!ruleData.fullAchievement}
                  onChange={(e) => setRuleData({ ...ruleData, fullAchievement: e.target.checked ? 1.0 : null })}
                />
                Pro-rate earnings between the minimum and 100% achievement (instead of a hard lock)
              </label>
            </>
          )}

          {ruleData.type === 'series_multiplier' && (
            <>
              <TextField
                label="Series Codes Affected (comma separated, e.g. F, M)"
                value={(ruleData.series || []).join(', ')}
                onChange={(v) => setRuleData({ ...ruleData, series: v.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) })}
              />
              <TextField
                label="Exception Models (comma separated base model names, e.g. F17)"
                value={(ruleData.exceptions || []).join(', ')}
                onChange={(v) => setRuleData({ ...ruleData, exceptions: v.split(',').map(s => s.trim()).filter(Boolean) })}
              />
            </>
          )}

          {ruleData.type === 'dp_range_slab' && (
            <>
              <NumField label="Minimum Category Units Gate" value={ruleData.minimumGate} onChange={(v) => setRuleData({ ...ruleData, minimumGate: v })} />
              <NumField label="Maximum Earning Cap (₹, 0 = no cap)" value={ruleData.maximumEarning} onChange={(v) => setRuleData({ ...ruleData, maximumEarning: v })} />
            </>
          )}

          {ruleData.type === 'volume_bonus_gate' && (
            <>
              <NumField label="Units Required to Unlock Bonus" value={ruleData.additionalRewardGate} onChange={(v) => setRuleData({ ...ruleData, additionalRewardGate: v })} />
              <NumField label="Maximum Earning Cap (₹, 0 = no cap)" value={ruleData.maximumEarning} onChange={(v) => setRuleData({ ...ruleData, maximumEarning: v })} />
            </>
          )}

          {['dp_slab_base', 'focus_model_volume', 'flagship_achievement_grid', 'wearable_flat', 'volume_incremental'].includes(ruleData.type) && (
            <p className="text-xs text-slate-400">No additional conditions for this rule type — configure reward values in the next step.</p>
          )}

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(2)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold">
              Back
            </button>
            <button onClick={() => setStep(4)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2">
              Next: Rewards <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Reward Configuration */}
      {step === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Step 4: Enter the reward values</h3>

          {ruleData.type === 'kicker_bonus' && (
            <NumField label="Kicker Reward Per Unit (₹)" value={ruleData.rewardPerUnit} onChange={(v) => setRuleData({ ...ruleData, rewardPerUnit: v })} />
          )}

          {ruleData.type === 'focus_model_volume' && (
            <MinMaxRewardEditor label="Volume Tier Slabs (units sold → ₹/unit)" rows={ruleData.slabs || []} onChange={(slabs) => setRuleData({ ...ruleData, slabs })} />
          )}

          {ruleData.type === 'dp_slab_base' && (
            <DpSlabEditor values={ruleData.slabs || {}} onChange={(slabs) => setRuleData({ ...ruleData, slabs })} />
          )}

          {ruleData.type === 'series_multiplier' && (
            <NumField label="Multiplier (0 to 1, e.g. 0.5 = 50% of standard reward)" step="0.05" value={ruleData.multiplier} onChange={(v) => setRuleData({ ...ruleData, multiplier: v })} />
          )}

          {ruleData.type === 'flagship_achievement_grid' && (
            <FlagshipGridEditor rows={ruleData.grid || []} onChange={(grid) => setRuleData({ ...ruleData, grid })} />
          )}

          {ruleData.type === 'wearable_flat' && (
            <KeyValueRewardEditor label="Flat Reward Per Model" values={ruleData.flatRewards || {}} onChange={(flatRewards) => setRuleData({ ...ruleData, flatRewards })} />
          )}

          {ruleData.type === 'volume_incremental' && (
            <>
              <MinMaxRewardEditor
                label="Watch Volume Tiers (total watches sold → extra ₹/unit)"
                rows={ruleData.incrementalRewards?.Watch || []}
                onChange={(rows) => setRuleData({ ...ruleData, incrementalRewards: { ...ruleData.incrementalRewards, Watch: rows } })}
              />
              <MinMaxRewardEditor
                label="Buds Volume Tiers (total buds sold → extra ₹/unit)"
                rows={ruleData.incrementalRewards?.Buds || []}
                onChange={(rows) => setRuleData({ ...ruleData, incrementalRewards: { ...ruleData.incrementalRewards, Buds: rows } })}
              />
            </>
          )}

          {ruleData.type === 'dp_range_slab' && (
            <>
              <DpRangeEditor rows={ruleData.slabs || []} onChange={(slabs) => setRuleData({ ...ruleData, slabs })} />
              <KeyValueRewardEditor label="Focus Model Flat Rewards (overrides DP slab)" values={ruleData.focusModels || {}} onChange={(focusModels) => setRuleData({ ...ruleData, focusModels })} />
            </>
          )}

          {ruleData.type === 'volume_bonus_gate' && (
            <>
              <KeyValueRewardEditor label="Per-Model Base Reward" values={ruleData.rewards || {}} onChange={(rewards) => setRuleData({ ...ruleData, rewards })} />
              <NumField label="Additional Bonus Per Unit (once gate met)" value={ruleData.additionalReward} onChange={(v) => setRuleData({ ...ruleData, additionalReward: v })} />
            </>
          )}

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(3)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold">
              Back
            </button>
            <button onClick={() => setStep(5)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2">
              Next: Live Preview <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Live English Preview & Save */}
      {step === 5 && (() => {
        const existingRules = (data.existingRules || []).filter(r => (r.status || 'Active') === 'Active' && r.id !== ruleData.id);
        const myKey = getConflictKey(ruleData);
        const conflict = myKey ? existingRules.find(r => getConflictKey(r) === myKey) : null;

        return (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Step 5: Review & Publish Rule</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Rule Name</label>
              <input
                type="text"
                value={ruleData.name}
                onChange={(e) => setRuleData({ ...ruleData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold"
              />
            </div>

            {/* Live Human-Readable English Preview Box */}
            <div className="bg-indigo-950/60 border border-indigo-800/60 rounded-2xl p-5 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Live English Summary Preview
              </div>
              <p className="text-sm text-slate-100 font-medium leading-relaxed">
                "{ruleToEnglish(ruleData)}"
              </p>
            </div>

            {conflict && (
              <div className="p-4 bg-amber-950/60 border border-amber-800/60 rounded-2xl text-amber-300 text-xs space-y-2">
                <div className="font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Rule Conflict Detected
                </div>
                <p>
                  An active rule "<strong>{conflict.name}</strong>" already controls this exact logic. Only one rule of this
                  kind can be active at a time, or the calculation engine would just ignore whichever one it finds second.
                  Publishing will <strong>archive</strong> "{conflict.name}" and this new rule will take over.
                </p>
              </div>
            )}

            {saveError && (
              <div className="p-3.5 bg-red-950/60 border border-red-800/60 rounded-xl flex items-start gap-3 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {saveError}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(4)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold">
                Back
              </button>
              <button
                onClick={() => handleSaveRule(conflict)}
                disabled={saving}
                className={`px-6 py-3 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg disabled:opacity-60 ${conflict ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/50' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'}`}
              >
                {conflict ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                {saving ? 'Publishing…' : conflict ? 'Override & Publish Rule' : 'Publish Rule to Scheme'}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
