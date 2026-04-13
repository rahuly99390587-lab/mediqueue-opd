import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, Button, InputField } from '../components/UI';
import { Activity, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) { setError('Please enter username and password'); return; }
    setLoading(true);
    setError('');
    try {
      await login(form.username.trim(), form.password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid username or password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 flex items-center justify-center p-4">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-18 h-18 w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-teal-500 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-brand-500/30">
            <Activity size={36} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="font-display text-3xl font-black text-white tracking-tight">MediQueue</h1>
          <p className="text-white/40 font-medium mt-2">Hospital OPD Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
          <div className="px-8 pt-8 pb-2">
            <h2 className="font-display text-2xl font-bold text-slate-800">Staff Login</h2>
            <p className="text-slate-400 text-sm mt-1">Sign in to access the admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8 space-y-4">
            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <InputField
              label="Username" name="username" value={form.username} onChange={set('username')}
              placeholder="Enter your username" required icon={<User size={16} />}
              autoComplete="username"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-600">Password <span className="text-red-400">*</span></label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock size={16} />
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-11 pr-11 py-3 rounded-xl border-2 border-slate-200 text-slate-800 placeholder:text-slate-300 font-medium text-sm transition-all duration-200 bg-white focus:outline-none focus:border-brand-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
              {loading ? 'Signing in...' : 'Sign In to Dashboard'}
            </Button>
          </form>

          {/* Demo credentials hint */}
          <div className="bg-slate-50 border-t border-slate-100 px-8 py-4">
            <p className="text-xs text-center text-slate-400">
              Default credentials: <span className="font-mono font-semibold text-slate-600">admin</span> / <span className="font-mono font-semibold text-slate-600">admin123</span>
            </p>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          © 2024 MediQueue Hospital OPD System
        </p>
      </div>
    </div>
  );
}
