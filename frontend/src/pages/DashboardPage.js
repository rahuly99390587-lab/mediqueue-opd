import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { getDashboard } from '../api';
import {
  StatCard, PageLoader, Alert, Card, SectionHeader, EmptyState
} from '../components/UI';
import { Users, UserCheck, TrendingUp, Hash, RefreshCw, Award } from 'lucide-react';

const PIE_COLORS = ['#0ea5e9', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.value} patients
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await getDashboard();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <PageLoader message="Loading dashboard..." />;

  const { stats = {}, chartData = [], ageGroups = [], commonProblems = [], frequentVisitors = [] } = data || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Dashboard"
        subtitle={`OPD Overview · ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
        action={
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        }
      />

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={20} />}
          label="Total Patients"
          value={stats.totalPatients?.toLocaleString()}
          color="brand"
        />
        <StatCard
          icon={<UserCheck size={20} />}
          label="Today's Patients"
          value={stats.todayPatients}
          sub={`${stats.waitingCount} waiting`}
          color="teal"
          onClick={() => navigate('/admin/queue')}
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Yesterday"
          value={stats.yesterdayPatients}
          color="emerald"
        />
        <StatCard
          icon={<Hash size={20} />}
          label="Current Token"
          value={stats.currentToken ? `T-${stats.currentToken}` : '—'}
          sub="Highest today"
          color="amber"
          onClick={() => navigate('/admin/queue')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart */}
        <Card className="lg:col-span-2">
          <h3 className="font-display font-bold text-slate-700 text-base mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />
            Patient Registrations — Last 14 Days
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Plus Jakarta Sans' }}
                  tickLine={false} axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false} axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="count"
                  stroke="#0ea5e9" strokeWidth={2.5}
                  fill="url(#gradCount)"
                  dot={{ fill: '#0ea5e9', r: 3, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 5 }}
                  name="Patients"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="📊" title="No chart data yet" description="Register patients to see daily trends" />
          )}
        </Card>

        {/* Pie Chart */}
        <Card>
          <h3 className="font-display font-bold text-slate-700 text-base mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
            Age Distribution
          </h3>
          {ageGroups.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={ageGroups} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={70} innerRadius={40}
                    paddingAngle={3}
                  >
                    {ageGroups.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', fontFamily: 'Plus Jakarta Sans', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {ageGroups.map((g, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-500 truncate max-w-[120px]">{g.name}</span>
                    </div>
                    <span className="font-bold text-slate-700">{g.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState icon="🥧" title="No data yet" description="Add patient ages to see distribution" />
          )}
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Common Problems */}
        <Card>
          <h3 className="font-display font-bold text-slate-700 text-base mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            Most Common Problems
          </h3>
          {commonProblems.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={commonProblems.map(p => ({ ...p, name: p.name?.length > 20 ? p.name.slice(0, 18) + '…' : p.name }))}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} width={110} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', fontFamily: 'Plus Jakarta Sans', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 6, 6, 0]} name="Cases" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="🩺" title="No problems recorded" description="Patient problems will appear here" />
          )}
        </Card>

        {/* Frequent Visitors */}
        <Card>
          <h3 className="font-display font-bold text-slate-700 text-base mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Frequent Visitors
          </h3>
          {frequentVisitors.length > 0 ? (
            <div className="space-y-2">
              {frequentVisitors.map((p, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/admin/patient/${p.mobile}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm text-white flex-shrink-0"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  >
                    {p.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-700 text-sm truncate group-hover:text-brand-600 transition-colors">{p.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{p.mobile}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                      <Award size={10} /> {p.visit_count}
                    </span>
                    <span className="text-[10px] text-slate-300">{p.last_visit}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon="⭐" title="No frequent visitors" description="Patients with 3+ visits appear here" />
          )}
        </Card>
      </div>
    </div>
  );
}
