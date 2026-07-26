import React, { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { calculateIncentives } from './lib/calculator';
import { getActiveScheme, getProducts } from './lib/storage';
import AdminApp from './admin/AdminApp';
import {
  Calculator, Settings, ArrowRight, UserCircle, Star, Target,
  TrendingUp, Sparkles, LogIn, Plus, Minus, ShoppingCart,
  ChevronDown, ChevronUp, Zap, Trophy, AlertCircle, Smartphone,
  Watch, Tablet, Laptop, X, CheckCircle2, HelpCircle
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORY_META = {
  Smartphone: { icon: Smartphone, color: 'blue', label: 'Smartphones' },
  Wearable: { icon: Watch, color: 'purple', label: 'Wearables' },
  Tablet: { icon: Tablet, color: 'teal', label: 'Tablets' },
  Notebook: { icon: Laptop, color: 'orange', label: 'Notebooks' },
};

const NUDGE_COLORS = {
  target_locked: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', badge: 'bg-red-100 text-red-700' },
  flagship_locked: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', badge: 'bg-amber-100 text-amber-700' },
  target_partial: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', badge: 'bg-yellow-100 text-yellow-700' },
  focus: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-700' },
  kicker: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-900', badge: 'bg-violet-100 text-violet-700' },
  kicker_achieved: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', badge: 'bg-green-100 text-green-700' },
  flagship_tier: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900', badge: 'bg-indigo-100 text-indigo-700' },
  wearable: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', badge: 'bg-purple-100 text-purple-700' },
  tablet: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900', badge: 'bg-teal-100 text-teal-700' },
  notebook: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', badge: 'bg-orange-100 text-orange-700' },
};

// ── Header ───────────────────────────────────────────────────────────────────
function Header({ title }) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center space-x-2">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <span className="text-base sm:text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Incentives · {title}
        </span>
      </div>
      <nav className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm">
        <Link to="/" className="flex items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors font-medium">
          <Calculator className="w-4 h-4" />Calculator
        </Link>
        <Link to="/admin" className="flex items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors font-medium">
          <Settings className="w-4 h-4" />Admin
        </Link>
      </nav>
    </header>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────
function PromoterLogin({ onLogin }) {
  const [storeCode, setStoreCode] = useState('');
  const [name, setName] = useState('');
  const activeScheme = getActiveScheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-600 shadow-2xl shadow-blue-900/50 mb-4 sm:mb-6">
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Incentives Calculator</h1>
          <p className="text-sm text-blue-300">Calculate your {activeScheme.name || 'Scheme'} earnings instantly</p>
        </div>

        <form onSubmit={e => { e.preventDefault(); if (storeCode && name) onLogin({ storeCode, name }); }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 sm:p-8 space-y-4 sm:space-y-5 shadow-2xl">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-blue-100 mb-1.5 sm:mb-2">Store Code</label>
            <input required type="text"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:ring-2 focus:ring-blue-400 outline-none transition text-base sm:text-sm"
              placeholder="e.g. BLR-001"
              value={storeCode} onChange={e => setStoreCode(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-blue-100 mb-1.5 sm:mb-2">Your Name / SEC ID</label>
            <input required type="text"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:ring-2 focus:ring-blue-400 outline-none transition text-base sm:text-sm"
              placeholder="e.g. Ravi Kumar"
              value={name} onChange={e => setName(e.target.value)} />
          </div>
          <button type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/50 mt-2 text-sm sm:text-base">
            Start Calculating <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Product Row (in catalog) ──────────────────────────────────────────────────
function ProductRow({ product, qty, onIncrement, onDecrement, onSet }) {
  const isFlagship = product.flagship || product.series === 'S' || product.series === 'Z';
  const slabLabel = product.dpSlab ? `Slab: ${product.dpSlab}` : product.dp ? `DP: ₹${product.dp.toLocaleString()}` : '';
  const hasQty = qty > 0;

  return (
    <div className={`flex items-center justify-between py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl transition-all ${hasQty ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'}`}>
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-1 flex-wrap">
          {isFlagship && <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
          <span className={`text-xs sm:text-sm font-semibold ${hasQty ? 'text-blue-900' : 'text-slate-800'} truncate`}>
            {product.model}
          </span>
        </div>
        {slabLabel && <span className="text-[11px] text-slate-400 block mt-0.5">{slabLabel}</span>}
      </div>

      <div className="flex items-center gap-2 sm:gap-1.5 flex-shrink-0">
        <button onClick={onDecrement} disabled={qty === 0}
          className="w-10 h-10 sm:w-7 sm:h-7 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-30 flex items-center justify-center transition-colors active:scale-95">
          <Minus className="w-5 h-5 sm:w-3.5 sm:h-3.5 text-slate-700" />
        </button>
        <input type="number" min="0" value={qty || ''}
          onChange={e => onSet(parseInt(e.target.value) || 0)}
          placeholder="0"
          className={`w-14 sm:w-12 h-10 sm:h-auto text-center text-base sm:text-sm font-bold rounded-lg border py-1 outline-none transition
            ${hasQty ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-slate-100 border-slate-200 text-slate-700'}`} />
        <button onClick={onIncrement}
          className="w-10 h-10 sm:w-7 sm:h-7 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors shadow-sm active:scale-95">
          <Plus className="w-5 h-5 sm:w-3.5 sm:h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}

// ── Category Section ──────────────────────────────────────────────────────────
function CategorySection({ category, products, bucket, onIncrement, onDecrement, onSet }) {
  const [open, setOpen] = useState(true);
  const meta = CATEGORY_META[category] || {};
  const Icon = meta.icon || Smartphone;
  const hasAny = products.some(p => (bucket[p.id] || 0) > 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <button onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 transition-colors ${hasAny ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`}>
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center ${hasAny ? 'bg-blue-600' : 'bg-slate-100'}`}>
            <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${hasAny ? 'text-white' : 'text-slate-500'}`} />
          </div>
          <span className="font-bold text-sm sm:text-base text-slate-800">{meta.label || category}</span>
          {hasAny && (
            <span className="text-[10px] sm:text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
              {products.filter(p => (bucket[p.id] || 0) > 0).length} selected
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {open && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 space-y-1.5 border-t border-slate-100">
          {products.map(p => (
            <ProductRow
              key={p.id}
              product={p}
              qty={bucket[p.id] || 0}
              onIncrement={() => onIncrement(p.id)}
              onDecrement={() => onDecrement(p.id)}
              onSet={v => onSet(p.id, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ label, value, target, achievement }) {
  const pct = Math.min(achievement * 100, 120);
  const colors = {
    blue: { bar: 'bg-blue-500', bg: 'bg-blue-100', text: 'text-blue-700' },
    green: { bar: 'bg-green-500', bg: 'bg-green-100', text: 'text-green-700' },
    red: { bar: 'bg-red-400', bg: 'bg-red-100', text: 'text-red-700' },
  };
  const c = achievement >= 1 ? colors.green : achievement >= 0.8 ? colors.blue : colors.red;

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium text-slate-600">{label}</span>
        <span className={`font-bold ${c.text}`}>{value}/{target} · {Math.round(achievement * 100)}%</span>
      </div>
      <div className={`h-2 rounded-full ${c.bg} overflow-hidden`}>
        <div className={`h-full rounded-full ${c.bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Nudge Card ────────────────────────────────────────────────────────────────
function NudgeCard({ nudge }) {
  const style = NUDGE_COLORS[nudge.type] || NUDGE_COLORS.focus;
  return (
    <div className={`rounded-xl border p-3 sm:p-3.5 ${style.bg} ${style.border}`}>
      <div className="flex items-start gap-2.5">
        <span className="text-lg sm:text-xl flex-shrink-0 mt-0.5">{nudge.emoji}</span>
        <div>
          <div className={`text-xs sm:text-sm font-bold ${style.text}`}>{nudge.title}</div>
          <div className={`text-[11px] sm:text-xs mt-0.5 ${style.text} opacity-80`}>{nudge.body}</div>
        </div>
      </div>
    </div>
  );
}

// ── SEC Payout Explanation Panel ─────────────────────────────────────────────
function SECExplanationPanel({ explanations }) {
  const [showExplanation, setShowExplanation] = useState(false);

  if (!explanations || explanations.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setShowExplanation(e => !e)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 hover:bg-slate-100 transition text-left"
      >
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>Why did I earn this payout? (Rule Explanations)</span>
        </div>
        {showExplanation ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {showExplanation && (
        <div className="p-3.5 sm:p-4 space-y-2.5 border-t border-slate-100 max-h-80 overflow-y-auto">
          {explanations.map((exp, i) => {
            const isEarned = exp.status === 'earned';
            return (
              <div
                key={i}
                className={`p-3 rounded-xl border text-xs ${isEarned ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    {isEarned ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                    {exp.name}
                  </span>
                  <span className="font-extrabold">{exp.amount > 0 ? `+₹${exp.amount.toLocaleString()}` : '₹0'}</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{exp.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Right Sidebar ─────────────────────────────────────────────────────────────
function ResultSidebar({ user, results, bucket, targetInnovative, targetFlagship, setTargetInnovative, setTargetFlagship, products, sidebarRef }) {
  const { breakdown, nudges, totalIncentive, explanations } = results;
  const cartItems = Object.entries(bucket).filter(([, u]) => u > 0)
    .map(([id, units]) => ({ product: products.find(x => x.id === id), units }))
    .filter(x => x.product);

  return (
    <div ref={sidebarRef} className="space-y-4 sm:space-y-5">
      {/* Promoter Info + Targets */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-slate-100">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <UserCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm">{user.name}</div>
            <div className="text-xs text-slate-500">Store: {user.storeCode}</div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Target className="w-3.5 h-3.5" />Innovative Target</label>
            <input type="number" min="1"
              className="w-16 text-center text-base sm:text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 sm:py-1 outline-none focus:ring-2 focus:ring-blue-400"
              value={targetInnovative} onChange={e => setTargetInnovative(parseInt(e.target.value) || 1)} />
          </div>
          <ProgressBar label="Innovative" value={breakdown.innovativeSales} target={targetInnovative} achievement={breakdown.innAchievement} />
          <div className="flex items-center justify-between gap-3 pt-1">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Star className="w-3.5 h-3.5" />Flagship Target</label>
            <input type="number" min="1"
              className="w-16 text-center text-base sm:text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 sm:py-1 outline-none focus:ring-2 focus:ring-blue-400"
              value={targetFlagship} onChange={e => setTargetFlagship(parseInt(e.target.value) || 1)} />
          </div>
          <ProgressBar label="Flagship" value={breakdown.flagshipSales} target={targetFlagship} achievement={breakdown.flagAchievement} />
        </div>
      </div>

      {/* Total Payout Card */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl shadow-blue-900/30 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Total Incentive</div>
          <div className="text-3xl sm:text-4xl font-black tracking-tight mb-4 sm:mb-5">₹{totalIncentive.toLocaleString('en-IN')}</div>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-blue-200">Innovative (A/F)</span>
              <span className={`font-bold ${breakdown.innovativeLocked ? 'text-red-300 line-through' : 'text-white'}`}>
                ₹{breakdown.innovative.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-200">Flagship (S/Z)</span>
              <span className={`font-bold ${breakdown.flagAchievement < 0.8 && breakdown.flagshipSales > 0 ? 'text-red-300 line-through' : 'text-white'}`}>
                ₹{breakdown.flagship.toLocaleString()}
              </span>
            </div>
            <div className="border-t border-blue-500/50 pt-2 mt-2 space-y-1.5">
              <div className="flex justify-between text-blue-200"><span>Wearables</span><span className="text-white font-semibold">₹{breakdown.wearables.toLocaleString()}</span></div>
              <div className="flex justify-between text-blue-200"><span>Tablets</span><span className="text-white font-semibold">₹{breakdown.tablets.toLocaleString()}</span></div>
              <div className="flex justify-between text-blue-200"><span>Notebooks</span><span className="text-white font-semibold">₹{breakdown.notebooks.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* SEC Payout Explanation Feature */}
      <SECExplanationPanel explanations={explanations} />

      {/* Cart Summary */}
      {cartItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-700 text-xs sm:text-sm">Sales Summary</span>
            <span className="ml-auto text-xs bg-slate-100 px-2 py-0.5 rounded-full font-semibold text-slate-500">{cartItems.length} SKUs</span>
          </div>
          <div className="divide-y divide-slate-50 max-h-52 overflow-y-auto">
            {cartItems.map(({ product: p, units }) => (
              <div key={p.id} className="flex items-center justify-between px-4 sm:px-5 py-2">
                <div className="text-xs text-slate-700 truncate flex-1 pr-2">
                  {p.flagship && <Star className="w-3 h-3 text-yellow-500 inline mr-1" />}
                  {p.model}
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0">{units}u</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nudges */}
      {nudges.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-slate-800 text-xs sm:text-sm">Earn More (Top Recommendations)</span>
          </div>
          {nudges.map((nudge, i) => <NudgeCard key={i} nudge={nudge} />)}
        </div>
      )}
    </div>
  );
}

// ── Calculator ────────────────────────────────────────────────────────────────
function PromoterCalculator({ user }) {
  const [bucket, setBucket] = useState({});
  const [targetInnovative, setTargetInnovative] = useState(40);
  const [targetFlagship, setTargetFlagship] = useState(5);

  const products = useMemo(() => getProducts(), []);
  const sidebarRef = React.useRef(null);

  const handleIncrement = id => setBucket(p => ({ ...p, [id]: (p[id] || 0) + 1 }));
  const handleDecrement = id => setBucket(p => {
    const next = (p[id] || 0) - 1;
    if (next <= 0) { const n = { ...p }; delete n[id]; return n; }
    return { ...p, [id]: next };
  });
  const handleSet = (id, val) => setBucket(p => {
    if (val <= 0) { const n = { ...p }; delete n[id]; return n; }
    return { ...p, [id]: val };
  });

  const results = useMemo(
    () => calculateIncentives(bucket, { innovative: targetInnovative, flagship: targetFlagship }),
    [bucket, targetInnovative, targetFlagship]
  );

  const categories = useMemo(() => {
    const cats = {};
    products.forEach(p => {
      if (!cats[p.category]) cats[p.category] = [];
      cats[p.category].push(p);
    });
    return cats;
  }, [products]);

  const catOrder = ['Smartphone', 'Wearable', 'Tablet', 'Notebook'];

  const scrollToSummary = () => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-6">
      <Header title="Calculator" />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">

        {/* LEFT: Model Catalog */}
        <div className="flex-1 min-w-0 space-y-3 sm:space-y-4 w-full">
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm">
            <p className="text-xs sm:text-sm text-slate-500">
              <span className="font-semibold text-slate-700">How to use:</span> Set your Innovative & Flagship targets on the right (or scroll down), then enter units sold for each model below. Your payout updates instantly.
            </p>
          </div>

          {catOrder.map(cat => categories[cat] ? (
            <CategorySection
              key={cat}
              category={cat}
              products={categories[cat]}
              bucket={bucket}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onSet={handleSet}
            />
          ) : null)}
        </div>

        {/* RIGHT: Sticky Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-20 space-y-5 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto pb-6">
          <ResultSidebar
            user={user}
            results={results}
            bucket={bucket}
            targetInnovative={targetInnovative}
            targetFlagship={targetFlagship}
            setTargetInnovative={setTargetInnovative}
            setTargetFlagship={setTargetFlagship}
            products={products}
            sidebarRef={sidebarRef}
          />
        </div>
      </div>

      {/* Floating Mobile Bottom Total Bar (Smartphones only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-3 z-40 flex items-center justify-between shadow-2xl">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Incentive</span>
          <span className="text-xl font-black text-white">₹{results.totalIncentive.toLocaleString('en-IN')}</span>
        </div>
        <button
          onClick={scrollToSummary}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-900/50 flex items-center gap-1.5"
        >
          View Breakdown <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <PromoterCalculator user={user} /> : <PromoterLogin onLogin={setUser} />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  );
}
