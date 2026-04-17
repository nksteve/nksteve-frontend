import { useQuery } from '@tanstack/react-query';
import { Loader2, Users, Building, TrendingUp, Activity } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import * as api from '../../api/client';
import useAuthStore from '../../store/authStore';

const C = {
  primary: '#0197cc',
  primaryLight: '#e6f7fd',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
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

function KPICard({ label, value, sub, icon: Icon, color }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{value}</div>
          <div style={{ fontSize: 13, color: C.text2, marginTop: 4 }}>{label}</div>
          {sub && <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{sub}</div>}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={color} />
        </div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const today = new Date();
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(today.getDate() - 90);
  const startDate = ninetyDaysAgo.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  const loginQuery = useQuery({
    queryKey: ['analyticsLogin', companyId],
    queryFn: () => api.getReport({ _reportType: 'LOGIN', companyId, startDate, endDate, filterType: 'WEEK' }),
    select: (res) => res.data?.result || res.data?.data || [],
    enabled: !!companyId,
  });

  const participationQuery = useQuery({
    queryKey: ['analyticsParticipation', companyId],
    queryFn: () => api.getReport({ _reportType: 'PARTICIPATION', companyId, startDate, endDate, filterType: 'WEEK' }),
    select: (res) => res.data?.result || res.data?.data || [],
    enabled: !!companyId,
  });

  const analyticsCompanyQuery = useQuery({
    queryKey: ['analyticsCompany', companyId],
    queryFn: () => api.getAnalyticsCompany({ action: 'GET', companyId }),
    select: (res) => res.data?.result || res.data?.companies || [],
    enabled: !!companyId,
  });

  const loginData = loginQuery.data || [];
  const participationData = participationQuery.data || [];
  const companies = analyticsCompanyQuery.data || [];

  // Merge line chart data by date
  const dateMap = {};
  loginData.forEach(d => { dateMap[d.reportDate] = { ...(dateMap[d.reportDate] || {}), date: d.reportDate, logins: d.count }; });
  participationData.forEach(d => { dateMap[d.reportDate] = { ...(dateMap[d.reportDate] || {}), date: d.reportDate, participants: d.count }; });
  const trendData = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));

  const totalLogins = loginData.reduce((s, d) => s + (Number(d.count) || 0), 0);
  const totalParticipation = participationData.reduce((s, d) => s + (Number(d.count) || 0), 0);
  const trackedUsers = [...new Set(loginData.map(d => d.entityId).filter(Boolean))].length;
  const enabledCompanies = companies.filter(c => c.enabled || c.isEnabled).length;
  const disabledCompanies = companies.length - enabledCompanies;

  const pieDataCompany = [
    { name: 'Enabled', value: enabledCompanies },
    { name: 'Disabled', value: disabledCompanies },
  ].filter(d => d.value > 0);

  const pieDataActivity = [
    { name: 'Logins', value: totalLogins },
    { name: 'Participation', value: totalParticipation },
  ].filter(d => d.value > 0);

  const formatDate = (str) => {
    if (!str) return '';
    return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isLoading = loginQuery.isLoading || participationQuery.isLoading || analyticsCompanyQuery.isLoading;

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.text }}>Analytics</h1>
        <p style={{ margin: '4px 0 0', color: C.text2, fontSize: 14 }}>90-day platform overview</p>
      </div>

      {isLoading && <Spinner />}

      {!isLoading && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            <KPICard label="Total Logins (90d)" value={totalLogins} icon={TrendingUp} color={C.primary} />
            <KPICard label="Tracked Users" value={trackedUsers || loginData.length} icon={Users} color={C.success} />
            <KPICard label="Tracked Companies" value={companies.length} icon={Building} color={C.warning} />
            <KPICard
              label="Participation Rate"
              value={totalLogins > 0 ? `${Math.round((totalParticipation / totalLogins) * 100)}%` : '—'}
              icon={Activity}
              color='#EC4899'
            />
          </div>

          {/* Trend Line Chart */}
          {trendData.length > 0 && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: C.text }}>Weekly Trend</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: C.text2 }} />
                  <YAxis tick={{ fontSize: 11, fill: C.text2 }} allowDecimals={false} />
                  <Tooltip labelFormatter={v => formatDate(v)} contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Line type="monotone" dataKey="logins" stroke={C.primary} strokeWidth={2} dot={false} name="Logins" />
                  <Line type="monotone" dataKey="participants" stroke={C.success} strokeWidth={2} dot={false} name="Participants" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Bar Chart: Top Companies */}
            {companies.length > 0 && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, gridColumn: 'span 1' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: C.text }}>Companies</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={companies.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="companyName" tick={{ fontSize: 10, fill: C.text2 }} />
                    <YAxis tick={{ fontSize: 11, fill: C.text2 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="userCount" fill={C.primary} radius={[3, 3, 0, 0]} name="Users" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Pie: Enabled/Disabled */}
            {pieDataCompany.length > 0 && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: C.text }}>Company Status</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieDataCompany} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {pieDataCompany.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Pie: Login vs Participation */}
            {pieDataActivity.length > 0 && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: C.text }}>Activity Split</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieDataActivity} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {pieDataActivity.map((_, i) => <Cell key={i} fill={[C.primary, C.success][i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Company Registry Table */}
          {companies.length > 0 && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.text }}>Company Registry</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.bg }}>
                      {Object.keys(companies[0] || {}).slice(0, 8).map(col => (
                        <th key={col} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((c, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = C.bg}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {Object.values(c).slice(0, 8).map((val, j) => (
                          <td key={j} style={{ padding: '12px 16px', fontSize: 13, color: C.text, whiteSpace: 'nowrap' }}>
                            {typeof val === 'boolean' ? (
                              <span style={{
                                padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                                background: val ? '#D1FAE5' : '#FEE2E2',
                                color: val ? '#065F46' : '#991B1B',
                              }}>
                                {val ? 'Yes' : 'No'}
                              </span>
                            ) : String(val ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
