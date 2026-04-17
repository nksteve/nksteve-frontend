import { useQuery } from '@tanstack/react-query';
import { Loader2, Users, TrendingUp, Activity, Shield } from 'lucide-react';
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

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <Loader2 size={28} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function KPICard({ label, value, icon: Icon, color, sub }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{value}</div>
        <div style={{ fontSize: 13, color: C.text2 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminLandingPage() {
  const { user } = useAuthStore();
  const entityId = user?.entityId;
  const companyId = user?.companyId;

  const { data: setupData } = useQuery({
    queryKey: ['entitySetup', entityId],
    queryFn: () => api.getEntitySetup(entityId),
    enabled: !!entityId,
    select: r => r.data?.entity || {},
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const usersQuery = useQuery({
    queryKey: ['adminUsers', companyId],
    queryFn: () => api.getAdminUsers({ companyId }),
    select: (res) => res.data?.users || res.data?.result || [],
    enabled: !!companyId,
  });

  const plansQuery = useQuery({
    queryKey: ['allPlans', entityId],
    queryFn: () => api.getGrowthPlanDetails({ action: 'TeamGrowthPlans', entityId }),
    select: (res) => res.data?.plans || res.data?.result || [],
    enabled: !!entityId,
  });

  const activityQuery = useQuery({
    queryKey: ['entityActivityLog', entityId, companyId],
    queryFn: () => api.getEntityActivityLog({ entityId, companyId, action: 'GET' }),
    select: (res) => res.data?.activity || res.data?.result || [],
    enabled: !!entityId,
  });

  const users = usersQuery.data || [];
  const plans = plansQuery.data || [];
  const activities = activityQuery.data || [];
  const activeUsers = users.filter(u => u.statusId === 1 || u.status === 'Active');

  const isLoading = usersQuery.isLoading || plansQuery.isLoading;

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.text }}>
              Welcome back, {setupData?.firstName ? `${setupData.firstName} ${setupData.lastName || ''}`.trim() : (user?.email?.split('@')[0] || 'Admin')}
            </h1>
            <p style={{ margin: '2px 0 0', color: C.text2, fontSize: 14 }}>Admin Dashboard</p>
          </div>
        </div>
      </div>

      {isLoading && <Spinner />}

      {!isLoading && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
            <KPICard label="Total Users" value={users.length} icon={Users} color={C.primary} />
            <KPICard label="Active Users" value={activeUsers.length} icon={Activity} color={C.success} sub={`${users.length > 0 ? Math.round((activeUsers.length / users.length) * 100) : 0}% of total`} />
            <KPICard label="Total Plans" value={plans.length} icon={TrendingUp} color={C.warning} />
          </div>

          {/* Recent Activity */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} color={C.primary} />
              <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>Recent Activity</span>
            </div>
            {activityQuery.isLoading && <Spinner />}
            {!activityQuery.isLoading && activities.length === 0 && (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: C.text2 }}>No recent activity.</div>
            )}
            {activities.slice(0, 15).map((a, i) => (
              <div key={i} style={{
                padding: '14px 20px',
                borderBottom: i < Math.min(activities.length, 15) - 1 ? `1px solid ${C.border}` : 'none',
                display: 'flex',
                gap: 14,
                alignItems: 'center',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Activity size={16} color={C.primary} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: C.text }}>{a.auditMessage || a.message || a.activity}</div>
                  {a.email && <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{a.email}</div>}
                </div>
                <div style={{ fontSize: 12, color: C.text2, whiteSpace: 'nowrap' }}>{timeAgo(a.createdOn)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
