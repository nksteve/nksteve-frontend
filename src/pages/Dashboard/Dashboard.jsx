import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Calendar, Target, TrendingUp, Loader2, AlertCircle, X } from 'lucide-react';
import * as api from '../../api/client';
import useAuthStore from '../../store/authStore';

const C = {
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  surface: '#FFFFFF',
  bg: '#F8FAFC',
  border: '#E2E8F0',
  text: '#0F172A',
  text2: '#64748B',
};

const STATUS_COLORS = {
  Open: { bg: '#EEF2FF', text: '#4F46E5' },
  Active: { bg: '#EEF2FF', text: '#4F46E5' },
  Complete: { bg: '#ECFDF5', text: '#065F46' },
  Completed: { bg: '#ECFDF5', text: '#065F46' },
  'In Progress': { bg: '#FFF7ED', text: '#9A3412' },
  default: { bg: '#F1F5F9', text: '#475569' },
};

function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.default;
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      background: colors.bg,
      color: colors.text,
    }}>
      {status || 'Open'}
    </span>
  );
}

function ProgressBar({ value }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div style={{ background: '#E2E8F0', borderRadius: 4, height: 6, overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`,
        height: '100%',
        background: pct >= 100 ? C.success : C.primary,
        borderRadius: 4,
        transition: 'width 0.3s',
      }} />
    </div>
  );
}

function PlanCard({ plan, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 20,
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.15s',
        borderLeft: `4px solid ${plan.growthPlanColor || C.primary}`,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.text, flex: 1, marginRight: 12 }}>
          {plan.growthPlanName || 'Untitled Plan'}
        </h3>
        <StatusBadge status={plan.growthPlanStatus} />
      </div>
      {plan.growthPlanMilestoneDate && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.text2, fontSize: 13, marginBottom: 12 }}>
          <Calendar size={13} />
          <span>{new Date(plan.growthPlanMilestoneDate).toLocaleDateString()}</span>
        </div>
      )}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: C.text2 }}>Progress</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
            {plan.growthPlanPercentAchieved || 0}%
          </span>
        </div>
        <ProgressBar value={plan.growthPlanPercentAchieved} />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
      <Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', color: C.text2 }}>
      <Target size={40} style={{ color: '#CBD5E1', marginBottom: 16 }} />
      <p style={{ margin: 0, fontSize: 15 }}>{message}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const entityId = user?.entityId;
  const companyId = user?.companyId;
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('mine');
  const [showModal, setShowModal] = useState(false);
  const [newPlan, setNewPlan] = useState({ growthPlanName: '', growthPlanMilestoneDate: '', growthPlanColor: '#4F46E5' });

  const myPlansQuery = useQuery({
    queryKey: ['myPlans', entityId],
    queryFn: () => api.getGrowthPlanDetails({ action: 'MyGrowthPlans', entityId }),
    select: (res) => res.data?.plans || res.data?.myPlans || [],
    enabled: !!entityId,
  });

  const teamPlansQuery = useQuery({
    queryKey: ['teamPlans', entityId],
    queryFn: () => api.getCGPPlanByContributor({ entityId }),
    select: (res) => res.data?.result || [],
    enabled: !!entityId,
  });

  const createPlanMutation = useMutation({
    mutationFn: () => api.newGrowthPlan({
      entityId,
      companyId,
      growthPlanName: newPlan.growthPlanName,
      growthPlanMilestoneDate: newPlan.growthPlanMilestoneDate,
      growthPlanColor: newPlan.growthPlanColor,
    }),
    onSuccess: () => {
      toast.success('Plan created!');
      queryClient.invalidateQueries(['myPlans']);
      setShowModal(false);
      setNewPlan({ growthPlanName: '', growthPlanMilestoneDate: '', growthPlanColor: '#4F46E5' });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to create plan');
    },
  });

  const plans = tab === 'mine' ? myPlansQuery.data : teamPlansQuery.data;
  const isLoading = tab === 'mine' ? myPlansQuery.isLoading : teamPlansQuery.isLoading;
  const isError = tab === 'mine' ? myPlansQuery.isError : teamPlansQuery.isError;

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.text }}>Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: C.text2, fontSize: 14 }}>
            Welcome back, {user?.email?.split('@')[0] || 'there'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: C.primary,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} /> New Plan
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {[{ id: 'mine', label: 'My Plans' }, { id: 'team', label: 'Team Plans' }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? C.primary : C.text2,
              borderBottom: tab === t.id ? `2px solid ${C.primary}` : '2px solid transparent',
              marginBottom: -1,
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && <Spinner />}
      {isError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.danger, padding: 16, background: '#FEF2F2', borderRadius: 8 }}>
          <AlertCircle size={16} /> Failed to load plans. Please try again.
        </div>
      )}
      {!isLoading && !isError && (
        plans && plans.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {plans.map((plan, i) => (
              <PlanCard
                key={plan.growthPlanId || i}
                plan={plan}
                onClick={() => navigate(`/plan/${plan.growthPlanId}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState message={tab === 'mine' ? "No plans yet. Click '+ New Plan' to get started." : "No team plans found."} />
        )
      )}

      {/* New Plan Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
        }}>
          <div style={{ background: C.surface, borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>New Growth Plan</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text2 }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Plan Name *</label>
              <input
                type="text"
                value={newPlan.growthPlanName}
                onChange={e => setNewPlan(p => ({ ...p, growthPlanName: e.target.value }))}
                placeholder="e.g. Q1 Leadership Development"
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Milestone Date</label>
              <input
                type="date"
                value={newPlan.growthPlanMilestoneDate}
                onChange={e => setNewPlan(p => ({ ...p, growthPlanMilestoneDate: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Color Code</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#0EA5E9'].map(color => (
                  <button
                    key={color}
                    onClick={() => setNewPlan(p => ({ ...p, growthPlanColor: color }))}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: color,
                      border: newPlan.growthPlanColor === color ? `3px solid ${C.text}` : '3px solid transparent',
                      cursor: 'pointer',
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={newPlan.growthPlanColor}
                  onChange={e => setNewPlan(p => ({ ...p, growthPlanColor: e.target.value }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '11px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: C.text }}
              >
                Cancel
              </button>
              <button
                onClick={() => createPlanMutation.mutate()}
                disabled={createPlanMutation.isPending || !newPlan.growthPlanName}
                style={{
                  flex: 1, padding: '11px', background: C.primary, border: 'none', borderRadius: 8,
                  cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff',
                  opacity: createPlanMutation.isPending || !newPlan.growthPlanName ? 0.7 : 1,
                }}
              >
                {createPlanMutation.isPending ? 'Creating…' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
