import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVisit, updateVisit } from '../api';
import {
  PageLoader, Alert, Card, StatusBadge, Button
} from '../components/UI';
import PrintSlip from '../components/PrintSlip';
import {
  ArrowLeft, Printer, Save, Edit3, X, CheckCircle,
  User, Phone, MapPin, Calendar, FileText, Stethoscope,
  Pill, StickyNote, Clock, Award
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'waiting',   label: '⏳ Waiting' },
  { value: 'printed',   label: '🖨️ Printed' },
  { value: 'completed', label: '✅ Completed' },
  { value: 'cancelled', label: '❌ Cancelled' },
];

export default function VisitPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    diagnosis: '', medicines: '', notes: '', expiry_date: '', status: 'waiting'
  });

  const fetchVisit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVisit(id);
      const v = res.data.visit;
      setVisit(v);
      setForm({
        diagnosis:   v.diagnosis   || '',
        medicines:   v.medicines   || '',
        notes:       v.notes       || '',
        expiry_date: v.expiry_date || '',
        status:      v.status      || 'waiting',
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load visit');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchVisit(); }, [fetchVisit]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await updateVisit(id, form);
      setVisit(v => ({ ...v, ...res.data.visit }));
      setEditing(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async () => {
    // Auto-mark as printed when printing
    if (visit?.status === 'waiting') {
      try {
        const updated = { ...form, status: 'printed' };
        const res = await updateVisit(id, updated);
        setVisit(v => ({ ...v, ...res.data.visit }));
        setForm(f => ({ ...f, status: 'printed' }));
      } catch {}
    }
    setShowPrint(true);
  };

  if (loading) return <PageLoader message="Loading visit..." />;
  if (!visit && error) return (
    <div className="space-y-4">
      <Alert type="error" message={error} />
      <Button variant="secondary" onClick={() => navigate(-1)}>
        <ArrowLeft size={15} /> Go Back
      </Button>
    </div>
  );

  const isFrequent = visit?.visitCount > 5;

  const fieldRow = (icon, label, value, mono = false) => (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
        {React.cloneElement(icon, { size: 15, className: 'text-brand-500' })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-semibold text-slate-700 mt-0.5 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
      </div>
    </div>
  );

  const doctorField = (key, label, icon, rows = 2, placeholder = '') => (
    <div>
      <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        {icon} {label}
      </label>
      {editing ? (
        <textarea
          value={form[key]}
          onChange={set(key)}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border-2 border-brand-200 text-slate-800 text-sm font-medium focus:outline-none focus:border-brand-400 bg-white resize-y transition-colors placeholder:text-slate-300"
        />
      ) : (
        <div className={`px-4 py-3 rounded-xl text-sm ${form[key] ? 'bg-slate-50 text-slate-700 font-medium' : 'bg-slate-50/50 text-slate-300 italic'} min-h-[${rows * 28}px] whitespace-pre-wrap leading-relaxed`}>
          {form[key] || `No ${label.toLowerCase()} recorded`}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="space-y-5 animate-fade-in no-print">

        {/* Top bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-semibold transition-colors bg-white border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 shadow-sm"
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl font-bold text-slate-800 truncate">
              Visit — {visit?.token_no} &bull; {visit?.name}
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {savedFlash && (
              <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl animate-fade-in">
                <CheckCircle size={14} /> Saved
              </span>
            )}
            {!editing ? (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                <Edit3 size={14} /> Edit
              </Button>
            ) : (
              <>
                <Button variant="secondary" size="sm" onClick={() => { setEditing(false); setError(''); }}>
                  <X size={14} /> Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
            <Button variant="teal" size="sm" onClick={handlePrint}>
              <Printer size={14} /> Print Slip
            </Button>
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* LEFT: Patient info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Patient card */}
            <Card>
              {/* Avatar row */}
              <div className="flex items-start gap-4 mb-4 pb-4 border-b border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-teal-500 flex items-center justify-center font-display font-bold text-white text-xl flex-shrink-0 shadow-lg shadow-brand-500/25">
                  {visit?.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display font-bold text-slate-800 text-lg leading-tight truncate">{visit?.name}</h2>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <StatusBadge status={form.status} />
                    {isFrequent && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                        <Award size={10} /> {visit.visitCount} visits
                      </span>
                    )}
                  </div>
                </div>
                {/* Token display */}
                <div className="bg-gradient-to-br from-brand-700 to-brand-900 text-white rounded-xl px-3 py-2 text-center flex-shrink-0 shadow-lg">
                  <p className="text-[9px] font-semibold opacity-60 uppercase tracking-wider">Token</p>
                  <p className="font-mono font-black text-2xl leading-none">{visit?.token_no}</p>
                </div>
              </div>

              {fieldRow(<Phone />, 'Mobile', visit?.mobile, true)}
              {fieldRow(<User />, 'Age', visit?.age ? `${visit.age} years` : null)}
              {fieldRow(<MapPin />, 'Address', visit?.address)}
              {fieldRow(<Calendar />, 'Visit Date', visit?.visit_date
                ? new Date(visit.visit_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                : null
              )}
            </Card>

            {/* Problem */}
            {visit?.problem && (
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={16} className="text-brand-500" />
                  <h3 className="font-display font-bold text-slate-700 text-sm uppercase tracking-wider">Chief Complaint</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed bg-brand-50 rounded-xl p-3 border border-brand-100">
                  {visit.problem}
                </p>
              </Card>
            )}

            {/* Patient history link */}
            <button
              onClick={() => navigate(`/admin/patient/${visit?.mobile}`)}
              className="w-full flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover p-4 text-left transition-all group"
            >
              <div>
                <p className="font-semibold text-slate-700 text-sm">View Full Patient History</p>
                <p className="text-xs text-slate-400 mt-0.5">{visit?.visitCount} total visit{visit?.visitCount !== 1 ? 's' : ''}</p>
              </div>
              <ArrowLeft size={16} className="text-slate-300 group-hover:text-brand-400 rotate-180 transition-colors" />
            </button>
          </div>

          {/* RIGHT: Doctor section */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-slate-800 text-base flex items-center gap-2">
                  <Stethoscope size={18} className="text-brand-500" />
                  Doctor's Notes
                </h3>
                {editing && (
                  <span className="text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-200 px-2 py-1 rounded-lg animate-pulse-soft">
                    Editing...
                  </span>
                )}
              </div>

              <div className="space-y-5">
                {/* Status */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Status</label>
                  {editing ? (
                    <select
                      value={form.status}
                      onChange={set('status')}
                      className="px-4 py-3 rounded-xl border-2 border-brand-200 text-slate-700 text-sm font-semibold focus:outline-none focus:border-brand-400 bg-white transition-colors w-full"
                    >
                      {STATUS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    <StatusBadge status={form.status} />
                  )}
                </div>

                {doctorField('diagnosis', 'Diagnosis', <Stethoscope size={12} />, 2, 'Enter diagnosis...')}
                {doctorField('medicines', 'Medicines & Dosage', <Pill size={12} />, 4, 'Enter medicines and dosage...\ne.g. Tab. Paracetamol 500mg - 1-0-1 x 5 days')}
                {doctorField('notes', 'Instructions / Notes', <StickyNote size={12} />, 3, 'Additional instructions or notes...')}

                {/* Next visit */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <Clock size={12} /> Next Visit Date
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      value={form.expiry_date}
                      onChange={set('expiry_date')}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 rounded-xl border-2 border-brand-200 text-slate-700 text-sm font-medium focus:outline-none focus:border-brand-400 bg-white transition-colors"
                    />
                  ) : (
                    <div className={`px-4 py-3 rounded-xl text-sm ${form.expiry_date ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200' : 'bg-slate-50/50 text-slate-300 italic'}`}>
                      {form.expiry_date
                        ? new Date(form.expiry_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                        : 'Not scheduled'
                      }
                    </div>
                  )}
                </div>

                {/* Save button inside card */}
                {editing && (
                  <div className="flex gap-3 pt-2 border-t border-slate-100">
                    <Button variant="secondary" size="md" onClick={() => { setEditing(false); setError(''); }} className="flex-1">
                      <X size={14} /> Cancel
                    </Button>
                    <Button variant="primary" size="md" onClick={handleSave} loading={saving} className="flex-1">
                      <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Print modal */}
      {showPrint && (
        <PrintSlip
          visit={{ ...visit, ...form }}
          onClose={() => setShowPrint(false)}
        />
      )}
    </>
  );
}
