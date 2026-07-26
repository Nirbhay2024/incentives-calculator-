import React, { useState } from 'react';
import { Zap, Plus, Trash2, Edit3, AlertTriangle, Eye, ShieldCheck } from 'lucide-react';
import { getRules, deleteRule, getActiveScheme } from '../../lib/storage';
import { ruleToEnglish } from '../../lib/rulePreview';

export function RuleManager({ onCreateNewRule }) {
  const activeScheme = getActiveScheme();
  const [rules, setRules] = useState(() => getRules(activeScheme.id));

  const refreshRules = () => {
    setRules(getRules(activeScheme.id));
  };

  const handleDelete = (id) => {
    if (confirm('Delete this rule from the active scheme?')) {
      deleteRule(id);
      refreshRules();
    }
  };

  // Basic Conflict check: duplicate names or identical focus models
  const focusModelsSeen = new Set();
  const conflicts = [];
  rules.forEach((r) => {
    if (r.type === 'focus_model_volume' && r.model) {
      if (focusModelsSeen.has(r.model)) {
        conflicts.push(`Duplicate focus model volume rule detected for model: ${r.model}.`);
      }
      focusModelsSeen.add(r.model);
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" /> Active Scheme Rules ({rules.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">Rules configuring payout logic for {activeScheme.name}.</p>
        </div>

        <button
          onClick={onCreateNewRule}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-900/50 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Rule Wizard
        </button>
      </div>

      {/* Conflict Validation Banner */}
      {conflicts.length > 0 && (
        <div className="p-4 bg-amber-950/60 border border-amber-800/60 rounded-2xl text-amber-300 text-xs space-y-1">
          <div className="font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Rule Conflict Warning
          </div>
          {conflicts.map((c, i) => (
            <p key={i}>• {c}</p>
          ))}
        </div>
      )}

      {/* Visual Rule Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition rounded-2xl p-5 text-white flex flex-col justify-between space-y-4 shadow-lg">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-800/50">
                  {rule.category || 'Global'}
                </span>
                <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800">
                  ✅ {rule.status || 'Active'}
                </span>
              </div>

              <h3 className="font-bold text-base text-white">{rule.name}</h3>

              <div className="mt-3 bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" /> Plain English Rule Explanation
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  "{ruleToEnglish(rule)}"
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-500 font-mono">Type: {rule.type}</span>
              <button
                onClick={() => handleDelete(rule.id)}
                className="text-xs text-slate-400 hover:text-red-400 font-semibold flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
