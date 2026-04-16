import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ArrowLeft, Target, Users, Video, FileText, Zap, Activity, Plus, X, ChevronDown, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
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

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Open: { bg: '#EEF2FF', color: '#4F46E5' },
    Active: { bg: '#EEF2FF', color: '#4F46E5' },
    Complete: { bg: '#ECFDF5', color: '#065F46' },
    Completed: { bg: '#ECFDF5', color: '#065F46' },
    default: { bg: '#F1F5F9', color: '#475569' },
  };
  const s = map[status] || map.default;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
      {status || 'Open'}
    </span>
  );
}

function ProgressBar({ value, total }) {
  const pct = total ? Math.min(100, Math.round((value / total) * 100)) : Math.min(100, Number(value) || 0);
  return (
    <div style={{ background: '#E2E8F0', borderRadius: 4, height: 6, overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? C.success : C.primary, borderRadius: 4 }} />
    </div>
  );
}

const TABS = [
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'contributors', label: 'Contributors', icon: Users },
  { id: 'meetings', label: 'Meetings', icon: Video },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'whatif', label: 'What-If', icon: Zap },
];

export default function PlanDetail() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const entityId = user?.entityId;
  const companyId = user?.companyId;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('goals');
  const [expandedGoals, setExpandedGoals] = useState({});
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ goalName: '', category: '', targetValue: '', endDate: '' });
  const [noteContent, setNoteContent] = useState('');

  const planQuery = useQuery({
    queryKey: ['planDetail', planId, entityId],
    queryFn: () => api.getGrowthPlanDetails({ action: 'GetPlanDetail', growthPlanId: planId, entityId }),
    select: (res) => res.data,
    enabled: !!planId && !!entityId,
  });

  const activityQuery = useQuery({
    queryKey: ['activity', entityId, companyId],
    queryFn: () => api.getEntityDisplayActivity({ entityId, companyId, filter1: 'ALL' }),
    select: (res) => res.data?.activities || res.data?.result || [],
    enabled: activeTab === 'activity' && !!entityId,
  });

  const contributorsQuery = useQuery({
    queryKey: ['contributors', planId, entityId],
    queryFn: () => api.getAllContributors({ entityId, companyId, growthPlanId: planId, action: 'GET' }),
    select: (res) => res.data?.contributors || res.data?.result || [],
    enabled: activeTab === 'contributors' && !!planId,
  });

  const meetingsQuery = useQuery({
    queryKey: ['planMeetings', planId, entityId],
    queryFn: () => api.getMeetingsByGrowthPlan({ growthPlanId: planId, entityId, companyId }),
    select: (res) => res.data?.meetings || res.data?.result || [],
    enabled: activeTab === 'meetings' && !!planId,
  });

  const notesQuery = useQuery({
    queryKey: ['planNotes', planId, entityId],
    queryFn: () => api.getCGPNotes({ growthPlanId: planId, entityId }),
    select: (res) => res.data?.notes || res.data?.result || [],
    enabled: activeTab === 'notes' && !!planId,
  });

  const addGoalMutation = useMutation({
    mutationFn: () => api.goalActionCreate({
      entityId,
      companyId,
      growthPlanId: planId,
      action: 'ADDGOAL',
      goalName: newGoal.goalName,
      category: newGoal.category,
      targetValue: Number(newGoal.targetValue),
      endDate: newGoal.endDate,
    }),
    onSuccess: () => {
      toast.success('Goal added!');
      queryClient.invalidateQueries(['planDetail', planId]);
      setShowGoalModal(false);
      setNewGoal({ goalName: '', category: '', targetValue: '', endDate: '' });
    },
    onError: () => toast.error('Failed to add goal'),
  });

  const addNoteMutation = useMutation({
    mutationFn: () => api.getCGPNotes({ action: 'ADD', growthPlanId: planId, entityId, noteContent }),
    onSuccess: () => {
      toast.success('Note added!');
      queryClient.invalidateQueries(['planNotes', planId]);
      setNoteContent('');
    },
    onError: () => toast.error('Failed to add note'),
  });

  // growthPlan is now a structured object (not an array)
  const rawData = planQuery.data || {};
  const plan = Array.isArray(rawData.growthPlan) ? (rawData.growthPlan[0] || {}) : (rawData.growthPlan || {});
  const goals = rawData.goals || [];
  const actions = rawData.actions || [];

  if (planQuery.isLoading) return <div style={{ padding: 32 }}><Spinner /></div>;
  if (planQuery.isError) return (
    <div style={{ padding: 32 }}>
      <div style={{ color: C.danger, display: 'flex', gap: 8, alignItems: 'center' }}>
        <AlertCircle size={16} /> Failed to load plan details.
      </div>
    </div>
  );

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      {/* Back + Header */}
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.text2, fontSize: 14, marginBottom: 20, padding: 0 }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ background: C.surface, borderRadius: 12, padding: 24, marginBottom: 24, border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: C.text }}>{plan.growthPlanName || 'Plan'}</h1>
            <div style={{ marginTop: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
              <StatusBadge status={plan.growthPlanStatus} />
              {plan.growthPlanMilestoneDate && (
                <span style={{ color: C.text2, fontSize: 13 }}>
                  Due: {new Date(plan.growthPlanMilestoneDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: C.text2 }}>Overall Progress</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{plan.growthPlanPercentAchieved || 0}%</span>
          </div>
          <ProgressBar value={plan.growthPlanPercentAchieved} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeTab === id ? 600 : 400,
              color: activeTab === id ? C.primary : C.text2,
              borderBottom: activeTab === id ? `2px solid ${C.primary}` : '2px solid transparent',
              marginBottom: -1,
              whiteSpace: 'nowrap',
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'goals' && (
        <GoalsTab
          goals={goals}
          actions={actions}
          expandedGoals={expandedGoals}
          setExpandedGoals={setExpandedGoals}
          onAddGoal={() => setShowGoalModal(true)}
        />
      )}
      {activeTab === 'activity' && (
        <ActivityTab query={activityQuery} />
      )}
      {activeTab === 'contributors' && (
        <ContributorsTab query={contributorsQuery} />
      )}
      {activeTab === 'meetings' && (
        <MeetingsTab query={meetingsQuery} />
      )}
      {activeTab === 'notes' && (
        <NotesTab
          query={notesQuery}
          noteContent={noteContent}
          setNoteContent={setNoteContent}
          onSave={() => addNoteMutation.mutate()}
          isSaving={addNoteMutation.isPending}
        />
      )}
      {activeTab === 'whatif' && <WhatIfTab />}

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: C.surface, borderRadius: 16, padding: 32, width: '100%', maxWidth: 460 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Add Goal</h2>
              <button onClick={() => setShowGoalModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {[
              { key: 'goalName', label: 'Goal Name *', type: 'text', placeholder: 'e.g. Improve public speaking' },
              { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Leadership' },
              { key: 'targetValue', label: 'Target Value', type: 'number', placeholder: '100' },
              { key: 'endDate', label: 'End Date', type: 'date' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{label}</label>
                <input
                  type={type}
                  value={newGoal[key]}
                  onChange={e => setNewGoal(g => ({ ...g, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={() => setShowGoalModal(false)} style={{ flex: 1, padding: 10, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Cancel</button>
              <button
                onClick={() => addGoalMutation.mutate()}
                disabled={addGoalMutation.isPending || !newGoal.goalName}
                style={{ flex: 1, padding: 10, background: C.primary, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#fff', opacity: addGoalMutation.isPending ? 0.7 : 1 }}
              >
                {addGoalMutation.isPending ? 'Adding…' : 'Add Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalsTab({ goals, actions, expandedGoals, setExpandedGoals, onAddGoal }) {
  const toggle = (id) => setExpandedGoals(e => ({ ...e, [id]: !e[id] }));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={onAddGoal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          <Plus size={14} /> Add Goal
        </button>
      </div>
      {goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: C.text2 }}>
          <Target size={40} style={{ color: '#CBD5E1', marginBottom: 12 }} />
          <p style={{ margin: 0 }}>No goals yet. Add your first goal.</p>
        </div>
      ) : (
        goals.map((goal, i) => {
          const goalActions = actions.filter(a => a.goalId === goal.goalId);
          const isExpanded = expandedGoals[goal.goalId];
          return (
            <div key={goal.goalId || i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
              <div
                onClick={() => toggle(goal.goalId)}
                style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
              >
                {isExpanded ? <ChevronDown size={16} color={C.text2} /> : <ChevronRight size={16} color={C.text2} />}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{goal.goalName}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {goal.category && <span style={{ fontSize: 12, color: C.text2, background: C.bg, padding: '2px 8px', borderRadius: 12 }}>{goal.category}</span>}
                      <StatusBadge status={goal.goalStatus} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ProgressBar value={goal.actualValue} total={goal.targetValue} />
                    <span style={{ fontSize: 12, color: C.text2, whiteSpace: 'nowrap' }}>
                      {goal.actualValue || 0} / {goal.targetValue || 0}
                    </span>
                  </div>
                </div>
              </div>
              {isExpanded && goalActions.length > 0 && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 20px 16px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Actions</div>
                  {goalActions.map((action, j) => (
                    <div key={action.actionId || j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: j < goalActions.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.primary, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: C.text }}>{action.actionName}</span>
                      {action.actionStatus && <StatusBadge status={action.actionStatus} />}
                    </div>
                  ))}
                </div>
              )}
              {isExpanded && goalActions.length === 0 && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 20px', color: C.text2, fontSize: 13 }}>
                  No actions for this goal.
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}



function ActivityTab({ query }) {
  if (query.isLoading) return <Spinner />;
  const items = query.data || [];
  if (!items.length) return <EmptyMsg msg="No activity yet." />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Activity size={16} color={C.primary} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, color: C.text }}>{item.auditMessage || item.message}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
              {item.activity && <span style={{ fontSize: 11, fontWeight: 600, color: C.primary, background: C.primaryLight, padding: '1px 6px', borderRadius: 10 }}>{item.activity}</span>}
              {item.createdOn && <span style={{ fontSize: 12, color: C.text2 }}>{new Date(item.createdOn).toLocaleDateString()}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ContributorsTab({ query }) {
  if (query.isLoading) return <Spinner />;
  const items = query.data || [];
  if (!items.length) return <EmptyMsg msg="No contributors found." />;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
      {items.map((c, i) => (
        <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            {(c.email || c.displayName || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{c.displayName || c.email}</div>
            {c.email && c.displayName && <div style={{ fontSize: 12, color: C.text2 }}>{c.email}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function MeetingsTab({ query }) {
  if (query.isLoading) return <Spinner />;
  const items = query.data || [];
  if (!items.length) return <EmptyMsg msg="No meetings for this plan." />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((m, i) => (
        <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{m.meetingTitle || m.title}</div>
            {m.meetingDate && <div style={{ fontSize: 13, color: C.text2, marginTop: 4 }}>{new Date(m.meetingDate).toLocaleString()}</div>}
          </div>
          {m.meetingStatus && <StatusBadge status={m.meetingStatus} />}
        </div>
      ))}
    </div>
  );
}

function NotesTab({ query, noteContent, setNoteContent, onSave, isSaving }) {
  if (query.isLoading) return <Spinner />;
  const items = query.data || [];
  return (
    <div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: C.text }}>Add Note</h3>
        <div style={{ marginBottom: 12 }}>
          <ReactQuill
            value={noteContent}
            onChange={setNoteContent}
            placeholder="Write your note here…"
            style={{ background: '#fff', borderRadius: 6 }}
          />
        </div>
        <button
          onClick={onSave}
          disabled={isSaving || !noteContent}
          style={{ padding: '9px 20px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, opacity: isSaving ? 0.7 : 1 }}
        >
          {isSaving ? 'Saving…' : 'Add Note'}
        </button>
      </div>
      {items.length === 0 && <EmptyMsg msg="No notes yet." />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((note, i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: C.text2, marginBottom: 8 }}>{note.createdOn ? new Date(note.createdOn).toLocaleString() : ''}</div>
            <div style={{ fontSize: 14, color: C.text }} dangerouslySetInnerHTML={{ __html: note.noteContent || note.content || '' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function WhatIfTab() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px', background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #EEF2FF, #C7D2FE)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Zap size={28} color={C.primary} />
      </div>
      <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: C.text }}>What-If Analysis</h2>
      <p style={{ margin: 0, color: C.text2, fontSize: 15, maxWidth: 400, margin: '0 auto' }}>
        Explore hypothetical scenarios to model different growth trajectories. This feature is coming soon.
      </p>
    </div>
  );
}

function EmptyMsg({ msg }) {
  return <div style={{ textAlign: 'center', padding: '60px 24px', color: C.text2 }}>{msg}</div>;
}

