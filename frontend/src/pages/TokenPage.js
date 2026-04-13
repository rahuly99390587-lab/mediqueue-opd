import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Home, RotateCcw, User, Phone, MapPin, Calendar, Clock, AlertCircle } from 'lucide-react';

export default function TokenPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.visit || !state?.patient) {
    navigate('/register', { replace: true });
    return null;
  }

  const { patient, visit, alreadyRegistered } = state;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-teal-800 flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" />
        {/* Animated rings around token */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/5 rounded-full animate-pulse-soft" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/3 rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-sm">

        {/* Success icon */}
        <div className="flex justify-center mb-6 animate-pop-in">
          <div className="w-16 h-16 rounded-full bg-emerald-400/20 border-2 border-emerald-400/40 flex items-center justify-center">
            <CheckCircle size={32} className="text-emerald-400" strokeWidth={2} />
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">

          {/* Token hero */}
          <div className="bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),transparent_70%)]" />
            <p className="text-brand-300 text-xs font-bold uppercase tracking-[3px] mb-3">Your Token Number</p>
            <div className="font-mono font-black text-white leading-none mb-3"
              style={{ fontSize: 'clamp(64px, 20vw, 96px)', textShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
            >
              {visit.token_no}
            </div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5">
              <Calendar size={13} className="text-brand-200" />
              <span className="text-white/80 text-xs font-medium">
                {new Date(visit.visit_date + 'T00:00:00').toLocaleDateString('en-IN', {
                  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Instruction banner */}
          {alreadyRegistered ? (
            <div className="flex items-start gap-3 px-5 py-4 bg-amber-50 border-b border-amber-100">
              <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">Already Registered Today</p>
                <p className="text-amber-600 text-xs mt-0.5">This is your existing token for today's visit.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 px-5 py-4 bg-emerald-50 border-b border-emerald-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <p className="font-semibold text-emerald-800 text-sm">Registration Successful!</p>
                <p className="text-emerald-600 text-xs mt-0.5">
                  Please go to the counter and tell token <strong>{visit.token_no}</strong> to the staff.
                </p>
              </div>
            </div>
          )}

          {/* Patient details */}
          <div className="px-5 py-4 space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Patient Details</p>

            {[
              { icon: User, label: 'Name', value: patient.name },
              { icon: Phone, label: 'Mobile', value: patient.mobile, mono: true },
              { icon: User, label: 'Age', value: patient.age ? `${patient.age} years` : '—' },
              { icon: MapPin, label: 'Address', value: patient.address || '—' },
            ].map(({ icon: Icon, label, value, mono }) => (
              <div key={label} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                <Icon size={15} className="text-brand-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-400 text-xs w-14 flex-shrink-0 pt-0.5">{label}</span>
                <span className={`text-slate-700 text-sm font-medium flex-1 ${mono ? 'font-mono' : ''}`}>{value}</span>
              </div>
            ))}

            {visit.problem && (
              <div className="mt-3 p-3 bg-brand-50 rounded-xl border border-brand-100">
                <p className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-1.5">Problem Reported</p>
                <p className="text-sm text-slate-600 leading-relaxed">{visit.problem}</p>
              </div>
            )}

            <div className="flex items-center gap-2 mt-3 pt-1">
              <Clock size={13} className="text-amber-400" />
              <span className="text-xs text-slate-400">Status: </span>
              <span className="text-xs font-bold text-amber-600 uppercase">{visit.status}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 flex gap-3">
            <button
              onClick={() => navigate('/register')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              <RotateCcw size={15} /> New Registration
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 text-slate-500 font-semibold text-sm hover:bg-slate-200 transition-colors"
            >
              <Home size={15} />
            </button>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Please keep this token number safe
        </p>
      </div>
    </div>
  );
}
