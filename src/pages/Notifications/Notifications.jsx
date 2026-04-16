import { useQuery } from '@tanstack/react-query';
import { Loader2, Bell, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as api from '../../api/client';
import useAuthStore from '../../store/authStore';

const C = {
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  success: '#10B981',
  warning: '#F59E0B',
  surface: '#FFFFFF',
  bg: '#F8FAFC',
  border: '#E2E8F0',
  text: '#0F172A',
  text2: '#64748B',
};

const ACTIVITY_COLORS = {
  CREATEGP: { bg: '#DBEAFE', text: '#1D4ED8', bar: '#3B82F6' },
  ADDGOAL: { bg: '#D1FAE5', text: '#065F46', bar: '#10B981' },
  MEETING: { bg: '#EDE9FE', text: '#5B21B6', bar: '#7C3AED' },
  JOINMEETING: { bg: '#CCFBF1', text: '#0F766E', bar: '#14B8A6' },
  default: { bg: '#F1F5F9', text: '#475569', bar: '#94A3B8' },
};

function getActivityColor(type) {
  return ACTIVITY_COLORS[type] || ACTIVITY_COLORS.default;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function Notifications() {
  const { user } = useAuthStore();
  const entityId = user?.entityId;
  const companyId = user?.companyId;

  const { data: notifications = [], isLoading, isError } = useQuery({
    queryKey: ['notifications', entityId, companyId],
    queryFn: () => api.getNotifications({ entityId, companyId, action: 'GET' }),
    select: (res) => res.data?.notifications || res.data?.result || [],
    enabled: !!entityId,
  });

  // Build chart data: count by activity type
  const countMap = {};
  notifications.forEach(n => {
    const type = n.activity || 'OTHER';
    countMap[type] = (countMap[type] || 0) + 1;
  });
  const chartData = Object.entries(countMap).map(([type, count]) => ({ type, count }));

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.text }}>Notifications</h1>
        <p style={{ margin: '4px 0 0', color: C.text2, fontSize: 14 }}>{notifications.length} activities</p>
      </div>

      {isLoading && <Spinner />}
      {isError && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#EF4444', padding: 16, background: '#FEF2F2', borderRadius: 8, marginBottom: 20 }}>
          <AlertCircle size={16} /> Failed to load notifications.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Summary Chart */}
          {chartData.length > 0 && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 28 }}>
              <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: C.text }}>Activity Summary</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 12, fill: C.text2 }} />
                  <YAxis tick={{ fontSize: 12, fill: C.text2 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13 }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={getActivityColor(entry.type).bar} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Notification List */}
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: C.text2 }}>
              <Bell size={40} style={{ color: '#CBD5E1', marginBottom: 12 }} />
              <p style={{ margin: 0 }}>No notifications yet.</p>
            </div>
          ) : (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {notifications.map((n, i) => {
                const colors = getActivityColor(n.activity);
                return (
                  <div key={i} style={{
                    padding: '16px 20px',
                    borderBottom: i < notifications.length - 1 ? `1px solid ${C.border}` : 'none',
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = C.surface}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: colors.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Bell size={16} color={colors.text} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, color: C.text, lineHeight: 1.5 }}>
                        {n.auditMessage || n.message}
                      </p>
                      <div style={{ display: 'flex', gap: 10, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        {n.activity && (
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            background: colors.bg,
                            color: colors.text,
                            padding: '2px 8px',
                            borderRadius: 10,
                          }}>
                            {n.activity}
                          </span>
                        )}
                        <span style={{ fontSize: 12, color: C.text2 }}>{timeAgo(n.createdOn)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
