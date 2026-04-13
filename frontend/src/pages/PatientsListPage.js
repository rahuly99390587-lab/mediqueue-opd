import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPatients } from '../api';
import { PageLoader, Alert, Card, SectionHeader } from '../components/UI';
import { RefreshCw, ChevronRight, ChevronLeft, Award, Users } from 'lucide-react';

export default function PatientsListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ patients: [], pagination: { total: 0, page: 1, limit: 25, pages: 1 } });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const fetchPatients = useCallback(async (p = 1, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await getAllPatients(p, 25);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load patients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPatients(page); }, [fetchPatients, page]);

  const { patients = [], pagination } = data;

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <PageLoader message="Loading patients..." />;

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        title="All Patients"
        subtitle={`${pagination.total.toLocaleString()} registered patients total`}
        action={
          <button
            onClick={() => fetchPatients(page, true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        }
      />

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {patients.length === 0 ? (
        <Card className="py-4">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={56} className="text-slate-200 mb-4" />
            <h3 className="font-display font-semibold text-slate-500 text-lg">No patients registered yet</h3>
            <p className="text-slate-400 text-sm mt-2">Patients appear here after they register via the public portal</p>
          </div>
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['#', 'Patient', 'Mobile', 'Age', 'Address', 'Visits', 'Last Visit', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {patients.map((p, i) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/admin/patient/${p.mobile}`)}
                    className="hover:bg-brand-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3.5 text-xs font-mono text-slate-400">
                      {(page - 1) * 25 + i + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-teal-500 flex items-center justify-center font-display font-bold text-white text-sm flex-shrink-0 shadow-sm">
                          {p.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm group-hover:text-brand-700 transition-colors">{p.name}</p>
                          {p.visit_count > 5 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                              <Award size={9} /> Frequent
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-sm text-slate-600">{p.mobile}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-500">
                      {p.age || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-500 max-w-[200px]">
                      <span className="truncate block">{p.address || '—'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center font-bold text-xs px-2.5 py-1 rounded-full ${
                        p.visit_count > 5 ? 'bg-amber-100 text-amber-700' : 'bg-brand-50 text-brand-700'
                      }`}>
                        {p.visit_count}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      {p.last_visit
                        ? new Date(p.last_visit + 'T00:00:00').toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <ChevronRight size={16} className="text-slate-200 group-hover:text-brand-400 transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <p className="text-sm text-slate-500 font-medium">
                Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, pagination.total)} of {pagination.total.toLocaleString()} patients
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronLeft size={15} /> Prev
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let p;
                    if (pagination.pages <= 5) p = i + 1;
                    else if (page <= 3) p = i + 1;
                    else if (page >= pagination.pages - 2) p = pagination.pages - 4 + i;
                    else p = page - 2 + i;

                    return (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                          p === page
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                            : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.pages}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
