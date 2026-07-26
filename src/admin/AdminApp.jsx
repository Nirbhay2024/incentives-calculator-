import React, { useEffect, useState } from 'react';
import { Layers, Package, Zap, Play, LogOut, ArrowLeft, ShieldCheck, Sparkles, Menu, X, RefreshCw } from 'lucide-react';
import { isAuthenticated, logout } from '../lib/auth';
import AdminLogin from './AdminLogin';
import { Dashboard } from './pages/Dashboard';
import { SchemeEditor } from './pages/SchemeEditor';
import { ProductManager } from './pages/ProductManager';
import { RuleManager } from './pages/RuleManager';
import { RuleWizard } from './pages/RuleWizard';
import { RuleTester } from './pages/RuleTester';

export default function AdminApp() {
  const [authed, setAuthed] = useState(null); // null = still checking
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    isAuthenticated().then(setAuthed);
  }, []);

  if (authed === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin onLoginSuccess={() => setAuthed(true)} />;
  }

  const handleLogout = async () => {
    await logout();
    setAuthed(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: Layers },
    { id: 'scheme', label: 'Scheme Settings', icon: Layers },
    { id: 'products', label: 'Product & DP Master', icon: Package },
    { id: 'rules', label: 'Rule Generator', icon: Zap },
    { id: 'tester', label: 'Rule Tester / Simulator', icon: Play },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Navigation Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-white">Admin Center</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(o => !o)}
          className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 flex-shrink-0`}>
        <div className="space-y-6">
          <div className="hidden md:flex items-center gap-2.5 px-2 py-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/50">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white block leading-tight">Incentives Engine</span>
              <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Admin Center</span>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id || (item.id === 'rules' && currentTab === 'wizard');
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <Icon className="w-4 h-4" /> {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-2 mt-4 md:mt-0">
          <a
            href="/"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Calculator
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-950/40 hover:bg-red-900/50 text-red-300 rounded-xl text-xs font-semibold transition border border-red-900/40"
          >
            <LogOut className="w-3.5 h-3.5" /> Lock / Logout
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl">
        {currentTab === 'dashboard' && <Dashboard onNavigate={(t) => setCurrentTab(t)} />}
        {currentTab === 'scheme' && <SchemeEditor />}
        {currentTab === 'products' && <ProductManager />}
        {currentTab === 'rules' && <RuleManager onCreateNewRule={() => setCurrentTab('wizard')} />}
        {currentTab === 'wizard' && <RuleWizard onComplete={() => setCurrentTab('rules')} />}
        {currentTab === 'tester' && <RuleTester />}
      </main>
    </div>
  );
}
