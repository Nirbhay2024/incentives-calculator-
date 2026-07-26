import React, { useMemo, useState } from 'react';
import { Play, CheckCircle2, XCircle, Calculator, Zap, HelpCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { getProducts, getRules, getActiveScheme } from '../../lib/storage';
import { useAsyncData } from '../../lib/useAsyncData';
import { evaluateSchemeRules } from '../../lib/ruleEngine';

async function loadTesterData() {
  const activeScheme = await getActiveScheme();
  const [products, rules] = await Promise.all([getProducts(), getRules(activeScheme.id)]);
  return { activeScheme, products, rules };
}

export function RuleTester() {
  const { data, loading, error } = useAsyncData(loadTesterData, []);

  const [testBucket, setTestBucket] = useState({
    'A57-8-128': 6,
    'A27-8-128': 5,
    'W8-40': 2,
    'S11U-W': 1
  });

  const [testTargets, setTestTargets] = useState({
    innovative: 40,
    flagship: 5
  });

  const products = data?.products || [];
  const rules = data?.rules || [];

  const evaluation = useMemo(
    () => evaluateSchemeRules(testBucket, testTargets, products, rules),
    [testBucket, testTargets, products, rules]
  );

  const handleQtyChange = (id, delta) => {
    setTestBucket((prev) => {
      const next = (prev[id] || 0) + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Play className="w-5 h-5 text-emerald-400" /> Incentive Rule Simulator & Tester
        </h2>
        <p className="text-xs text-slate-400 mt-1">Test hypothetical SEC sales scenarios and verify exact triggered rules, explanations, and payouts before publishing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Scenario Configurator */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Hypothetical Sales Scenario</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Innovative Target</label>
              <input
                type="number"
                value={testTargets.innovative}
                onChange={(e) => setTestTargets({ ...testTargets, innovative: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Flagship Target</label>
              <input
                type="number"
                value={testTargets.flagship}
                onChange={(e) => setTestTargets({ ...testTargets, flagship: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-400">Hypothetical Product Sales</label>
            <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
              {products.map((p) => {
                const qty = testBucket[p.id] || 0;
                return (
                  <div key={p.id} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-xs font-medium text-slate-300 truncate max-w-[200px]">{p.model}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQtyChange(p.id, -1)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center justify-center text-slate-300"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold w-6 text-center text-indigo-300">{qty}</span>
                      <button
                        onClick={() => handleQtyChange(p.id, 1)}
                        className="w-6 h-6 rounded bg-indigo-600 hover:bg-indigo-500 text-xs font-bold flex items-center justify-center text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Detailed Simulation Output & Rule Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          {/* Total Payout Summary */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 border border-indigo-800/60 rounded-2xl p-6 text-white shadow-xl">
            <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Simulated Total SEC Payout</div>
            <div className="text-4xl font-black mt-1">₹{evaluation.totalIncentive.toLocaleString()}</div>

            <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-indigo-800/40 text-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Smartphones</div>
                <div className="text-xs font-bold text-indigo-200 mt-0.5">₹{evaluation.breakdown.smartphones.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Wearables</div>
                <div className="text-xs font-bold text-indigo-200 mt-0.5">₹{evaluation.breakdown.wearables.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Tablets</div>
                <div className="text-xs font-bold text-indigo-200 mt-0.5">₹{evaluation.breakdown.tablets.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Notebooks</div>
                <div className="text-xs font-bold text-indigo-200 mt-0.5">₹{evaluation.breakdown.notebooks.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Triggered vs Locked Rule Explanations */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" /> Evaluated Rules & Explanations ({evaluation.explanations.length})
            </h4>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {evaluation.explanations.map((exp, i) => {
                const isEarned = exp.status === 'earned';
                const isLocked = exp.status === 'locked' || exp.status === 'missed';

                return (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl border ${isEarned ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200' : isLocked ? 'bg-red-950/40 border-red-800/50 text-red-200' : 'bg-slate-950 border-slate-800 text-slate-300'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        {isEarned ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                        {exp.name}
                      </span>
                      <span className="font-extrabold text-xs">
                        {exp.amount > 0 ? `+₹${exp.amount.toLocaleString()}` : '₹0'}
                      </span>
                    </div>
                    <p className="text-xs mt-1 opacity-90">{exp.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
