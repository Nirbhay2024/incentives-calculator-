import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { login, changePassword } from '../lib/auth';

export default function AdminLogin({ onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showChangePass, setShowChangePass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [changeMsg, setChangeMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login(password);
    setSubmitting(false);
    if (res.success) {
      onLoginSuccess();
    } else {
      setError(res.error);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangeMsg('');
    if (newPass.length < 8) {
      setChangeMsg('New password must be at least 8 characters long.');
      return;
    }
    if (newPass !== confirmPass) {
      setChangeMsg('New passwords do not match.');
      return;
    }
    setSubmitting(true);
    const res = await changePassword(oldPass, newPass);
    setSubmitting(false);
    if (res.success) {
      setChangeMsg('Password updated successfully! Logged in.');
      setTimeout(() => {
        onLoginSuccess();
      }, 800);
    } else {
      setChangeMsg(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-2xl shadow-indigo-900/50 mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Admin Control Center</h1>
          <p className="text-slate-400 text-sm mt-1">Incentives Engine Admin Access</p>
        </div>

        {!showChangePass ? (
          <form onSubmit={handleLogin} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 space-y-5 shadow-2xl">
            {error && (
              <div className="p-3.5 bg-red-950/60 border border-red-800/60 rounded-xl flex items-start gap-3 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Admin Password</label>
              <div className="relative">
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-900/50"
            >
              {submitting ? 'Checking…' : <>Access Admin Panel <ArrowRight className="w-4 h-4" /></>}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowChangePass(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition"
              >
                Change Admin Password
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" /> Change Admin Password
            </h3>

            {changeMsg && (
              <div className={`p-3 rounded-xl text-xs ${changeMsg.includes('successfully') ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300' : 'bg-red-950/60 border border-red-800 text-red-300'}`}>
                {changeMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
              <input
                required
                type="password"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
              <input
                required
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
              <input
                required
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowChangePass(false)}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-3 rounded-xl transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-2/3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold py-3 rounded-xl transition"
              >
                {submitting ? 'Saving…' : 'Save New Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
