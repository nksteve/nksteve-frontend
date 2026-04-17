import { useState } from 'react';
import { Clock, Play, Pause, RefreshCw, CheckCircle, AlertCircle, Activity } from 'lucide-react';

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

const STATIC_CRONS = [
  {
    name: 'Daily Report Aggregation',
    schedule: '0 2 * * *',
    scheduleHuman: 'Every day at 2:00 AM',
    lastRun: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    status: 'Success',
    duration: '1m 23s',
    enabled: true,
  },
  {
    name: 'User Notification Digest',
    schedule: '0 8 * * 1-5',
    scheduleHuman: 'Weekdays at 8:00 AM',
    lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'Success',
    duration: '45s',
    enabled: true,
  },
  {
    name: 'Data Cleanup & Archival',
    schedule: '0 0 * * 0',
    scheduleHuman: 'Every Sunday at midnight',
    lastRun: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Failed',
    duration: '—',
    enabled: false,
  },
];

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusChip({ status }) {
  const isOk = status === 'Success';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {isOk ? <CheckCircle size={14} color={C.success} /> : <AlertCircle size={14} color={C.danger} />}
      <span style={{ fontSize: 12, fontWeight: 600, color: isOk ? C.success : C.danger }}>{status}</span>
    </div>
  );
}

export default function CronManagement() {
  const [crons, setCrons] = useState(STATIC_CRONS);

  const toggleEnabled = (i) => {
    setCrons(prev => prev.map((c, idx) => idx === i ? { ...c, enabled: !c.enabled } : c));
  };

  const runNow = (i) => {
    const name = crons[i].name;
    setCrons(prev => prev.map((c, idx) => idx === i ? { ...c, lastRun: new Date().toISOString(), status: 'Success' } : c));
    // Would trigger API call in real impl
    alert(`"${name}" triggered manually (placeholder).`);
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <Clock size={28} color={C.primary} />
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.text }}>Cron Job Management</h1>
          <p style={{ margin: '2px 0 0', color: C.text2, fontSize: 14 }}>Manage scheduled background tasks</p>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ background: C.primaryLight, border: `1px solid ${C.primary}`, borderRadius: 10, padding: '12px 18px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'center' }}>
        <Activity size={16} color={C.primary} />
        <span style={{ fontSize: 13, color: C.primary, fontWeight: 500 }}>
          Cron jobs are managed server-side. Status shown is illustrative. Contact your backend administrator to modify schedules.
        </span>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Jobs', value: crons.length, color: C.primary },
          { label: 'Enabled', value: crons.filter(c => c.enabled).length, color: C.success },
          { label: 'Failed', value: crons.filter(c => c.status === 'Failed').length, color: C.danger },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 22px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 13, color: C.text2, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {['Job Name', 'Schedule', 'Last Run', 'Status', 'Duration', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {crons.map((job, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: job.enabled ? C.success : '#CBD5E1', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14, color: C.text }}>{job.name}</div>
                      <div style={{ fontSize: 12, color: C.text2 }}>{job.scheduleHuman}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <code style={{ fontSize: 12, background: C.bg, padding: '2px 8px', borderRadius: 4, color: C.primary, fontWeight: 600 }}>
                    {job.schedule}
                  </code>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: C.text2 }}>
                  {timeAgo(job.lastRun)}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <StatusChip status={job.status} />
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: C.text2 }}>
                  {job.duration}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => runNow(i)}
                      title="Run Now"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: C.primaryLight, border: `1px solid ${C.primary}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C.primary }}
                    >
                      <Play size={11} /> Run
                    </button>
                    <button
                      onClick={() => toggleEnabled(i)}
                      title={job.enabled ? 'Disable' : 'Enable'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '5px 10px',
                        background: job.enabled ? '#FEF2F2' : '#ECFDF5',
                        border: `1px solid ${job.enabled ? '#FECACA' : '#6EE7B7'}`,
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        color: job.enabled ? C.danger : C.success,
                      }}
                    >
                      {job.enabled ? <><Pause size={11} /> Disable</> : <><Play size={11} /> Enable</>}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
