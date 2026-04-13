import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkPatient, registerPatient } from '../api';
import { Alert, Button, InputField, Spinner } from '../components/UI';
import { Phone, User, MapPin, FileText, Activity, ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react';

const STEPS = { MOBILE: 'mobile', DETAILS: 'details' };

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.MOBILE);
  const [form, setForm] = useState({ name: '', mobile: '', age: '', address: '', problem: '' });
  const [errors, setErrors] = useState({});
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [returning, setReturning] = useState(false);
  const mobileRef = useRef(null);

  useEffect(() => { mobileRef.current?.focus(); }, []);

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
  };

  const validateMobile = (mobile) => {
    if (!mobile) return 'Mobile number is required';
    if (!/^[6-9]\d{9}$/.test(mobile)) return 'Enter a valid 10-digit Indian mobile number';
    return '';
  };

  const handleMobileContinue = async () => {
    const err = validateMobile(form.mobile);
    if (err) { setErrors({ mobile: err }); return; }

    setChecking(true);
    setApiError('');
    try {
      const res = await checkPatient(form.mobile);
      if (res.data.exists) {
        const p = res.data.patient;
        setForm(f => ({
          ...f,
          name: p.name || '',
          age: p.age?.toString() || '',
          address: p.address || '',
        }));
        setReturning(true);
      }
      setStep(STEPS.DETAILS);
    } catch (err) {
      // Even on error, proceed (could be network issue with check)
      setStep(STEPS.DETAILS);
    }
    setChecking(false);
  };

  const validateDetails = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.problem.trim()) e.problem = 'Please describe your problem / symptoms';
    if (form.age && (isNaN(form.age) || form.age < 0 || form.age > 120)) e.age = 'Enter a valid age (0–120)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateDetails()) return;

    setLoading(true);
    setApiError('');
    try {
      const res = await registerPatient(form);
      navigate('/token', { state: { patient: res.data.patient, visit: res.data.visit, alreadyRegistered: res.data.alreadyRegistered } });
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      setApiError(msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-teal-800 flex flex-col">
    
  {/* 🔥 ADMIN LOGIN BUTTON */}
<div className="absolute top-4 right-4 z-50">
  <button
    onClick={() => navigate("/admin/login")}
  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg hover:scale-105 transition"
  >
    Admin Login
  </button>
</div>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-brand-400/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-center pt-10 pb-6 px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Activity size={30} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="font-display text-3xl font-black text-white tracking-tight">MediQueue</h1>
          <p className="text-white/50 text-sm font-medium mt-1">Patient Registration Portal</p>
        </div>
      </header>

      {/* Card */}
      <div className="relative z-10 flex-1 flex items-start justify-center px-4 pb-10">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">

          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-teal-500 transition-all duration-500"
              style={{ width: step === STEPS.MOBILE ? '40%' : '100%' }}
            />
          </div>

          <div className="p-6 sm:p-8">

            {/* Step 1: Mobile */}
            {step === STEPS.MOBILE && (
              <div className="animate-fade-in">
                <h2 className="font-display text-xl font-bold text-slate-800 mb-1">Enter Mobile Number</h2>
                <p className="text-slate-400 text-sm mb-6">We'll check if you're already registered with us</p>

                {apiError && <Alert type="error" message={apiError} className="mb-4" />}

                <div className="space-y-4">
                  <InputField
                    label="Mobile Number"
                    name="mobile"
                    type="tel"
                    inputMode="numeric"
                    value={form.mobile}
                    onChange={set('mobile')}
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    required
                    icon={<Phone size={16} />}
                    error={errors.mobile}
                    hint="Enter your 10-digit Indian mobile number"
                  />
                  <Button
                    fullWidth
                    size="lg"
                    onClick={handleMobileContinue}
                    loading={checking}
                    disabled={form.mobile.length !== 10}
                  >
                    {checking ? 'Checking...' : 'Continue'} {!checking && <ChevronRight size={18} />}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {step === STEPS.DETAILS && (
              <div className="animate-fade-in">
                {/* Back button */}
                <button
                  onClick={() => { setStep(STEPS.MOBILE); setReturning(false); setApiError(''); }}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm font-medium mb-5 transition-colors"
                >
                  <ArrowLeft size={15} /> Back
                </button>

                {/* Returning patient banner */}
                {returning && (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5">
                    <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-emerald-700 text-sm">Welcome back!</p>
                      <p className="text-emerald-600 text-xs">Your details have been auto-filled</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-5">
                  <h2 className="font-display text-xl font-bold text-slate-800">
                    {returning ? 'Confirm Details' : 'Patient Details'}
                  </h2>
                  <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">{form.mobile}</span>
                </div>

                {apiError && (
                  <Alert type="error" message={apiError} onClose={() => setApiError('')} className="mb-4" />
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <InputField
                    label="Full Name" name="name" value={form.name} onChange={set('name')}
                    placeholder="As on ID card" required icon={<User size={16} />}
                    error={errors.name}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Age" name="age" type="number" value={form.age} onChange={set('age')}
                      placeholder="Years" inputMode="numeric" error={errors.age}
                    />
                    <InputField
                      label="Mobile" name="mobile" value={form.mobile} onChange={set('mobile')}
                      disabled placeholder="Mobile" icon={<Phone size={16} />}
                    />
                  </div>

                  <InputField
                    label="Address" name="address" value={form.address} onChange={set('address')}
                    placeholder="Village / City / District" icon={<MapPin size={16} />}
                    rows={2}
                  />

                  <InputField
                    label="Problem / Symptoms" name="problem" value={form.problem} onChange={set('problem')}
                    placeholder="Describe your main problem or symptoms in detail..." required
                    icon={<FileText size={16} />} rows={3}
                    error={errors.problem}
                    hint="Be as specific as possible — this helps the doctor"
                  />

                  <Button type="submit" fullWidth size="lg" loading={loading}>
                    {loading ? 'Registering...' : '🎟️ Get Token Number'}
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 text-center">
            <p className="text-xs text-slate-400">
              🔒 Your data is secure and used only for medical purposes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
