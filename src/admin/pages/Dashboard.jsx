import React from 'react';
import { Layers, Package, Zap, Play, Calendar, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { getActiveScheme, getProducts, getRules, getSchemes } from '../../lib/storage';
import { ruleToEnglish } from '../../lib/rulePreview';

export function Dashboard({ onNavigate }) {
  const activeScheme = getActiveScheme();
  const schemes = getSchemes();
  const products = getProducts(true);
  const rules = getRules(activeScheme.id);

  const activeProductsCount = products.filter(p => p.status !== 'Archived').length;
  const activeRulesCount = rules.filter(r => r.status !== 'Archived').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 border border-indigo-800/40 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-400/30 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active Scheme: {activeScheme.name}
            </div>
            <h1 className="text-2xl font-black text-white">{activeScheme.name}</h1>
            <p className="text-slate-300 text-xs mt-1 max-w-xl">{activeScheme.description} ({activeScheme.channel})</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onNavigate('rules')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-900/50"
            >
              Manage Rules ({activeRulesCount}) <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('tester')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" /> Test Scheme
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Rules</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-950 flex items-center justify-center text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black mt-2">{activeRulesCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Configured for {activeScheme.name}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Product SKUs</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-950 flex items-center justify-center text-indigo-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black mt-2">{activeProductsCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Active models in catalog</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Scheme Window</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-950 flex items-center justify-center text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold mt-2 text-indigo-300">{activeScheme.startDate} to {activeScheme.endDate}</div>
          <p className="text-[11px] text-slate-400 mt-1">Channel: {activeScheme.channel}</p>
        </div>
      </div>

      {/* Rules Overview Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" /> Currently Active Incentive Rules
          </h2>
          <button
            onClick={() => onNavigate('rules')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            View All Rules →
          </button>
        </div>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-800/40">
                    {rule.category || 'Global'}
                  </span>
                  <span className="font-semibold text-sm text-slate-200">{rule.name}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{ruleToEnglish(rule)}</p>
              </div>
              <span className="text-xs font-medium bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-800/40 self-start md:self-center">
                ✅ Active
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
