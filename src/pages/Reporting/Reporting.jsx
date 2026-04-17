import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, TrendingUp, Calendar, Star } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector,
} from 'recharts';
import * as api from '../../api/client';
import useAuthStore from '../../store/authStore';

const C = {
  primary: '#0197cc',
  primaryLight: '#e6f7fd',
  success: '#10B981',
  warning: '#F59E0B',
  surface: '#FFFFFF',
  bg: '#F8FAFC',
  border: '#E2E8F0',
  text: '#0F172A',
  text2: '#64748B',
};

const PIE_COLORS = [C.primary, C.success, C.warning, '#EC4899', '#0EA5E9'];

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function KPICard({ label, value, icon: Icon, color }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: 20,
      display: 'flex',
      gap: 16,
      alignItems: 'center',
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{value}</div>
        <div style={{ fontSize: 13, color: C.text2 }}>{label}</div>
      </div>
    </div>
  );
}

export default function Reporting() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState('DAY');

  const commonParams = { companyId, startDate, endDate, filterType };

  const loginQuery = useQuery({
    queryKey: ['reportLogin', commonParams],
    queryFn: () => api.getReport({ _reportType: 'LOGIN', ...commonParams }),
    select: (res) => res.data?.result || res.data?.data || [],
    enabled: !!companyId,
  });

  const participationQuery = useQuery({
    queryKey: ['reportParticipation', commonParams],
    queryFn: () => api.getReport({ _reportType: 'PARTICIPATION', ...commonParams }),
    select: (res) => res.data?.result || res.data?.data || [],
    enabled: !!companyId,
  });

  const loginData = loginQuery.data || [];
  const participationData = participationQuery.data || [];

  // Peak day
  const peakLogin = loginData.reduce((a, b) => (b.count > (a.count || 0) ? b : a), {});

  // Pie data
  const totalLogins = loginData.reduce((s, d) => s + (Number(d.count) || 0), 0);
  const totalParticipation = participationData.reduce((s, d) => s + (Number(d.count) || 0), 0);
  const pieData = [
    { name: 'Logins', value: totalLogins },
    { name: 'Participation', value: totalParticipation },
  ];

  const isLoading = loginQuery.isLoading || participationQuery.isLoading;

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.text }}>Reporting</h1>
        <p style={{ margin: '4px 0 0', color: C.text2, fontSize: 14 }}>Platform usage reports</p>
      </div>

      {/* Filters */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 28, display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {[
          { label: 'Start Date', key: 'start', value: startDate, setter: setStartDate },
          { label: 'End Date', key: 'end', value: endDate, setter: setEndDate },
        ].map(({ label, key, value, setter }) => (
          <div key={key}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
            <input
              type="date"
              value={value}
              onChange={e => setter(e.target.value)}
              style={{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', color: C.text }}
            />
          </div>
        ))}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Filter Type</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {['DAY', 'WEEK'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: '9px 16px',
                  background: filterType === type ? C.primary : C.bg,
                  color: filterType === type ? '#fff' : C.text2,
                  border: `1px solid ${filterType === type ? C.primary : C.border}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: filterType === type ? 600 : 400,
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && <Spinner />}

      {!isLoading && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
            <KPICard label="Total Logins" value={totalLogins} icon={TrendingUp} color={C.primary} />
            <KPICard label="Total Participation" value={totalParticipation} icon={Star} color={C.success} />
            {peakLogin.reportDate && (
              <KPICard label="Peak Login Day" value={formatDate(peakLogin.reportDate)} icon={Calendar} color={C.warning} />
            )}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: C.text }}>Login Activity</h3>
              {loginData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: C.text2, fontSize: 14 }}>No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={loginData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="reportDate" tickFormatter={formatDate} tick={{ fontSize: 11, fill: C.text2 }} />
                    <YAxis tick={{ fontSize: 11, fill: C.text2 }} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={v => formatDate(v)}
                      contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="count" stroke={C.primary} strokeWidth={2} dot={false} name="Logins" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: C.text }}>Participation</h3>
              {participationData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: C.text2, fontSize: 14 }}>No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={participationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="reportDate" tickFormatter={formatDate} tick={{ fontSize: 11, fill: C.text2 }} />
                    <YAxis tick={{ fontSize: 11, fill: C.text2 }} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={v => formatDate(v)}
                      contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="count" stroke={C.success} strokeWidth={2} dot={false} name="Participation" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Pie Chart */}
          {(totalLogins > 0 || totalParticipation > 0) && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', gap: 40 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: C.text }}>Login vs Participation</h3>
                <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>Total activity breakdown</p>
              </div>
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pieData.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: PIE_COLORS[i] }} />
                    <span style={{ fontSize: 13, color: C.text }}>{entry.name}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
