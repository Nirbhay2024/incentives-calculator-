import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Check, HelpCircle, AlertCircle } from 'lucide-react';
import { getProducts, saveRule, getActiveSchemeId } from '../../lib/storage';
import { ruleToEnglish } from '../../lib/rulePreview';

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

export function RuleWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const products = getProducts();

  const [ruleData, setRuleData] = useState({
    id: `rule-${Date.now()}`,
    schemeId: getActiveSchemeId(),
    name: '',
    type: 'focus_model_volume',
    category: 'Smartphone',
    model: 'A57',
    description: '',
    status: 'Active',
    // Dynamic fields depending on type
    slabs: [
      { min: 1, max: 2, reward: 550 },
      { min: 3, max: 4, reward: 600 },
      { min: 5, max: 999, reward: 650 }
    ],
    minUnits: 5,
    rewardPerUnit: 150,
    multiplier: 0.5,
    exceptions: ['F17'],
    minAchievement: 0.8,
    minimumGate: 2,
    maximumEarning: 20000
  });

  const selectTemplate = (template) => {
    setRuleData((prev) => ({
      ...prev,
      type: template.id,
      name: `${template.title} Rule`,
      category: template.category
    }));
    setStep(2);
  };

  const handleSaveRule = () => {
    saveRule(ruleData);
    onComplete();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Progress Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> Create New Incentive Rule
          </h2>
          <span className="text-xs text-indigo-400 font-semibold bg-indigo-950 px-3 py-1 rounded-full border border-indigo-800">
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Step 3: Does this depend on any conditions?</h3>

          {ruleData.type === 'kicker_bonus' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Minimum Units Required</label>
              <input
                type="number"
                value={ruleData.minUnits}
                onChange={(e) => setRuleData({ ...ruleData, minUnits: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
              />
            </div>
          )}

          {ruleData.type === 'target_gate' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Minimum Achievement % Target Required (e.g. 0.8 = 80%)</label>
              <input
                type="number"
                step="0.05"
                value={ruleData.minAchievement}
                onChange={(e) => setRuleData({ ...ruleData, minAchievement: parseFloat(e.target.value) || 0.8 })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
              />
            </div>
          )}

          {ruleData.type === 'dp_range_slab' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Minimum Category Units Gate</label>
              <input
                type="number"
                value={ruleData.minimumGate}
                onChange={(e) => setRuleData({ ...ruleData, minimumGate: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
              />
            </div>
          )}

          {ruleData.type !== 'kicker_bonus' && ruleData.type !== 'target_gate' && ruleData.type !== 'dp_range_slab' && (
            <p className="text-xs text-slate-400">Standard slab and category execution parameters configured automatically for this template.</p>
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Step 4: Enter the reward values</h3>

          {ruleData.type === 'kicker_bonus' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Kicker Reward Per Unit (₹)</label>
              <input
                type="number"
                value={ruleData.rewardPerUnit}
                onChange={(e) => setRuleData({ ...ruleData, rewardPerUnit: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
              />
            </div>
          )}

          {ruleData.type === 'focus_model_volume' && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">Volume Tier Slabs</label>
              {(ruleData.slabs || []).map((slab, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-16">Tier {i + 1}:</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={slab.min}
                    onChange={(e) => {
                      const newSlabs = [...ruleData.slabs];
                      newSlabs[i].min = parseInt(e.target.value) || 1;
                      setRuleData({ ...ruleData, slabs: newSlabs });
                    }}
                    className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white w-20"
                  />
                  <span className="text-xs text-slate-500">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={slab.max || 999}
                    onChange={(e) => {
                      const newSlabs = [...ruleData.slabs];
                      newSlabs[i].max = parseInt(e.target.value) || 999;
                      setRuleData({ ...ruleData, slabs: newSlabs });
                    }}
                    className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white w-20"
                  />
                  <span className="text-xs text-slate-500">→ ₹</span>
                  <input
                    type="number"
                    placeholder="Reward"
                    value={slab.reward}
                    onChange={(e) => {
                      const newSlabs = [...ruleData.slabs];
                      newSlabs[i].reward = parseInt(e.target.value) || 0;
                      setRuleData({ ...ruleData, slabs: newSlabs });
                    }}
                    className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white w-28"
                  />
                </div>
              ))}
            </div>
          )}

          {ruleData.type !== 'kicker_bonus' && ruleData.type !== 'focus_model_volume' && (
            <p className="text-xs text-slate-400">Reward configuration initialized with system standard settings for this rule type.</p>
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
      {step === 5 && (
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

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(4)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold">
              Back
            </button>
            <button
              onClick={handleSaveRule}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/50"
            >
              <Check className="w-4 h-4" /> Publish Rule to Scheme
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
