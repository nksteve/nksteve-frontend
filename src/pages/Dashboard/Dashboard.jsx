import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as api from '../../api/client';
import useAuthStore from '../../store/authStore';

// ── Vembu colour palette ──────────────────────────────────────────────────────
const C = {
  teal:      '#0197cc',
  tealDark:  '#0086c0',
  purple:    '#a25ddc',
  orange:    '#ffa500',
  green:     '#00e15a',
  grey:      '#989898',
  bg:        '#f4f5fa',
  white:     '#ffffff',
  border:    '#e4e7ea',
  text:      '#23282c',
  headerBg:  '#fff',
};

// ── Colour from hex code (plans have colorCodeHex) ───────────────────────────
const planColor = (hex) => hex ? `#${hex}` : C.teal;

// ── Progress bar – matches GrowthProgress logic ───────────────────────────────
function GrowthProgress({ pct, color }) {
  const p = Math.min(100, Math.max(0, Number(pct) || 0));
  const barColor = p >= 80 ? '#28a745' : p >= 50 ? '#0197cc' : '#ffa500';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <span style={{ fontSize: 13, color: C.grey, whiteSpace: 'nowrap' }}>Goal Plan Completion</span>
      <div style={{
        flex: 1, height: 10, background: '#e9ecef', borderRadius: 5, overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          width: `${p}%`, height: '100%', background: barColor,
          borderRadius: 5, transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.text, minWidth: 34 }}>{p}%</span>
    </div>
  );
}

// ── Plan card – matches vembu exactly (clean row with bottom border) ──────────
function PlanCard({ plan, onClick }) {
  const color   = planColor(plan.colorCodeHex);
  const dueDate = plan.milestoneDate || plan.dueDate || '';
  const pct     = plan.growthPlanPercentAchieved ?? plan.percentAchieved ?? 0;
  const owner   = [plan.firstName, plan.lastName].filter(Boolean).join(' ') || '';

  const formatted = dueDate
    ? new Date(dueDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    : '';

  return (
    <div
      onClick={() => onClick(plan)}
      style={{
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: 4,
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        padding: '16px 20px',
        marginBottom: 4,
        cursor: 'pointer',
        transition: 'box-shadow .15s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.12)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.06)'}
    >
      {/* Plan name row */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <span style={{
          fontSize: 18, fontWeight: 700, color: color, lineHeight: 1.3,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>≡</span>
          {plan.name || plan.planName}
        </span>
      </div>

      {/* Due date + Owner + Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        {formatted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: C.grey }}>Due Date</span>
            <span style={{
              fontSize: 12, fontWeight: 600, color: C.white,
              background: color, padding: '2px 8px', borderRadius: 3,
            }}>
              {formatted}
            </span>
          </div>
        )}
        {owner && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 13, color: C.grey }}>Owner:</span>
            <span style={{ fontSize: 13, color: C.text }}> {owner}</span>
          </div>
        )}
        <GrowthProgress pct={pct} color={color} />
      </div>
    </div>
  );
}

// ── Vision / Mission / Values card – matches vembu (teal border outline) ─────
function VMVCard({ title, content, initial, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(content || '');

  useEffect(() => { setVal(content || ''); }, [content]);

  const save = () => { onSave(val); setEditing(false); };

  return (
    <div style={{
      flex: 1, background: C.white,
      border: `1px solid ${C.teal}`,
      borderRadius: 4, minHeight: 190, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px',
        display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative',
      }}>
        <h5 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: 1 }}>
          <span style={{ color: C.purple, fontSize: 17 }}>{initial}</span>{title.slice(1).toUpperCase()}
        </h5>
        <button
          onClick={() => setEditing(!editing)}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: C.grey, fontSize: 16,
          }}
          title="Edit"
        >
          ✎
        </button>
      </div>
      {/* Body */}
      <div style={{ flex: 1, padding: '8px 16px' }}>
        {editing ? (
          <>
            <textarea
              value={val}
              onChange={e => setVal(e.target.value)}
              rows={4}
              style={{
                width: '100%', border: `1px solid ${C.border}`, borderRadius: 4,
                padding: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={save} style={{
                background: C.teal, color: '#fff', border: 'none', borderRadius: 4,
                padding: '4px 16px', cursor: 'pointer', fontSize: 13,
              }}>Save</button>
              <button onClick={() => setEditing(false)} style={{
                background: '#e9ecef', color: C.text, border: 'none', borderRadius: 4,
                padding: '4px 16px', cursor: 'pointer', fontSize: 13,
              }}>Cancel</button>
            </div>
          </>
        ) : val ? (
          <div
            style={{ fontSize: 14, color: C.text, margin: 0, lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: val }}
          />
        ) : (
          <p style={{ fontSize: 14, color: C.grey, margin: 0, fontStyle: 'italic' }}>
            Click ✎ to add {title.toLowerCase()}…
          </p>
        )}
      </div>
    </div>
  );
}

// ── New Plan Modal ─────────────────────────────────────────────────────────────
function NewPlanModal({ onClose, onCreated, entityId, companyId }) {
  const [form, setForm] = useState({ name: '', milestoneDate: '', colorCode: 'a25ddc' });
  const createMutation = useMutation({
    mutationFn: () => api.newGrowthPlan({
      action: 'INSERT', entityId, companyId,
      name: form.name, milestoneDate: form.milestoneDate || null,
      colorCode: form.colorCode, statusId: 1, wizzardStage: 1,
    }),
    onSuccess: () => { toast.success('Plan created!'); onCreated(); onClose(); },
    onError: () => toast.error('Failed to create plan'),
  });

  const colors = ['a25ddc','0197cc','0086c0','00e15a','ffa500','ef4444','f59e0b','10b981'];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        background: C.white, borderRadius: 8, padding: 28, width: 420, maxWidth: '90vw',
        boxShadow: '0 10px 40px rgba(0,0,0,.25)',
      }}>
        <h5 style={{ margin: '0 0 20px', color: C.teal, fontSize: 17, fontWeight: 700 }}>
          + New Goal Plan
        </h5>
        <label style={{ fontSize: 13, color: C.grey, display: 'block', marginBottom: 4 }}>Plan Name *</label>
        <input
          autoFocus
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 4,
            border: `1px solid ${C.border}`, fontSize: 14, marginBottom: 14, boxSizing: 'border-box',
          }}
        />
        <label style={{ fontSize: 13, color: C.grey, display: 'block', marginBottom: 4 }}>Due Date</label>
        <input
          type="date"
          value={form.milestoneDate}
          onChange={e => setForm(f => ({ ...f, milestoneDate: e.target.value }))}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 4,
            border: `1px solid ${C.border}`, fontSize: 14, marginBottom: 14, boxSizing: 'border-box',
          }}
        />
        <label style={{ fontSize: 13, color: C.grey, display: 'block', marginBottom: 8 }}>Color</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {colors.map(c => (
            <div
              key={c}
              onClick={() => setForm(f => ({ ...f, colorCode: c }))}
              style={{
                width: 28, height: 28, borderRadius: '50%', background: `#${c}`,
                cursor: 'pointer', border: form.colorCode === c ? '3px solid #333' : '3px solid transparent',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            background: '#e9ecef', border: 'none', borderRadius: 4,
            padding: '8px 20px', cursor: 'pointer', fontSize: 14,
          }}>Cancel</button>
          <button
            onClick={() => form.name && createMutation.mutate()}
            disabled={!form.name || createMutation.isPending}
            style={{
              background: C.teal, color: '#fff', border: 'none', borderRadius: 4,
              padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              opacity: !form.name ? .6 : 1,
            }}
          >
            {createMutation.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TABS config — matches vembu exactly (Invited & Nested are present but hidden)
// Vembu hides value="2" (Nested Plans) and value="3" (Invited) using d-none class
const TABS = [
  { id: '3', label: 'Invited',       action: 'InvitedGoalPlans',     hidden: true  },
  { id: '2', label: 'Nested Plans',  action: 'MyAssignedGoals',      hidden: true  },
  { id: '1', label: 'Goal Plans',    action: 'AllPlans',             hidden: false },
  { id: '4', label: 'Completed',     action: 'MyCompletedGoalPlans', hidden: false },
  { id: '5', label: 'Deleted Plans', action: 'DeleteGoalPlan',       hidden: false },
];

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const { user }   = useAuthStore();
  const entityId   = user?.entityId;
  const companyId  = user?.companyId;

  const [activeTab, setActiveTab] = useState('1');  // Default to 'Goal Plans' tab (matches vembu)
  const [showModal,  setShowModal]  = useState(false);
  const [search,     setSearch]     = useState('');

  // ── Fetch entity setup (Vision/Mission/Values + profile) ──────────────────
  const { data: setupData } = useQuery({
    queryKey: ['entitySetup', entityId],
    queryFn: () => api.getEntitySetup(entityId),
    enabled: !!entityId,
    select: r => r.data?.entity || {},
    staleTime: 5 * 60 * 1000,
  });

  // ── Fetch plans ───────────────────────────────────────────────────────────
  // Re-fetch per tab using the correct SP action (matches vembu exactly)
  const activeAction = TABS.find(t => t.id === activeTab)?.action || 'AllPlans';
  const { data: plansData, isLoading } = useQuery({
    queryKey: ['myPlans', entityId, activeAction],
    queryFn: () => api.getMyPlans({ entityId, companyId, action: activeAction }),
    enabled: !!entityId,
    select: r => r.data?.plans || r.data?.myPlans || [],
    staleTime: 60 * 1000,
  });

  // ── Update VMV mutation ───────────────────────────────────────────────────
  const vmvMutation = useMutation({
    mutationFn: (data) => api.updateEntityInterests(data),
    onSuccess: () => { qc.invalidateQueries(['entitySetup', entityId]); toast.success('Saved!'); },
    onError: () => toast.error('Failed to save'),
  });

  const handleVMVSave = (field, value) => {
    vmvMutation.mutate({
      action: 'ADD',
      entityId,
      tagId: null,
      [field]: value,
    });
  };

  // ── Filter plans by tab ───────────────────────────────────────────────────
  const allPlans = plansData || [];
  const visiblePlans = search
    ? allPlans.filter(p => (p.name || '').toLowerCase().includes(search.toLowerCase()))
    : allPlans;

  // Strip trailing " - " artifacts that vembu sometimes appends to HTML content
  const cleanHtml = (s) => (s || '').replace(/\s*-\s*$/, '').trim();
  const vision  = cleanHtml(setupData?.vission  || setupData?.companyVision  || '');
  const mission = cleanHtml(setupData?.mission  || setupData?.companyMission || '');
  const values  = cleanHtml(setupData?.value    || setupData?.companyValues  || '');

  // Visible tabs only (hidden ones exist in data but not shown — matches vembu)
  const visibleTabs = TABS.filter(t => !t.hidden);

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      {/* ── Vision / Mission / Values ─────────────────────────────────────── */}
      <div style={{ padding: '16px 24px 0' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <VMVCard
            title="Vision" initial="V"
            content={vision}
            onSave={v => handleVMVSave('vission', v)}
          />
          <VMVCard
            title="Mission" initial="M"
            content={mission}
            onSave={v => handleVMVSave('mission', v)}
          />
          <VMVCard
            title="Values" initial="V"
            content={values}
            onSave={v => handleVMVSave('value', v)}
          />
        </div>

        {/* ── Gray box area with buttons + tabs — matches vembu .gray-box ─── */}
        <div style={{
          background: C.bg, borderRadius: 4,
          padding: '16px 8px 0',
          marginBottom: 0,
        }}>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: C.purple, color: '#fff', border: 'none', borderRadius: 4,
                padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              }}
            >
              + Goal Plan
            </button>
            <button
              style={{
                background: C.purple, color: '#fff', border: 'none', borderRadius: 4,
                padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              }}
              onClick={() => navigate('/training/user')}
            >
              + Wealth
            </button>
            <button
              onClick={() => navigate('/analytics')}
              style={{
                background: C.purple, color: '#fff', border: 'none', borderRadius: 4,
                padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              }}
            >
              + Trending
            </button>
          </div>

          {/* ── Tabs — matches vembu: Goal Plans | Completed | Deleted Plans ── */}
          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`, background: C.white, paddingLeft: 0 }}>
            {visibleTabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  border: 'none',
                  borderTop: activeTab === t.id ? 'none' : 'none',
                  borderBottom: activeTab === t.id ? `2px solid ${C.teal}` : '2px solid transparent',
                  background: 'none', cursor: 'pointer',
                  padding: '10px 16px', fontSize: 14,
                  fontWeight: activeTab === t.id ? 700 : 400,
                  color:  activeTab === t.id ? C.text : C.grey,
                  marginBottom: -1,
                  transition: 'all .2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
              </button>
            ))}

            {/* Search — right aligned */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: 8 }}>
              <input
                placeholder="Search plans…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  border: `1px solid ${C.border}`, borderRadius: 4, padding: '5px 12px',
                  fontSize: 13, outline: 'none', width: 200,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Plan list ────────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 24px 24px', background: C.bg, margin: '0 0 24px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60, color: C.grey, fontSize: 15 }}>
            Loading plans…
          </div>
        ) : visiblePlans.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 60, color: C.grey, fontSize: 15,
          }}>
            {activeTab === '1' ? 'No goal plans yet. Click "+ Goal Plan" to create one.' : 'No plans in this category.'}
          </div>
        ) : (
          visiblePlans.map((plan, i) => (
            <PlanCard
              key={plan.growthPlanId || plan.planId || i}
              plan={plan}
              onClick={() => navigate(`/work-plan?planId=${plan.growthPlanId || plan.planId}`)}
            />
          ))
        )}
      </div>

      {/* ── New Plan Modal ────────────────────────────────────────────────────── */}
      {showModal && (
        <NewPlanModal
          onClose={() => setShowModal(false)}
          onCreated={() => qc.invalidateQueries(['myPlans', entityId])}
          entityId={entityId}
          companyId={companyId}
        />
      )}
    </div>
  );
}
