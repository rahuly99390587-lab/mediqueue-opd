import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPatientHistory } from '../api';
import { PageLoader, Alert, Card, StatusBadge, Button } from '../components/UI';
import {
  ArrowLeft, Award, Calendar, ChevronRight, User, Phone,
  MapPin, Clock, Pill, Activity, RefreshCw
} from 'lucide-react';

const STATUS_DOT = {
  waiting:   'bg-amber-400',
  printed:   'bg-blue-400',
  completed: 'bg-emerald-400',
  cancelled: 'bg-slate-300',
};

export default function PatientHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getPatientHistory(id);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load patient history');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <PageLoader message="Loading patient history..." />;

  if (error) return (
    <div className="space-y-4">
      <Alert type="error" message={error} />
      <Button variant="secondary" onClick={() => navigate(-1)}>
        <ArrowLeft size={15} /> Go Back
      </Button>
    </div>
  );

  const { patient, visits = [], visitCount, isFrequent, lastVisit, previousMedicines = [] } = data || {};

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-semibold transition-colors bg-white border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 shadow-sm"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* LEFT: Patient card */}
        <div className="space-y-4">
          <Card>
            {/* Avatar */}
            <div className="text-center pb-5 mb-4 border-b border-slate-100">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 to-teal-500 flex items-center justify-center font-display font-black text-3xl text-white mx-auto mb-4 shadow-xl shadow-brand-500/25">
                {patient?.name?.[0]}
              </div>
              <h2 className="font-display font-bold text-slate-800 text-xl mb-3">{patient?.name}</h2>
              <div className="flex flex-wrap gap-2 justify-center">
                {isFrequent && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                    <Award size={12} /> Frequent Visitor
                  </span>
                )}
                <span className="text-xs font-bold text-brand-600 bg-brand-50 border border-brand-200 rounded-full px-3 py-1">
                  {visitCount} visit{visitCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Details */}
            {[
              { icon: <Phone size={14} />, label: 'Mobile', value: patient?.mobile, mono: true },
              { icon: <User size={14} />, label: 'Age', value: patient?.age ? `${patient.age} years` : 'Not provided' },
              { icon: <MapPin size={14} />, label: 'Address', value: patient?.address || 'Not provided' },
              {
                icon: <Calendar size={14} />, label: 'Registered',
                value: patient?.created_at
                  ? new Date(patient.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                  : '—'
              },
            ].map(({ icon, label, value, mono }) => (
              <div key={label} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-brand-400 flex-shrink-0">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className={`text-sm font-semibold text-slate-700 truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
                </div>
              </div>
            ))}

            {lastVisit && (
              <div className="mt-4 flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-xl p-3">
                <Clock size={14} className="text-brand-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">Last Visit</p>
                  <p className="text-sm font-semibold text-brand-700">
                    {new Date(lastVisit.visit_date + 'T00:00:00').toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Previous medicines */}
          {previousMedicines.length > 0 && (
            <Card>
              <h3 className="font-display font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
                <Pill size={15} className="text-brand-500" />
                Previous Medicines
              </h3>
              <div className="space-y-3">
                {previousMedicines.map((m, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {new Date(m.date + 'T00:00:00').toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      {m.diagnosis && ` · ${m.diagnosis}`}
                    </p>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{m.medicines}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT: Visit timeline */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-slate-800 text-lg flex items-center gap-2">
              <Activity size={18} className="text-brand-500" />
              Visit History ({visitCount})
            </h3>
          </div>

          {visits.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-4">📋</span>
                <p className="font-semibold text-slate-500">No visits recorded</p>
                <p className="text-slate-400 text-sm mt-1">This patient has no visit history</p>
              </div>
            </Card>
          ) : (
            <div className="relative">
              {/* Timeline vertical line */}
              <div className="absolute left-7 top-4 bottom-4 w-0.5 bg-gradient-to-b from-brand-200 to-slate-100 hidden sm:block" />

              <div className="space-y-3">
                {visits.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => navigate(`/admin/visit/${v.id}`)}
                    className="relative w-full flex items-start gap-4 bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-200 p-4 text-left group"
                  >
                    {/* Timeline dot */}
                    <div className={`hidden sm:flex w-6 h-6 rounded-full ${STATUS_DOT[v.status] || 'bg-slate-200'} border-2 border-white shadow flex-shrink-0 mt-1 z-10 items-center justify-center`}>
                      {i === 0 && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-brand-700 text-sm bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-lg">
                            {v.token_no}
                          </span>
                          <span className="text-sm text-slate-500 font-medium">
                            {new Date(v.visit_date + 'T00:00:00').toLocaleDateString('en-IN', {
                              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </span>
                          {i === 0 && (
                            <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 rounded-full px-2 py-0.5">LATEST</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={v.status} />
                          <ChevronRight size={15} className="text-slate-300 group-hover:text-brand-400 transition-colors" />
                        </div>
                      </div>

                      {v.problem && (
                        <p className="text-sm text-slate-600 mb-2 leading-relaxed">{v.problem}</p>
                      )}

                      {(v.diagnosis || v.medicines || v.expiry_date) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-50">
                          {v.diagnosis && (
                            <div className="text-xs text-slate-500">
                              <span className="font-semibold text-slate-600">Dx: </span>{v.diagnosis}
                            </div>
                          )}
                          {v.expiry_date && (
                            <div className="text-xs text-slate-500">
                              <span className="font-semibold text-slate-600">Next: </span>
                              {new Date(v.expiry_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          )}
                          {v.medicines && (
                            <div className="text-xs text-slate-500 sm:col-span-2 truncate">
                              <span className="font-semibold text-slate-600">Rx: </span>{v.medicines}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
