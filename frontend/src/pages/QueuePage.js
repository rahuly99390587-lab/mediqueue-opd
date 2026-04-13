import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayQueue } from '../api';
import { PageLoader, Alert, StatusBadge, SectionHeader, EmptyState, Card } from '../components/UI';
import { RefreshCw, ChevronRight, Clock } from 'lucide-react';

const TABS = [
  { key: 'all',       label: 'All',       dot: 'bg-slate-400' },
  { key: 'waiting',   label: 'Waiting',   dot: 'bg-amber-400' },
  { key: 'printed',   label: 'Printed',   dot: 'bg-blue-400' },
  { key: 'completed', label: 'Completed', dot: 'bg-emerald-400' },
];

export default function QueuePage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const fetchQueue = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await getTodayQueue();
      setQueue(res.data.queue || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load queue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchQueue(true), 30000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const filtered = activeTab === 'all' ? queue : queue.filter(v => v.status === activeTab);
  const counts = {
    all:       queue.length,
    waiting:   queue.filter(v => v.status === 'waiting').length,
    printed:   queue.filter(v => v.status === 'printed').length,
    completed: queue.filter(v => v.status === 'completed').length,
  };

  if (loading) return <PageLoader message="Loading today's queue..." />;

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        title="Today's Queue"
        subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        action={
          <button
            onClick={() => fetchQueue(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        }
      />

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: 'all', label: 'Total', color: 'bg-slate-100 text-slate-700' },
          { key: 'waiting', label: 'Waiting', color: 'bg-amber-50 text-amber-700 border border-amber-200' },
          { key: 'printed', label: 'Printed', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
          { key: 'completed', label: 'Done', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
        ].map(({ key, label, color }) => (
          <div key={key} className={`rounded-xl p-3 text-center ${color}`}>
            <p className="font-display text-2xl font-bold">{counts[key]}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ key, label, dot }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === key
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeTab === key ? 'bg-white' : dot}`} />
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {/* Queue List */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={activeTab === 'all' ? '🏥' : '✅'}
            title={activeTab === 'all' ? 'No patients registered yet' : `No ${activeTab} patients`}
            description={activeTab === 'all' ? 'Patients appear here as they register via the public portal' : `There are no patients with "${activeTab}" status`}
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((visit) => (
            <button
              key={visit.id}
              onClick={() => navigate(`/admin/visit/${visit.id}`)}
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-200 flex items-center gap-4 p-4 text-left group"
            >
              {/* Token block */}
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex flex-col items-center justify-center text-white flex-shrink-0 shadow-lg shadow-brand-500/25">
                <span className="text-[9px] font-semibold opacity-60 uppercase tracking-wider">Token</span>
                <span className="font-mono font-black text-xl leading-tight">{visit.token_no}</span>
              </div>

              {/* Patient info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-display font-bold text-slate-800 text-base truncate">{visit.name}</p>
                  {visit.visit_count > 5 && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5 flex-shrink-0">★ Frequent</span>
                  )}
                </div>
                <p className="text-sm text-slate-400 font-medium">
                  {visit.age ? `${visit.age} yrs` : 'Age N/A'} &bull; {visit.mobile}
                </p>
                {visit.problem && (
                  <p className="text-xs text-slate-400 mt-1 truncate">{visit.problem}</p>
                )}
              </div>

              {/* Status + arrow */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <StatusBadge status={visit.status} />
                <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-400 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Auto-refresh notice */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-2">
        <Clock size={11} />
        Auto-refreshes every 30 seconds
      </div>
    </div>
  );
}
