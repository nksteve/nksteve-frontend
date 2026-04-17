import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { RefreshCw, Plus, ChevronDown, ChevronRight, Loader2, AlertCircle, X, BarChart2, Target, Users, Video, FileText, Zap, Activity } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import * as api from '../../api/client';
import useAuthStore from '../../store/authStore';

const C = {
  teal: '#0197cc',
  tealDark: '#0086c0',
  purple: '#a25ddc',
  orange: '#ffa500',
  green: '#00e15a',
  bg: '#f4f5fa',
  white: '#ffffff',
  border: '#e4e7ea',
  text: '#23282c',
  text2: '#73818f',
};

/* ── Speedometer gauge (SVG) ── */
function Speedometer({ percent = 0 }) {
  // Map 0-100% to -135deg..+135deg (270deg arc)
  const angle = -135 + (percent / 100) * 270;
  const rad = (angle * Math.PI) / 180;
  const cx = 80, cy = 80, r = 55;
  const nx = cx + r * Math.cos(rad);
  const ny = cy + r * Math.sin(rad);

  // Color zones
  const color = percent >= 80 ? C.green : percent >= 50 ? C.teal : C.orange;

  // Arc path helper
  function arcPath(startDeg, endDeg, radius, arcColor) {
    const sr = (startDeg * Math.PI) / 180;
    const er = (endDeg * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(sr);
    const y1 = cy + radius * Math.sin(sr);
    const x2 = cx + radius * Math.cos(er);
    const y2 = cy + radius * Math.sin(er);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return (
      <path
        d={`M${x1} ${y1} A${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`}
        fill="none"
        stroke={arcColor}
        strokeWidth={8}
        strokeLinecap="round"
      />
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={160} height={110} viewBox="0 0 160 110">
        {/* Background arc */}
        {arcPath(-135, 45, 55, '#e4e7ea')}
        {/* Colored zone arcs */}
        {arcPath(-135, -45, 55, C.orange)}
        {arcPath(-45, 15, 55, C.teal)}
        {arcPath(15, 45, 55, C.green)}
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke="#333"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={4} fill="#333" />
        {/* Labels */}
        <text x={18} y={105} fontSize={9} fill={C.text2}>0</text>
        <text x={67} y={20} fontSize={9} fill={C.text2}>4</text>
        <text x={140} y={105} fontSize={9} fill={C.text2}>8</text>
        {/* 0% label */}
        <text x={cx - 10} y={cy + 22} fontSize={11} fill={C.text2} fontWeight="500">0%</text>
      </svg>
      <div>
        <div style={{ fontSize: 13, color: C.text2, marginBottom: 6 }}>Progress</div>
        <div style={{ position: 'relative', background: '#e4e7ea', borderRadius: 8, height: 28, width: 280, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, percent)}%`, height: '100%', background: color, borderRadius: 8, transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginTop: 6 }}>{Number(percent || 0).toFixed(2)}%</div>
      </div>
    </div>
  );
}

/* ── Action toolbar icons ── */
function ActionToolbar({ plan, onRefresh }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {[
        { title: 'Chart', icon: '📊' },
        { title: 'Edit', icon: '✏️' },
        { title: 'Bar Chart', icon: '📈' },
        { title: 'Palette', icon: '🎨' },
        { title: 'Print', icon: '🖨️' },
        { title: 'Stack', icon: '🗂️' },
        { title: 'Fire', icon: '🔥' },
        { title: 'Users', icon: '👥' },
      ].map(({ title, icon }) => (
        <button
          key={title}
          title={title}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 16, padding: '4px 6px', borderRadius: 4,
            color: C.teal,
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f0f4f8'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          {icon}
        </button>
      ))}
      <button
        onClick={onRefresh}
        style={{
          marginLeft: 8,
          background: C.teal, border: 'none', borderRadius: 6,
          cursor: 'pointer', padding: '6px 10px', color: '#fff',
          display: 'flex', alignItems: 'center',
        }}
        title="Refresh"
      >
        <RefreshCw size={16} />
      </button>
    </div>
  );
}

/* ── Goal row with progress slider ── */
function GoalRow({ goal, actions, isGoal = true, themeColor }) {
  const [expanded, setExpanded] = useState(false);
  const pct = isGoal
    ? Math.min(100, Number(goal.growthPlanPercentAchieved || goal.percentAchieved || 0))
    : Math.min(100, Number(goal.actualValue || 0) / Math.max(1, Number(goal.targetValue || 1)) * 100);

  const rowColor = themeColor || C.purple;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          background: isGoal ? rowColor : '#fff',
          borderBottom: `1px solid ${C.border}`,
          cursor: 'pointer',
          minHeight: 36,
        }}
        onClick={() => !isGoal && setExpanded(e => !e)}
      >
        {/* Checkbox placeholder */}
        <div style={{
          width: 16, height: 16, border: `1px solid ${isGoal ? '#fff' : '#adb5bd'}`,
          borderRadius: 3, flexShrink: 0, background: isGoal ? 'rgba(255,255,255,0.3)' : '#fff',
        }} />

        {/* Name */}
        <div style={{
          flex: '0 0 220px',
          fontSize: 13,
          fontWeight: isGoal ? 700 : 400,
          color: isGoal ? '#fff' : C.text,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {goal.goalName || goal.name || goal.actionName || '—'}
        </div>

        {/* Icons */}
        <div style={{ flex: '0 0 60px', display: 'flex', gap: 4 }}>
          <BarChart2 size={14} color={isGoal ? '#fff' : C.teal} />
          <Target size={14} color={isGoal ? '#fff' : C.teal} />
        </div>

        {/* Yellow circle indicator */}
        {!isGoal && (
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffc107', flexShrink: 0 }} />
        )}

        {/* Progress slider */}
        <div style={{ flex: 1, position: 'relative', height: 8, background: '#e4e7ea', borderRadius: 4 }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: isGoal ? 'rgba(255,255,255,0.6)' : (pct >= 100 ? C.green : pct > 0 ? '#2ecc71' : C.orange),
            borderRadius: 4,
          }} />
          {/* Slider thumb */}
          <div style={{
            position: 'absolute',
            left: `calc(${pct}% - 7px)`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 14, height: 14,
            borderRadius: '50%',
            background: isGoal ? '#fff' : C.teal,
            border: `2px solid ${isGoal ? rowColor : C.teal}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </div>

        {/* Percentage */}
        <div style={{ flex: '0 0 55px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: isGoal ? '#fff' : C.text }}>
          {pct.toFixed(1)}%
        </div>

        {/* Due date */}
        <div style={{ flex: '0 0 90px', textAlign: 'right', fontSize: 12, color: isGoal ? '#fff' : C.teal, fontWeight: 600 }}>
          {goal.milestoneDate || goal.endDate
            ? new Date(goal.milestoneDate || goal.endDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
            : <span style={{ color: isGoal ? 'rgba(255,255,255,0.5)' : '#cbd5e0' }}>📅</span>
          }
        </div>
      </div>

      {/* Actions under goal */}
      {!isGoal && expanded && actions && actions.length > 0 && (
        <div style={{ paddingLeft: 24 }}>
          {actions.map((action, i) => (
            <ActionRow key={action.actionId || i} action={action} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActionRow({ action }) {
  const pct = Math.min(100, Number(action.actualValue || 0) / Math.max(1, Number(action.targetValue || 1)) * 100);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 10px', borderBottom: `1px solid ${C.border}`,
      background: '#fff', minHeight: 32,
    }}>
      <div style={{ width: 16, height: 16, border: '1px solid #adb5bd', borderRadius: 3, flexShrink: 0 }} />
      <div style={{ flex: '0 0 220px', fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {action.actionName || '—'}
      </div>
      <div style={{ flex: '0 0 60px' }} />
      <div style={{ flex: '0 0 12px' }} />
      <div style={{ flex: 1, position: 'relative', height: 8, background: '#e4e7ea', borderRadius: 4 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? C.green : C.orange, borderRadius: 4 }} />
        <div style={{
          position: 'absolute', left: `calc(${pct}% - 7px)`, top: '50%', transform: 'translateY(-50%)',
          width: 14, height: 14, borderRadius: '50%', background: '#fff', border: `2px solid ${C.orange}`,
        }} />
      </div>
      <div style={{ flex: '0 0 55px', textAlign: 'right', fontSize: 12, color: C.text }}>{pct.toFixed(1)}%</div>
      <div style={{ flex: '0 0 90px', textAlign: 'right' }}>
        {action.endDate
          ? <span style={{ fontSize: 12, color: C.teal }}>{new Date(action.endDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
          : <span style={{ color: '#cbd5e0', fontSize: 12 }}>📅</span>
        }
      </div>
    </div>
  );
}

/* ── Tabs ── */
const TABS = [
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'contributors', label: 'Contributors', icon: Users },
  { id: 'meetings', label: 'Meetings', icon: Video },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'whatif', label: 'What-If', icon: Zap },
];

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <Loader2 size={28} color={C.teal} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── Main WorkPlan component ── */
export default function WorkPlan() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const entityId = user?.entityId;
  const companyId = user?.companyId;
  const queryClient = useQueryClient();

  const planId = searchParams.get('planId');
  const [activeTab, setActiveTab] = useState('goals');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ goalName: '', category: '', targetValue: '', endDate: '' });
  const [noteContent, setNoteContent] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // If no planId, show plan selector from dashboard plans
  const plansQuery = useQuery({
    queryKey: ['myPlans', entityId, companyId],
    queryFn: () => api.getGrowthPlanDetails({ action: 'MyAssignedGoals', entityId, companyId }),
    select: (res) => {
      const d = res.data || {};
      return d.growthPlan || d.plans || [];
    },
    enabled: !!entityId && !planId,
  });

  const planQuery = useQuery({
    queryKey: ['planDetail', planId, entityId, refreshKey],
    queryFn: () => api.getGrowthPlanDetails({ action: 'GetPlanDetail', growthPlanId: planId, entityId }),
    select: (res) => res.data,
    enabled: !!planId && !!entityId,
  });

  const activityQuery = useQuery({
    queryKey: ['planActivity', planId, entityId],
    queryFn: () => api.getEntityDisplayActivity({ entityId, companyId, filter1: 'ALL' }),
    select: (res) => res.data?.activities || res.data?.result || [],
    enabled: activeTab === 'activity' && !!entityId,
  });

  const contributorsQuery = useQuery({
    queryKey: ['contributors', planId, entityId],
    queryFn: () => api.getAllContributors({ entityId, companyId, growthPlanId: planId, action: 'GET' }),
    select: (res) => res.data?.EntityUser || res.data?.contributors || res.data?.result || [],
    enabled: activeTab === 'contributors' && !!planId,
  });

  const meetingsQuery = useQuery({
    queryKey: ['planMeetings', planId, entityId],
    queryFn: () => api.getMeetingsByGrowthPlan({ growthPlanId: planId, entityId, companyId }),
    select: (res) => res.data?.meeting || res.data?.meetings || res.data?.result || [],
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
      entityId, companyId, growthPlanId: planId,
      action: 'ADDGOAL', goalName: newGoal.goalName,
      category: newGoal.category, targetValue: Number(newGoal.targetValue), endDate: newGoal.endDate,
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

  // No planId → show plan list to select
  if (!planId) {
    return (
      <div style={{ padding: '24px 32px', background: C.bg, minHeight: '100vh' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>Work Plan</h2>
        <p style={{ color: C.text2, marginBottom: 24, fontSize: 14 }}>Select a plan to view details</p>
        {plansQuery.isLoading && <Spinner />}
        {!plansQuery.isLoading && (plansQuery.data || []).map((plan, i) => {
          const id = plan.growthPlanId || plan.planId;
          const pct = Number(plan.growthPlanPercentAchieved || 0);
          return (
            <div
              key={id || i}
              onClick={() => navigate(`/work-plan?planId=${id}`)}
              style={{
                background: C.white, borderRadius: 8, padding: '14px 20px',
                marginBottom: 10, cursor: 'pointer', border: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: 16,
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{plan.name || plan.growthPlanName}</div>
                {plan.ownerName && <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>Owner: {plan.ownerName}</div>}
              </div>
              <div style={{ flex: '0 0 200px' }}>
                <div style={{ background: '#e4e7ea', borderRadius: 4, height: 6 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: C.teal, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>{pct.toFixed(1)}%</div>
              </div>
            </div>
          );
        })}
        {!plansQuery.isLoading && (plansQuery.data || []).length === 0 && (
          <div style={{ color: C.text2, fontSize: 14 }}>No plans available.</div>
        )}
      </div>
    );
  }

  // Parse plan data
  const rawData = planQuery.data || {};
  const plan = Array.isArray(rawData.growthPlan) ? (rawData.growthPlan[0] || {}) : (rawData.growthPlan || {});
  const goals = rawData.goals || [];
  const actions = rawData.actions || [];
  const percent = Number(plan.growthPlanPercentAchieved || 0);
  const themeColor = plan.colorCodeHex ? `#${plan.colorCodeHex}` : C.purple;

  if (planQuery.isLoading) return <div style={{ padding: 32 }}><Spinner /></div>;
  if (planQuery.isError) return (
    <div style={{ padding: 32, color: '#ef4444', display: 'flex', gap: 8, alignItems: 'center' }}>
      <AlertCircle size={16} /> Failed to load plan. <button onClick={() => navigate('/work-plan')} style={{ marginLeft: 8, color: C.teal, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Go back</button>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      {/* Plan header */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '16px 32px' }}>
        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: themeColor }}>
            {plan.name || plan.growthPlanName || 'Plan'}
          </h1>
          <ActionToolbar plan={plan} onRefresh={() => { setRefreshKey(k => k + 1); queryClient.invalidateQueries(['planDetail', planId]); }} />
        </div>

        {/* Meta + Gauge row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
          {/* Due Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: C.text2 }}>Due Date</span>
            {plan.growthPlanMilestoneDate || plan.milestoneDate
              ? <span style={{
                  background: C.teal, color: '#fff', borderRadius: 4,
                  padding: '2px 10px', fontSize: 13, fontWeight: 600,
                }}>
                  {new Date(plan.growthPlanMilestoneDate || plan.milestoneDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                </span>
              : <span style={{ color: C.text2, fontSize: 13 }}>—</span>
            }
          </div>
          {/* Owner */}
          {(plan.ownerName || plan.firstName) && (
            <div style={{ fontSize: 13, color: C.text2 }}>
              Owner: <span style={{ color: C.text, fontWeight: 500 }}>{plan.ownerName || `${plan.firstName || ''} ${plan.lastName || ''}`.trim()}</span>
            </div>
          )}
          {/* Speedometer */}
          <Speedometer percent={percent} />
        </div>
      </div>

      {/* Goal list + right panel split */}
      <div style={{ display: 'flex', gap: 0, padding: '0 0' }}>
        {/* Left: Goal list */}
        <div style={{ flex: 1, minWidth: 0, borderRight: `1px solid ${C.border}` }}>
          {/* Table header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', background: C.white, borderBottom: `1px solid ${C.border}`,
          }}>
            {/* Toggle + Add */}
            <button
              onClick={() => setShowGoalModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: C.purple, color: '#fff', border: 'none',
                borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
              }}
            >
              <Plus size={14} /> Add New Goal
            </button>
            <div style={{ flex: 1 }} />
            {/* Column headers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.text2, fontWeight: 600 }}>
              <div style={{ flex: '0 0 220px' }}></div>
              <div style={{ flex: '0 0 60px' }}></div>
              <div style={{ flex: 1, textAlign: 'center' }}>Progress</div>
              <div style={{ flex: '0 0 55px', textAlign: 'right' }}></div>
              <div style={{ flex: '0 0 90px', textAlign: 'right' }}>Due Date</div>
            </div>
          </div>

          {/* Goals */}
          {goals.length === 0 && !planQuery.isLoading && (
            <div style={{ padding: 40, textAlign: 'center', color: C.text2, fontSize: 14 }}>No goals yet.</div>
          )}
          {goals.map((goal, i) => {
            const goalActions = actions.filter(a => a.goalId === goal.goalId);
            return (
              <div key={goal.goalId || i}>
                <GoalRow goal={goal} actions={goalActions} isGoal={false} themeColor={themeColor} />
              </div>
            );
          })}
        </div>

        {/* Right: Tabs panel */}
        <div style={{ flex: '0 0 520px', background: C.white }}>
          {/* Back link */}
          <div style={{ padding: '10px 20px', borderBottom: `1px solid ${C.border}` }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.teal, fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              ← Back
            </button>
          </div>

          {/* Plan title in right panel */}
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: C.text }}>{plan.name || plan.growthPlanName}</h2>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ background: '#e6f7fd', color: C.teal, fontSize: 12, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                {plan.growthPlanStatus || 'Open'}
              </span>
              {(plan.growthPlanMilestoneDate || plan.milestoneDate) && (
                <span style={{ fontSize: 12, color: C.text2 }}>
                  Due: {new Date(plan.growthPlanMilestoneDate || plan.milestoneDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
            {/* Overall progress bar */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.text2, marginBottom: 4 }}>
                <span>Overall Progress</span>
                <span style={{ fontWeight: 600, color: C.text }}>{percent.toFixed(2)}%</span>
              </div>
              <div style={{ background: '#e4e7ea', borderRadius: 4, height: 8 }}>
                <div style={{ width: `${percent}%`, height: '100%', background: C.teal, borderRadius: 4 }} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '10px 14px', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
                  fontWeight: activeTab === id ? 600 : 400,
                  color: activeTab === id ? C.teal : C.text2,
                  borderBottom: activeTab === id ? `2px solid ${C.teal}` : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: '16px 20px', overflowY: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
            {/* + Add Goal button in right panel */}
            {activeTab === 'goals' && (
              <div>
                <button
                  onClick={() => setShowGoalModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: C.purple, color: '#fff', border: 'none',
                    borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, marginBottom: 16,
                    marginLeft: 'auto',
                  }}
                >
                  <Plus size={14} /> Add Goal
                </button>
                {goals.length === 0 && <div style={{ color: C.text2, fontSize: 14 }}>No goals yet.</div>}
                {goals.map((goal, i) => {
                  const goalActions = actions.filter(a => a.goalId === goal.goalId);
                  return (
                    <div key={goal.goalId || i} style={{ marginBottom: 12, background: '#f8f9fa', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{goal.goalName || goal.name}</span>
                        <span style={{ background: '#e6f7fd', color: C.teal, fontSize: 11, padding: '1px 6px', borderRadius: 10 }}>{goal.goalStatus || 'Open'}</span>
                      </div>
                      {goalActions.map((a, j) => (
                        <div key={a.actionId || j} style={{ fontSize: 13, color: C.text, padding: '3px 0', borderTop: j === 0 ? `1px solid ${C.border}` : 'none', paddingLeft: 8 }}>
                          • {a.actionName} <span style={{ color: C.teal, fontSize: 11, marginLeft: 6 }}>{a.actionStatus || 'Open'}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'activity' && (
              activityQuery.isLoading ? <Spinner /> :
                (activityQuery.data || []).length === 0 ? <div style={{ color: C.text2, fontSize: 14 }}>No activity yet.</div> :
                  (activityQuery.data || []).map((item, i) => (
                    <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text }}>
                      <div>{item.auditMessage || item.message}</div>
                      {item.createdOn && <div style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>{new Date(item.createdOn).toLocaleString()}</div>}
                    </div>
                  ))
            )}

            {activeTab === 'contributors' && (
              contributorsQuery.isLoading ? <Spinner /> :
                (contributorsQuery.data || []).length === 0 ? <div style={{ color: C.text2, fontSize: 14 }}>No contributors.</div> :
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(contributorsQuery.data || []).map((c, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 10px', background: '#f8f9fa', borderRadius: 6 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.teal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                          {(c.firstName || c.email || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.firstName ? `${c.firstName} ${c.lastName || ''}`.trim() : c.email}</div>
                          {c.email && c.firstName && <div style={{ fontSize: 11, color: C.text2 }}>{c.email}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
            )}

            {activeTab === 'meetings' && (
              meetingsQuery.isLoading ? <Spinner /> :
                (meetingsQuery.data || []).length === 0 ? <div style={{ color: C.text2, fontSize: 14 }}>No meetings.</div> :
                  (meetingsQuery.data || []).map((m, i) => (
                    <div key={i} style={{ padding: '8px 10px', background: '#f8f9fa', borderRadius: 6, marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.meetingTitle || m.title}</div>
                      {m.meetingDate && <div style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>{new Date(m.meetingDate).toLocaleString()}</div>}
                    </div>
                  ))
            )}

            {activeTab === 'notes' && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <ReactQuill value={noteContent} onChange={setNoteContent} placeholder="Write your note here…" style={{ background: '#fff', borderRadius: 6 }} />
                  <button
                    onClick={() => addNoteMutation.mutate()}
                    disabled={addNoteMutation.isPending || !noteContent}
                    style={{ marginTop: 8, padding: '8px 18px', background: C.teal, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: addNoteMutation.isPending ? 0.7 : 1 }}
                  >
                    {addNoteMutation.isPending ? 'Saving…' : 'Add Note'}
                  </button>
                </div>
                {notesQuery.isLoading ? <Spinner /> : (notesQuery.data || []).map((note, i) => (
                  <div key={i} style={{ padding: '10px', background: '#f8f9fa', borderRadius: 6, marginBottom: 8, fontSize: 13, color: C.text }}>
                    <div style={{ fontSize: 11, color: C.text2, marginBottom: 4 }}>{note.createdOn ? new Date(note.createdOn).toLocaleString() : ''}</div>
                    <div dangerouslySetInnerHTML={{ __html: note.noteContent || note.content || '' }} />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'whatif' && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: C.text2 }}>
                <Zap size={32} color={C.teal} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>What-If Analysis</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>Explore hypothetical scenarios. Coming soon.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Add Goal</h2>
              <button onClick={() => setShowGoalModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            {[
              { key: 'goalName', label: 'Goal Name *', type: 'text', placeholder: 'e.g. Improve public speaking' },
              { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Leadership' },
              { key: 'targetValue', label: 'Target Value', type: 'number', placeholder: '100' },
              { key: 'endDate', label: 'End Date', type: 'date' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#374151' }}>{label}</label>
                <input
                  type={type} value={newGoal[key]} placeholder={placeholder}
                  onChange={e => setNewGoal(g => ({ ...g, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '9px 11px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = C.teal}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => setShowGoalModal(false)} style={{ flex: 1, padding: 9, background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Cancel</button>
              <button
                onClick={() => addGoalMutation.mutate()}
                disabled={addGoalMutation.isPending || !newGoal.goalName}
                style={{ flex: 1, padding: 9, background: C.purple, border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#fff', opacity: addGoalMutation.isPending ? 0.7 : 1 }}
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
