import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Video, Plus, Clock, Calendar, X, Loader2, AlertCircle } from 'lucide-react';
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

function StatusBadge({ status }) {
  const map = {
    Scheduled: { bg: '#EEF2FF', color: '#4F46E5' },
    Completed: { bg: '#ECFDF5', color: '#065F46' },
    Cancelled: { bg: '#FEF2F2', color: '#991B1B' },
    default: { bg: '#F1F5F9', color: '#475569' },
  };
  const s = map[status] || map.default;
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{status || 'Scheduled'}</span>;
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function Meetings() {
  const { user } = useAuthStore();
  const entityId = user?.entityId;
  const companyId = user?.companyId;
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('upcoming');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    meetingTitle: '', meetingDate: '', meetingTime: '', growthPlanId: '', description: '',
  });

  const { data: meetings = [], isLoading, isError } = useQuery({
    queryKey: ['meetings', entityId, companyId],
    queryFn: () => api.getMeetings({ entityId, companyId }),
    select: (res) => res.data?.meetings || res.data?.result || [],
    enabled: !!entityId,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['myPlans', entityId],
    queryFn: () => api.getGrowthPlanDetails({ action: 'MyGrowthPlans', entityId }),
    select: (res) => res.data?.plans || res.data?.myPlans || [],
    enabled: !!entityId,
  });

  const scheduleMutation = useMutation({
    mutationFn: () => api.updateMeeting({
      action: 'ADD',
      entityId,
      companyId,
      meetingTitle: form.meetingTitle,
      meetingDate: form.meetingDate && form.meetingTime ? `${form.meetingDate}T${form.meetingTime}` : form.meetingDate,
      growthPlanId: form.growthPlanId || null,
      description: form.description,
    }),
    onSuccess: () => {
      toast.success('Meeting scheduled!');
      queryClient.invalidateQueries(['meetings']);
      setShowModal(false);
      setForm({ meetingTitle: '', meetingDate: '', meetingTime: '', growthPlanId: '', description: '' });
    },
    onError: () => toast.error('Failed to schedule meeting'),
  });

  const now = new Date();
  const upcoming = meetings.filter(m => !m.meetingDate || new Date(m.meetingDate) >= now);
  const past = meetings.filter(m => m.meetingDate && new Date(m.meetingDate) < now);
  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.text }}>Meetings</h1>
          <p style={{ margin: '4px 0 0', color: C.text2, fontSize: 14 }}>{meetings.length} total meetings</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus size={16} /> Schedule Meeting
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
        {[
          { id: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { id: 'past', label: `Past (${past.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 14, fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? C.primary : C.text2,
              borderBottom: tab === t.id ? `2px solid ${C.primary}` : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <Spinner />}
      {isError && (
        <div style={{ display: 'flex', gap: 8, color: '#EF4444', padding: 16, background: '#FEF2F2', borderRadius: 8, alignItems: 'center' }}>
          <AlertCircle size={16} /> Failed to load meetings.
        </div>
      )}

      {!isLoading && !isError && (
        displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: C.text2 }}>
            <Video size={40} style={{ color: '#CBD5E1', marginBottom: 12 }} />
            <p style={{ margin: 0 }}>No {tab} meetings found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayed.map((m, i) => (
              <div key={i} style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '18px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'box-shadow 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Video size={20} color={C.primary} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{m.meetingTitle || m.title}</div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
                      {m.meetingDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.text2 }}>
                          <Calendar size={12} />
                          {new Date(m.meetingDate).toLocaleDateString()}
                        </div>
                      )}
                      {m.meetingDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.text2 }}>
                          <Clock size={12} />
                          {new Date(m.meetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {m.growthPlanName && (
                        <span style={{ fontSize: 12, color: C.primary, background: C.primaryLight, padding: '2px 8px', borderRadius: 10 }}>
                          {m.growthPlanName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <StatusBadge status={m.meetingStatus} />
              </div>
            ))}
          </div>
        )
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: C.surface, borderRadius: 16, padding: 32, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Schedule Meeting</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {[
              { key: 'meetingTitle', label: 'Title *', type: 'text', placeholder: 'e.g. Q1 Review' },
              { key: 'meetingDate', label: 'Date', type: 'date' },
              { key: 'meetingTime', label: 'Time', type: 'time' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Growth Plan</label>
              <select
                value={form.growthPlanId}
                onChange={e => setForm(f => ({ ...f, growthPlanId: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' }}
              >
                <option value="">No Plan</option>
                {plans.map((p, i) => (
                  <option key={i} value={p.growthPlanId}>{p.growthPlanName}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Meeting agenda or notes…"
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 11, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Cancel</button>
              <button
                onClick={() => scheduleMutation.mutate()}
                disabled={scheduleMutation.isPending || !form.meetingTitle}
                style={{ flex: 1, padding: 11, background: C.primary, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#fff', opacity: scheduleMutation.isPending ? 0.7 : 1 }}
              >
                {scheduleMutation.isPending ? 'Scheduling…' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
