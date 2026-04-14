import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchPatients } from '../api';
import { Alert, StatusBadge, Card, EmptyState } from '../components/UI';
import { Search, Hash, Phone, User, ChevronRight, Calendar, Info } from 'lucide-react';

const SEARCH_TYPES = [
  {
    key: 'token',
    label: 'Token No.',
    icon: Hash,
    placeholder: 'Enter token number (e.g. T-12 or just 12)',
    hint: 'Searches today by default. Use the date picker to search past dates.',
  },
  {
    key: 'mobile',
    label: 'Mobile',
    icon: Phone,
    placeholder: 'Enter mobile number',
    hint: 'Searches all visits across all dates.',
  },
  {
    key: 'name',
    label: 'Name',
    icon: User,
    placeholder: 'Enter patient name (partial match)',
    hint: 'Searches all visits across all dates.',
  },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [type, setType] = useState('token');
  const [query, setQuery] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const current = SEARCH_TYPES.find(t => t.key === type);

  const handleTypeChange = (t) => {
    setType(t);
    setQuery('');
    setResults([]);
    setSearched(false);
    setError('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    setError('');
    try {
      const res = await searchPatients(q, type, type === 'token' ? date : undefined);
      setResults(res.data.results || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="mb-1">
        <h1 className="font-display text-2xl font-bold text-slate-800">Search Patient</h1>
        <p className="text-slate-400 text-sm mt-1">Find patients by token number, mobile, or name</p>
      </div>

      {/* Search Card */}
      <Card>
        {/* Type selector */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {SEARCH_TYPES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTypeChange(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                type === key
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                  : 'bg-slate-50 border-2 border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Search inputs */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={current.placeholder}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 text-slate-800 placeholder:text-slate-300 text-sm font-medium focus:outline-none focus:border-brand-400 transition-colors bg-white"
            />
          </div>

          {type === 'token' && (
            <div className="relative">
              <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 text-slate-700 text-sm font-medium focus:outline-none focus:border-brand-400 transition-colors bg-white"
              />
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white text-sm font-bold shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search size={15} />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Hint */}
        <div className="flex items-start gap-2 mt-3 text-xs text-slate-400">
          <Info size={12} className="mt-0.5 flex-shrink-0" />
          <span>{current.hint}</span>
        </div>
      </Card>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
          <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <span className="text-sm font-medium">Searching...</span>
        </div>
      )}

      {/* Results */}
      {!loading && searched && results.length === 0 && (
        <Card>
          <EmptyState
            icon="🔍"
            title="No results found"
            description={`No patients found for "${query}" ${type === 'token' ? `on ${date}` : ''}`}
          />
        </Card>
      )}

      {!loading && results.length > 0 && (
        <div>
          {/* Results header */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-600">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="space-y-2">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/admin/patient/${r.patient_id}`)}
                className="w-full bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-200 flex items-center gap-4 p-4 text-left group"
              >
                {/* Token */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex flex-col items-center justify-center text-white flex-shrink-0 shadow-lg shadow-brand-500/20">
                  <span className="text-[8px] font-semibold opacity-60 uppercase tracking-wider leading-none">Token</span>
                  <span className="font-mono font-black text-lg leading-tight">{r.token_no}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-display font-bold text-slate-800 text-sm truncate">{r.name}</p>
                    {r.visit_count > 5 && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 rounded-full px-1.5 py-0.5 border border-amber-200 flex-shrink-0">★ Frequent</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    📞 {r.mobile} &bull; {r.age ? `${r.age} yrs` : 'Age N/A'}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400">
                      📅 {new Date(r.visit_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    {r.problem && (
                      <span className="text-xs text-slate-400 truncate max-w-[200px]">
                        🩺 {r.problem}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status + arrow */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={r.status} />
                  <ChevronRight size={17} className="text-slate-300 group-hover:text-brand-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
