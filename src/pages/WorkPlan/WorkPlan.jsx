import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  RefreshCw, Plus, Loader2, AlertCircle, X,
  BarChart2, Target, Users, Video, FileText, Zap, Activity, Filter,
} from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import * as api from '../../api/client';
import useAuthStore from '../../store/authStore';

const C = {
  teal:    '#0197cc',
  purple:  '#a25ddc',
  orange:  '#ffa500',
  green:   '#00e15a',
  bg:      '#f4f5fa',
  white:   '#ffffff',
  border:  '#e4e7ea',
  text:    '#23282c',
  text2:   '#73818f',
};

/* ─── Speedometer (SVG) ─────────────────────────────────────────────────────── */
function Speedometer({ percent = 0 }) {
  const angle = -135 + (percent / 100) * 270;
  const rad = (angle * Math.PI) / 180;
  const cx = 60, cy = 60, r = 42;
  const nx = cx + r * Math.cos(rad);
  const ny = cy + r * Math.sin(rad);
  const color = percent >= 80 ? C.green : percent >= 50 ? C.teal : C.orange;

  function arc(startDeg, endDeg, radius, stroke) {
    const sr = (startDeg * Math.PI) / 180;
    const er = (endDeg * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(sr), y1 = cy + radius * Math.sin(sr);
    const x2 = cx + radius * Math.cos(er), y2 = cy + radius * Math.sin(er);
    return (
      <path d={`M${x1} ${y1} A${radius} ${radius} 0 ${endDeg - startDeg > 180 ? 1 : 0} 1 ${x2} ${y2}`}
        fill="none" stroke={stroke} strokeWidth={7} strokeLinecap="round" />
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <svg width={120} height={84} viewBox="0 0 120 84">
        {arc(-135, 45, 42, '#e4e7ea')}
        {arc(-135, -45, 42, C.orange)}
        {arc(-45,  15,  42, C.teal)}
        {arc(15,   45,  42, C.green)}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#333" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={3.5} fill="#333" />
        <text x={6}  y={80} fontSize={8} fill={C.text2}>0</text>
        <text x={52} y={14} fontSize={8} fill={C.text2}>4</text>
        <text x={108} y={80} fontSize={8} fill={C.text2}>8</text>
      </svg>
      <div>
        <div style={{ fontSize: 12, color: C.text2, marginBottom: 5 }}>Progress</div>
        <div style={{ position: 'relative', background: '#e4e7ea', borderRadius: 6, height: 24, width: 240, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, percent)}%`, height: '100%', background: color, borderRadius: 6, transition: 'width .4s' }} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginTop: 5 }}>
          {Number(percent || 0).toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

/* ─── Toolbar icons — matches vembu exactly ─────────────────────────────────── */
const TOOLBAR_ICONS = [
  { title: 'Chart',    svg: <BarChart2 size={15} /> },
  { title: 'Edit',     svg: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
  { title: 'Trend',    svg: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { title: 'Palette',  svg: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2}><circle cx={12} cy={12} r={10}/><circle cx={8}  cy={14} r={1} fill="currentColor"/><circle cx={12} cy={8}  r={1} fill="currentColor"/><circle cx={16} cy={14} r={1} fill="currentColor"/></svg> },
  { title: 'Print',    svg: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x={6} y={14} width={12} height={8}/></svg> },
  { title: 'Stack',    svg: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={3}  width={20} height={4} rx={1}/><rect x={2} y={10} width={20} height={4} rx={1}/><rect x={2} y={17} width={20} height={4} rx={1}/></svg> },
  { title: 'Fire',     svg: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> },
  { title: 'Users',    svg: <Users size={15} /> },
];

function ActionToolbar({ onRefresh }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {TOOLBAR_ICONS.map(({ title, svg }) => (
        <button key={title} title={title}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px 6px', borderRadius: 4, color: C.teal, display: 'flex' }}
          onMouseEnter={e => e.currentTarget.style.background = '#f0f4f8'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >{svg}</button>
      ))}
      <button onClick={onRefresh}
        style={{ marginLeft: 6, background: C.teal, border: 'none', borderRadius: 6, cursor: 'pointer', padding: '6px 9px', color: '#fff', display: 'flex', alignItems: 'center' }}
        title="Refresh"
      ><RefreshCw size={15} /></button>
    </div>
  );
}

/* ─── Progress slider (read-only, matches vembu visual) ─────────────────────── */
function ProgressSlider({ pct, isGoal, themeColor }) {
  const p = Math.min(100, Math.max(0, Number(pct) || 0));
  // vembu color logic: orange <50%, teal-blue 50-80%, green >=80%
  const sliderColor = p < 50 ? C.orange : p < 80 ? '#008ECC' : '#0B6623';
  const trackBg  = isGoal ? 'rgba(255,255,255,0.30)' : '#e4e7ea';
  const fillBg   = isGoal ? 'rgba(255,255,255,0.80)' : sliderColor;
  const thumbColor = isGoal ? '#fff' : '#fff';
  const thumbBorder = isGoal ? (themeColor || C.purple) : sliderColor;

  return (
    <div style={{ flex: 1, position: 'relative', height: 8, background: trackBg, borderRadius: 4, margin: '0 6px' }}>
      <div style={{ width: `${p}%`, height: '100%', background: fillBg, borderRadius: 4, transition: 'width .3s' }} />
      <div style={{
        position: 'absolute', left: `calc(${p}% - 10px)`, top: '50%', transform: 'translateY(-50%)',
        width: 20, height: 20, borderRadius: '50%',
        background: thumbColor,
        border: `2px solid ${thumbBorder}`,
        boxShadow: '0 1px 3px rgba(0,0,0,.15)',
      }} />
    </div>
  );
}

/* ─── Goal header row — colored band like vembu ─────────────────────────────── */
function GoalHeaderRow({ goal, goalActions, themeColor, onGoalClick, isSelected }) {
  // Aggregate % from actions (average of actionGoalPercentAchieve)
  const actionPcts = goalActions.map(a => Number(a.actionGoalPercentAchieve || 0));
  const aggPct = actionPcts.length > 0
    ? actionPcts.reduce((s, v) => s + v, 0) / actionPcts.length
    : Number(goal.goalPercentAchieved || 0);
  const pct = Math.min(100, aggPct);

  const bg = themeColor || C.purple;
  const milestoneDate = goal.goalMilestoneDate || goal.milestoneDate;

  return (
    <div
      onClick={() => onGoalClick && onGoalClick(goal)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 10px', height: 38,
        background: bg,
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* Checkbox */}
      <div style={{ width: 15, height: 15, border: '1px solid rgba(255,255,255,0.7)', borderRadius: 3, flexShrink: 0, background: 'rgba(255,255,255,0.2)' }} />

      {/* Name */}
      <div style={{ flex: '0 0 200px', fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {goal.goalName || goal.name || '—'}
      </div>

      {/* Icons */}
      <div style={{ flex: '0 0 44px', display: 'flex', gap: 5, alignItems: 'center' }}>
        <BarChart2 size={13} color="rgba(255,255,255,0.8)" />
        <Target    size={13} color="rgba(255,255,255,0.8)" />
      </div>

      {/* Yellow dot */}
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffc107', flexShrink: 0 }} />

      {/* Slider */}
      <ProgressSlider pct={pct} isGoal={true} themeColor={bg} />

      {/* % */}
      <div style={{ flex: '0 0 52px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#fff' }}>
        {pct.toFixed(1)}%
      </div>

      {/* Due date */}
      <div style={{ flex: '0 0 92px', textAlign: 'right', fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
        {milestoneDate
          ? new Date(milestoneDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
          : <span style={{ opacity: 0.5 }}>📅</span>
        }
      </div>

      {/* Delete icon */}
      <div style={{ flex: '0 0 22px', display: 'flex', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </div>
    </div>
  );
}

/* ─── Action sub-row ─────────────────────────────────────────────────────────── */
function ActionSubRow({ action, themeColor }) {
  const pct = Math.min(100, Number(action.actionGoalPercentAchieve || 0));
  const endDate = action.endDate || action.milestoneDate;
  const planColor = themeColor || C.teal;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '0 10px', height: 36,
      background: C.white,
      borderBottom: `1px solid ${C.border}`,
    }}>
      {/* Checkbox */}
      <div style={{ width: 15, height: 15, border: '1px solid #adb5bd', borderRadius: 3, flexShrink: 0 }} />

      {/* Name — vembu style: white bg, colored border, colored text */}
      <div style={{
        flex: '0 0 190px',
        fontSize: 12.5,
        color: planColor,
        border: `1px solid ${planColor}`,
        background: '#fff',
        borderRadius: 3,
        padding: '2px 6px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {action.actionName || '—'}
      </div>

      {/* Icons — bar-chart + asterisk/decision in plan color like vembu */}
      <div style={{ flex: '0 0 40px', display: 'flex', gap: 4, alignItems: 'center' }}>
        <BarChart2 size={12} color={planColor} />
        <Target    size={12} color={planColor} />
      </div>

      {/* Yellow dot */}
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffc107', flexShrink: 0 }} />

      {/* Slider */}
      <ProgressSlider pct={pct} isGoal={false} themeColor={planColor} />

      {/* % */}
      <div style={{ flex: '0 0 52px', textAlign: 'right', fontSize: 12.5, fontWeight: 600, color: C.text }}>
        {pct.toFixed(1)}%
      </div>

      {/* Due date */}
      <div style={{ flex: '0 0 92px', textAlign: 'right' }}>
        {endDate
          ? <span style={{ fontSize: 12, color: C.teal, fontWeight: 600 }}>
              {new Date(endDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
            </span>
          : <span style={{ color: '#cbd5e0', fontSize: 13 }}>📅</span>
        }
      </div>

      {/* Delete icon */}
      <div style={{ flex: '0 0 22px', display: 'flex', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke={C.text2} strokeWidth={2}>
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </div>
    </div>
  );
}

/* ─── Tabs ───────────────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'goals',        label: 'Goals',        Icon: Target   },
  { id: 'activity',     label: 'Activity',     Icon: Activity },
  { id: 'contributors', label: 'Contributors', Icon: Users    },
  { id: 'meetings',     label: 'Meetings',     Icon: Video    },
  { id: 'notes',        label: 'Notes',        Icon: FileText },
  { id: 'whatif',       label: 'What-If',      Icon: Zap      },
];

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <Loader2 size={26} color={C.teal} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ─── Main WorkPlan ──────────────────────────────────────────────────────────── */
export default function WorkPlan() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { user }       = useAuthStore();
  const entityId       = user?.entityId;
  const companyId      = user?.companyId;
  const queryClient    = useQueryClient();

  const planId = searchParams.get('planId');
  const [activeTab,     setActiveTab]     = useState('goals');
  const [selectedGoal,  setSelectedGoal]  = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal,       setNewGoal]       = useState({ goalName: '', category: '', targetValue: '', endDate: '' });
  const [noteContent,   setNoteContent]   = useState('');
  const [refreshKey,    setRefreshKey]    = useState(0);

  /* ── queries ── */
  const plansQuery = useQuery({
    queryKey: ['myPlans', entityId, companyId],
    queryFn:  () => api.getGrowthPlanDetails({ action: 'MyAssignedGoals', entityId, companyId }),
    select:   r  => { const d = r.data || {}; return d.plans || d.growthPlan || []; },
    enabled:  !!entityId && !planId,
  });

  const planQuery = useQuery({
    queryKey: ['planDetail', planId, entityId, refreshKey],
    queryFn:  () => api.getGrowthPlanDetails({ action: 'GetPlanDetail', growthPlanId: planId, entityId, companyId }),
    select:   r  => r.data,
    enabled:  !!planId && !!entityId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const activityQuery = useQuery({
    queryKey: ['planActivity', planId, entityId],
    queryFn:  () => api.getEntityDisplayActivity({ entityId, companyId, filter1: 'ALL' }),
    select:   r  => r.data?.activities || r.data?.result || [],
    enabled:  activeTab === 'activity' && !!entityId,
  });

  const contributorsQuery = useQuery({
    queryKey: ['contributors', planId, entityId],
    queryFn:  () => api.getAllContributors({ entityId, companyId, growthPlanId: planId, action: 'GET' }),
    select:   r  => r.data?.EntityUser || r.data?.contributors || r.data?.result || [],
    enabled:  activeTab === 'contributors' && !!planId,
  });

  const meetingsQuery = useQuery({
    queryKey: ['planMeetings', planId, entityId],
    queryFn:  () => api.getMeetingsByGrowthPlan({ growthPlanId: planId, entityId, companyId }),
    select:   r  => r.data?.meeting || r.data?.meetings || r.data?.result || [],
    enabled:  activeTab === 'meetings' && !!planId,
  });

  const notesQuery = useQuery({
    queryKey: ['planNotes', planId, entityId],
    queryFn:  () => api.getCGPNotes({ growthPlanId: planId, entityId }),
    select:   r  => r.data?.notes || r.data?.result || [],
    enabled:  activeTab === 'notes' && !!planId,
  });

  /* ── mutations ── */
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

  const doRefresh = () => {
    setRefreshKey(k => k + 1);
    queryClient.invalidateQueries(['planDetail', planId]);
  };

  /* ── No planId — show plan selector ── */
  if (!planId) {
    return (
      <div style={{ padding: '24px 32px', background: C.bg, minHeight: '100vh' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>Work Plan</h2>
        <p style={{ color: C.text2, marginBottom: 24, fontSize: 14 }}>Select a plan to view details</p>
        {plansQuery.isLoading && <Spinner />}
        {(plansQuery.data || []).map((plan, i) => {
          const id  = plan.growthPlanId || plan.planId;
          const pct = Number(plan.growthPlanPercentAchieved || 0);
          return (
            <div key={id || i} onClick={() => navigate(`/work-plan?planId=${id}`)}
              style={{ background: C.white, borderRadius: 8, padding: '14px 20px', marginBottom: 10, cursor: 'pointer', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 16 }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.08)'}
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

  /* ── Parse plan data ── */
  const rawData  = planQuery.data || {};
  const plan     = Array.isArray(rawData.growthPlan) ? (rawData.growthPlan[0] || {}) : (rawData.growthPlan || {});
  const goals    = rawData.goals   || [];
  const actions  = rawData.actions || [];
  const percent  = Number(plan.growthPlanPercentAchieved || 0);
  const themeColor = plan.colorCodeHex
    ? (plan.colorCodeHex.startsWith('#') ? plan.colorCodeHex : `#${plan.colorCodeHex}`)
    : C.purple;

  if (planQuery.isLoading) return <div style={{ padding: 32 }}><Spinner /></div>;
  if (planQuery.isError)   return (
    <div style={{ padding: 32, color: '#ef4444', display: 'flex', gap: 8, alignItems: 'center' }}>
      <AlertCircle size={16} /> Failed to load plan.
      <button onClick={() => navigate('/work-plan')} style={{ marginLeft: 8, color: C.teal, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Go back</button>
    </div>
  );

  /* Selected goal for right-panel Goals tab */
  const displayGoal = selectedGoal || (goals.length > 0 ? goals[0] : null);
  const displayGoalActions = displayGoal
    ? actions.filter(a => String(a.goalId) === String(displayGoal.goalId))
    : [];

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>

      {/* ── Plan header ── */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '14px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: themeColor }}>
            {plan.name || plan.growthPlanName || 'Plan'}
          </h1>
          <ActionToolbar onRefresh={doRefresh} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 36, flexWrap: 'wrap' }}>
          {/* Due date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: C.text2 }}>Due Date</span>
            {(plan.growthPlanMilestoneDate || plan.milestoneDate)
              ? <span style={{ background: C.teal, color: '#fff', borderRadius: 4, padding: '2px 10px', fontSize: 13, fontWeight: 600 }}>
                  {new Date(plan.growthPlanMilestoneDate || plan.milestoneDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                </span>
              : <span style={{ color: C.text2 }}>—</span>
            }
          </div>
          {/* Owner */}
          {(plan.ownerName || plan.firstName) && (
            <div style={{ fontSize: 13, color: C.text2 }}>
              Owner: <span style={{ color: C.text, fontWeight: 500 }}>
                {plan.ownerName || `${plan.firstName || ''} ${plan.lastName || ''}`.trim()}
              </span>
            </div>
          )}
          {/* Gauge */}
          <Speedometer percent={percent} />
        </div>
      </div>

      {/* ── Body: left goal+action list | right tabs panel ── */}
      <div style={{ display: 'flex' }}>

        {/* ── LEFT: Goals + Actions ── */}
        <div style={{ flex: 1, minWidth: 0, borderRight: `1px solid ${C.border}` }}>

          {/* Toolbar row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', background: C.white, borderBottom: `1px solid ${C.border}`,
          }}>
            <button
              onClick={() => setShowGoalModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: C.purple, color: '#fff', border: 'none',
                borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
              }}
            >
              <Plus size={13} /> Add New Goal
            </button>
            <div style={{ flex: 1 }} />
            {/* Filter icon */}
            <Filter size={15} color={C.text2} style={{ cursor: 'pointer' }} />
            {/* Column headers */}
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: C.text2, fontWeight: 600 }}>
              <div style={{ width: 200 }}></div>
              <div style={{ width: 44  }}></div>
              <div style={{ width: 10  }}></div>
              <div style={{ flex: 1, textAlign: 'center', minWidth: 80 }}>Progress</div>
              <div style={{ width: 52, textAlign: 'right' }}></div>
              <div style={{ width: 92, textAlign: 'right' }}>Due Date</div>
              <div style={{ width: 22  }}></div>
            </div>
          </div>

          {/* Goals + their actions */}
          {goals.length === 0 && !planQuery.isLoading && (
            <div style={{ padding: 40, textAlign: 'center', color: C.text2, fontSize: 14 }}>No goals yet.</div>
          )}
          {goals.map((goal, gi) => {
            const goalActions = actions.filter(a => String(a.goalId) === String(goal.goalId));
            const isSelected  = displayGoal && String(displayGoal.goalId) === String(goal.goalId);
            return (
              <div key={goal.goalId || gi}>
                <GoalHeaderRow
                  goal={goal}
                  goalActions={goalActions}
                  themeColor={themeColor}
                  isSelected={isSelected}
                  onGoalClick={g => { setSelectedGoal(g); setActiveTab('goals'); }}
                />
                {goalActions.map((action, ai) => (
                  <ActionSubRow key={action.actionId || ai} action={action} themeColor={themeColor} />
                ))}
              </div>
            );
          })}
        </div>

        {/* ── RIGHT: Tabs panel ── */}
        <div style={{ flex: '0 0 500px', background: C.white, display: 'flex', flexDirection: 'column' }}>

          {/* Back */}
          <div style={{ padding: '10px 18px', borderBottom: `1px solid ${C.border}` }}>
            <button onClick={() => navigate('/dashboard')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.teal, fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              ← Back
            </button>
          </div>

          {/* Plan summary in panel */}
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: C.text }}>
              {plan.name || plan.growthPlanName}
            </h2>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <span style={{ background: '#e6f7fd', color: C.teal, fontSize: 12, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                {plan.growthPlanStatus || 'Open'}
              </span>
              {(plan.growthPlanMilestoneDate || plan.milestoneDate) && (
                <span style={{ fontSize: 12, color: C.text2 }}>
                  Due: {new Date(plan.growthPlanMilestoneDate || plan.milestoneDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.text2, marginBottom: 4 }}>
              <span>Overall Progress</span>
              <span style={{ fontWeight: 700, color: C.text }}>{percent.toFixed(2)}%</span>
            </div>
            <div style={{ background: '#e4e7ea', borderRadius: 4, height: 7 }}>
              <div style={{ width: `${percent}%`, height: '100%', background: C.teal, borderRadius: 4 }} />
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '9px 13px', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
                  fontWeight: activeTab === id ? 600 : 400,
                  color: activeTab === id ? C.teal : C.text2,
                  borderBottom: activeTab === id ? `2px solid ${C.teal}` : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>

            {/* Goals tab — shows selected goal's actions */}
            {activeTab === 'goals' && (
              <div>
                <button onClick={() => setShowGoalModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.purple, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 14, marginLeft: 'auto' }}
                >
                  <Plus size={13} /> Add Goal
                </button>

                {goals.length === 0 && <div style={{ color: C.text2, fontSize: 14 }}>No goals yet.</div>}

                {goals.map((goal, gi) => {
                  const gActions = actions.filter(a => String(a.goalId) === String(goal.goalId));
                  return (
                    <div key={goal.goalId || gi} style={{ marginBottom: 14 }}>
                      {/* Goal title */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{goal.goalName || goal.name}</span>
                        <span style={{ background: '#e6f7fd', color: C.teal, fontSize: 11, padding: '1px 7px', borderRadius: 10, fontWeight: 600 }}>{goal.goalStatus || 'Open'}</span>
                      </div>
                      {/* Actions list */}
                      {gActions.map((a, ai) => (
                        <div key={a.actionId || ai} style={{
                          fontSize: 13, color: C.text, padding: '4px 0 4px 10px',
                          borderTop: `1px solid ${C.border}`,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <span>• {a.actionName}</span>
                          <span style={{ color: C.teal, fontSize: 11, fontWeight: 600, marginLeft: 8 }}>{a.actionStatus || 'Open'}</span>
                        </div>
                      ))}
                      {gActions.length === 0 && (
                        <div style={{ fontSize: 12, color: C.text2, paddingLeft: 10 }}>No actions yet.</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'activity' && (
              activityQuery.isLoading ? <Spinner /> :
                (activityQuery.data || []).length === 0
                  ? <div style={{ color: C.text2, fontSize: 14 }}>No activity yet.</div>
                  : (activityQuery.data || []).map((item, i) => (
                      <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13, color: C.text }}>
                        <div>{item.auditMessage || item.message}</div>
                        {item.createdOn && <div style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>{new Date(item.createdOn).toLocaleString()}</div>}
                      </div>
                    ))
            )}

            {activeTab === 'contributors' && (
              contributorsQuery.isLoading ? <Spinner /> :
                (contributorsQuery.data || []).length === 0
                  ? <div style={{ color: C.text2, fontSize: 14 }}>No contributors.</div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                (meetingsQuery.data || []).length === 0
                  ? <div style={{ color: C.text2, fontSize: 14 }}>No meetings.</div>
                  : (meetingsQuery.data || []).map((m, i) => (
                      <div key={i} style={{ padding: '8px 10px', background: '#f8f9fa', borderRadius: 6, marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.meetingTitle || m.title}</div>
                        {m.meetingDate && <div style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>{new Date(m.meetingDate).toLocaleString()}</div>}
                      </div>
                    ))
            )}

            {activeTab === 'notes' && (
              <div>
                <div style={{ marginBottom: 14 }}>
                  <ReactQuill value={noteContent} onChange={setNoteContent} placeholder="Write your note here…" style={{ background: '#fff', borderRadius: 6 }} />
                  <button onClick={() => addNoteMutation.mutate()}
                    disabled={addNoteMutation.isPending || !noteContent}
                    style={{ marginTop: 8, padding: '7px 18px', background: C.teal, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: addNoteMutation.isPending ? 0.7 : 1 }}
                  >
                    {addNoteMutation.isPending ? 'Saving…' : 'Add Note'}
                  </button>
                </div>
                {notesQuery.isLoading ? <Spinner /> : (notesQuery.data || []).map((note, i) => (
                  <div key={i} style={{ padding: 10, background: '#f8f9fa', borderRadius: 6, marginBottom: 8, fontSize: 13, color: C.text }}>
                    <div style={{ fontSize: 11, color: C.text2, marginBottom: 4 }}>{note.createdOn ? new Date(note.createdOn).toLocaleString() : ''}</div>
                    <div dangerouslySetInnerHTML={{ __html: note.noteContent || note.content || '' }} />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'whatif' && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: C.text2 }}>
                <Zap size={30} color={C.teal} style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>What-If Analysis</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>Explore hypothetical scenarios.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Goal Modal ── */}
      {showGoalModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 26, width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Add Goal</h2>
              <button onClick={() => setShowGoalModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={17} /></button>
            </div>
            {[
              { key: 'goalName',    label: 'Goal Name *', type: 'text',   placeholder: 'e.g. Improve public speaking' },
              { key: 'category',   label: 'Category',    type: 'text',   placeholder: 'e.g. Leadership' },
              { key: 'targetValue',label: 'Target Value',type: 'number', placeholder: '100' },
              { key: 'endDate',    label: 'End Date',    type: 'date'  },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 13 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#374151' }}>{label}</label>
                <input type={type} value={newGoal[key]} placeholder={placeholder}
                  onChange={e => setNewGoal(g => ({ ...g, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = C.teal}
                  onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => setShowGoalModal(false)} style={{ flex: 1, padding: 9, background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Cancel</button>
              <button onClick={() => addGoalMutation.mutate()} disabled={addGoalMutation.isPending || !newGoal.goalName}
                style={{ flex: 1, padding: 9, background: C.purple, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#fff', opacity: addGoalMutation.isPending ? 0.7 : 1 }}
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
