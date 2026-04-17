import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
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

// Tabs match vembu: {firstName}'s Bio & Interest | Experience | Expertise | Goal Plan
const TABS = [
  { id: 'bio', label: 'bio_interest' },      // dynamic label
  { id: 'experience', label: 'Experience' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'plans', label: 'Goal Plan' },
];

export default function UserProfile() {
  const { user } = useAuthStore();
  const entityId = user?.entityId;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('bio');

  // Fetch user's name from entity setup
  const { data: setupData } = useQuery({
    queryKey: ['entitySetup', entityId],
    queryFn: () => api.getEntitySetup(entityId),
    enabled: !!entityId,
    select: r => r.data?.entity || {},
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const firstName = setupData?.firstName || '';
  const lastName  = setupData?.lastName  || '';
  const fullName  = [firstName, lastName].filter(Boolean).join(' ') || (user?.email ? user.email.split('@')[0] : 'User');
  const profileImg = setupData?.imageUri || setupData?.profileImage || null;
  const role     = setupData?.jobTitle || setupData?.title || '';
  const dept     = setupData?.departmentName || setupData?.businessUnit || setupData?.department || setupData?.dept || '';
  const motivation = setupData?.myMotivation || '';
  const location = setupData?.city || setupData?.location || '';
  const initials = firstName && lastName
    ? (firstName[0] + lastName[0]).toUpperCase()
    : fullName.slice(0, 2).toUpperCase();

  // Dynamic first tab label matches vembu: "David's Bio & Interest"
  const bioTabLabel = firstName ? `${firstName}'s Bio & Interest` : 'Bio & Interest';

  const tabs = [
    { id: 'bio',        label: bioTabLabel },
    { id: 'experience', label: 'Experience' },
    { id: 'expertise',  label: 'Expertise' },
    { id: 'plans',      label: 'Goal Plan' },
  ];

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header — matches vembu: name left + avatar right, role/dept/location below name */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, marginBottom: 28, justifyContent: 'center' }}>
        <div style={{ textAlign: 'right' }}>
          {/* First name as teal link — matches vembu */}
          <a href="#" style={{ fontSize: 20, fontWeight: 600, color: C.primary, textDecoration: 'none' }}>{firstName || fullName}</a>
          {role && <div><a href="#" style={{ fontSize: 14, color: C.primary, textDecoration: 'none' }}>{role}</a></div>}
          {dept && <div><a href="#" style={{ fontSize: 14, color: C.primary, textDecoration: 'none' }}>{dept}</a></div>}
          {location && <div><a href="#" style={{ fontSize: 14, color: C.primary, textDecoration: 'none' }}>{location}</a></div>}
        </div>
        {/* Avatar — matches vembu's robot avatar style */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {profileImg ? (
            <img
              src={profileImg}
              alt={fullName}
              style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.border}` }}
            />
          ) : (
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: '#e8f4fa', border: `2px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {/* Vembu-style user icon (robot avatar) */}
              <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="35" cy="25" r="14" fill="#0197cc" opacity="0.8"/>
                <circle cx="35" cy="25" r="10" fill="#0197cc"/>
                <circle cx="29" cy="23" r="3" fill="white"/>
                <circle cx="41" cy="23" r="3" fill="white"/>
                <circle cx="29" cy="23" r="1.5" fill="#0197cc"/>
                <circle cx="41" cy="23" r="1.5" fill="#0197cc"/>
                <path d="M28 30 Q35 35 42 30" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <rect x="32" y="12" width="6" height="4" rx="2" fill="#0197cc" opacity="0.6"/>
                <rect x="34" y="8" width="2" height="6" rx="1" fill="#0197cc" opacity="0.5"/>
                <path d="M10 60 Q35 42 60 60" fill="#0197cc" opacity="0.6"/>
              </svg>
            </div>
          )}
          {/* Edit avatar icon — matches vembu */}
          <button style={{
            position: 'absolute', bottom: 4, right: 4,
            width: 22, height: 22, borderRadius: '50%',
            background: C.primary, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs — match vembu: underlined active tab */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: `1px solid ${C.border}`,
        marginBottom: 24,
        background: '#f8f9fa',
        borderRadius: '4px 4px 0 0',
      }}>
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: activeTab === id ? 600 : 400,
              color: activeTab === id ? C.primary : '#555',
              borderBottom: activeTab === id ? `3px solid ${C.primary}` : '3px solid transparent',
              marginBottom: -1,
              whiteSpace: 'nowrap',
              letterSpacing: 0,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'bio'        && <BioInterestTab entityId={entityId} queryClient={queryClient} motivation={motivation} />}
      {activeTab === 'experience' && <ExperienceTab entityId={entityId} queryClient={queryClient} />}
      {activeTab === 'expertise'  && <ExpertiseTab entityId={entityId} />}
      {activeTab === 'plans'      && <PlansTab entityId={entityId} />}
    </div>
  );
}

// Bio & Interest Tab — matches vembu's combined "Bio & Interest" tab
function BioInterestTab({ entityId, queryClient, motivation }) {
  const [editing, setEditing] = useState(false);
  const [bioContent, setBioContent] = useState('');

  const { data: bio, isLoading } = useQuery({
    queryKey: ['bio', entityId],
    queryFn: () => api.getEntityBio(entityId),
    select: (res) => res.data?.bio?.summary ?? res.data?.bio ?? res.data?.bioContent ?? '',
    enabled: !!entityId,
    onSuccess: (data) => setBioContent(data),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.updateEntityBio({ entityId, bio: bioContent }),
    onSuccess: () => {
      toast.success('Bio saved!');
      queryClient.invalidateQueries(['bio', entityId]);
      setEditing(false);
    },
    onError: () => toast.error('Failed to save bio'),
  });

  const { data: interests = [], isLoadingInterests } = useQuery({
    queryKey: ['interests', entityId],
    queryFn: () => api.getEntityInterests(entityId),
    select: (res) => res.data?.interests || res.data?.result || [],
    enabled: !!entityId,
  });

  const [newInterest, setNewInterest] = useState('');
  const addInterestMutation = useMutation({
    mutationFn: () => api.updateEntityInterests({ entityId, action: 'ADD', tag: newInterest }),
    onSuccess: () => {
      toast.success('Interest added!');
      queryClient.invalidateQueries(['interests', entityId]);
      setNewInterest('');
    },
    onError: () => toast.error('Failed to add interest'),
  });

  if (isLoading) return <Spinner />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* My Bio card — matches vembu */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.text }}>
            My Bio
            {/* Edit pencil icon — matches vembu */}
            <button
              onClick={() => { if (!editing) setBioContent(bio || ''); setEditing(!editing); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8, padding: 0, verticalAlign: 'middle' }}
              title="Edit bio"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </h2>
        </div>
        {editing ? (
          <>
            <ReactQuill value={bioContent} onChange={setBioContent} style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditing(false)} style={{ padding: '8px 16px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 20px', background: C.primary, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
              >
                <Save size={14} /> {updateMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 14, color: C.text, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: bio || '<em style="color:#aaa">No bio yet. Click the pencil to add one.</em>' }} />
        )}
      </div>

      {/* What Motivates Me card — matches vembu (shows myMotivation from entity setup) */}
      {motivation && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: C.text }}>
            What Motivates Me?
            <span style={{ marginLeft: 8, verticalAlign: 'middle', cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </span>
          </h2>
          <p style={{ fontSize: 14, color: C.text, lineHeight: 1.7, margin: 0 }}>{motivation}</p>
        </div>
      )}

      {/* My Interests card — matches vembu */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: C.text }}>
          My Interests
          <span style={{ marginLeft: 8, verticalAlign: 'middle', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </span>
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {interests.length === 0 && <span style={{ color: C.text2, fontSize: 14 }}>No interests yet.</span>}
          {interests.map((interest, i) => {
            const label = interest.category || interest.tag || interest.name || `Interest ${i + 1}`;
            return (
              <span key={i} style={{ padding: '5px 14px', background: '#e6f7fd', color: C.primary, borderRadius: 20, fontSize: 13 }}>{label}</span>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={newInterest}
            onChange={e => setNewInterest(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && newInterest.trim() && addInterestMutation.mutate()}
            placeholder="Add an interest…"
            style={{ flex: 1, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 14, outline: 'none' }}
          />
          <button
            onClick={() => newInterest.trim() && addInterestMutation.mutate()}
            disabled={addInterestMutation.isPending || !newInterest.trim()}
            style={{ padding: '8px 16px', background: C.primary, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function InterestsTab({ entityId, queryClient }) {
  const [newInterest, setNewInterest] = useState('');

  const { data: interests = [], isLoading } = useQuery({
    queryKey: ['interests', entityId],
    queryFn: () => api.getEntityInterests(entityId),
    select: (res) => res.data?.interests || res.data?.result || [],
    enabled: !!entityId,
  });

  const addMutation = useMutation({
    mutationFn: () => api.updateEntityInterests({ entityId, action: 'ADD', tag: newInterest }),
    onSuccess: () => {
      toast.success('Interest added!');
      queryClient.invalidateQueries(['interests', entityId]);
      setNewInterest('');
    },
    onError: () => toast.error('Failed to add interest'),
  });

  if (isLoading) return <Spinner />;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: C.text }}>Interests</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {interests.length === 0 && (
          <span style={{ color: C.text2, fontSize: 14 }}>No interests yet. Add some below.</span>
        )}
        {interests.map((interest, i) => {
          const label = interest.category || interest.tag || interest.name || `Interest ${i + 1}`;
          return (
            <span key={i} style={{
              padding: '6px 14px',
              background: C.primaryLight,
              color: C.primary,
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
            }}>
              {label}
            </span>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          type="text"
          value={newInterest}
          onChange={e => setNewInterest(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && newInterest.trim() && addMutation.mutate()}
          placeholder="Add an interest…"
          style={{ flex: 1, padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none' }}
          onFocus={e => e.target.style.borderColor = C.primary}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        <button
          onClick={() => newInterest.trim() && addMutation.mutate()}
          disabled={addMutation.isPending || !newInterest.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, opacity: addMutation.isPending ? 0.7 : 1 }}
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}

function ExperienceTab({ entityId, queryClient }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company: '', title: '', startDate: '', endDate: '' });

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ['experience', entityId],
    queryFn: () => api.getEntityExperience(entityId),
    select: (res) => res.data?.experience || res.data?.result || [],
    enabled: !!entityId,
  });

  const addMutation = useMutation({
    mutationFn: () => api.updateEntityExperience({ entityId, action: 'ADD', ...form }),
    onSuccess: () => {
      toast.success('Experience added!');
      queryClient.invalidateQueries(['experience', entityId]);
      setShowForm(false);
      setForm({ company: '', title: '', startDate: '', endDate: '' });
    },
    onError: () => toast.error('Failed to add experience'),
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
        >
          <Plus size={14} /> Add Experience
        </button>
      </div>
      {showForm && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>New Experience</h3>
          {[
            { key: 'company', label: 'Company', type: 'text' },
            { key: 'title', label: 'Job Title', type: 'text' },
            { key: 'startDate', label: 'Start Date', type: 'date' },
            { key: 'endDate', label: 'End Date', type: 'date' },
          ].map(({ key, label, type }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 9, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Cancel</button>
            <button
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending || !form.company}
              style={{ flex: 1, padding: 9, background: C.primary, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#fff', opacity: addMutation.isPending ? 0.7 : 1 }}
            >
              {addMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
      {experiences.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: C.text2 }}>No experience entries yet.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {experiences.map((exp, i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{exp.title || exp.jobTitle}</div>
            <div style={{ fontSize: 14, color: C.primary, marginTop: 2 }}>{exp.company || exp.companyName}</div>
            {(exp.startDate || exp.endDate) && (
              <div style={{ fontSize: 13, color: C.text2, marginTop: 6 }}>
                {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : ''} — {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Expertise Tab — matches vembu's Expertise tab (tags/skills)
function ExpertiseTab({ entityId }) {
  const { data: expertiseTags = [], isLoading } = useQuery({
    queryKey: ['mmGoals', entityId],
    queryFn: async () => {
      const res = await fetch('/api/getMMGoal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('onup_token')}` },
        body: JSON.stringify({ mmEntityId: entityId }),
      });
      return res.json();
    },
    select: (data) => data?.goalList || [],
    enabled: !!entityId,
    retry: false,
  });

  if (isLoading) return <Spinner />;

  return (
    <div style={{ background: '#fff', border: '1px solid #e4e7ea', borderRadius: 8, padding: 24 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: '#23282c' }}>Personal Expertise</h2>
      {expertiseTags.length === 0 ? (
        <div style={{ color: '#989898', fontSize: 14 }}>No expertise tags yet.</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {expertiseTags.map((tag, i) => (
            <span key={i} style={{
              padding: '5px 14px',
              background: '#e6f7fd',
              color: '#0197cc',
              borderRadius: 20,
              fontSize: 13,
            }}>
              {tag.tagName || tag.name || tag.tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PlansTab({ entityId }) {
  const [planTab, setPlanTab] = useState('active');

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['profilePlans', entityId],
    queryFn: () => api.getGrowthPlanDetails({ action: 'MyGrowthPlans', entityId }),
    select: (res) => res.data?.plans || res.data?.myPlans || [],
    enabled: !!entityId,
  });

  if (isLoading) return <Spinner />;

  const active = plans.filter(p => p.growthPlanStatus !== 'Complete' && p.growthPlanStatus !== 'Completed');
  const completed = plans.filter(p => p.growthPlanStatus === 'Complete' || p.growthPlanStatus === 'Completed');
  const displayed = planTab === 'active' ? active : completed;

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        {[{ id: 'active', label: `Active (${active.length})` }, { id: 'completed', label: `Completed (${completed.length})` }].map(t => (
          <button key={t.id} onClick={() => setPlanTab(t.id)} style={{
            padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: 14, fontWeight: planTab === t.id ? 600 : 400,
            color: planTab === t.id ? C.primary : C.text2,
            borderBottom: planTab === t.id ? `2px solid ${C.primary}` : '2px solid transparent',
            marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>
      {displayed.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: C.text2 }}>No {planTab} plans.</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {displayed.map((plan, i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, borderLeft: `4px solid ${plan.growthPlanColor || C.primary}` }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 8 }}>{plan.growthPlanName}</div>
            {plan.growthPlanMilestoneDate && (
              <div style={{ fontSize: 13, color: C.text2, marginBottom: 12 }}>
                Due: {new Date(plan.growthPlanMilestoneDate).toLocaleDateString()}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.text2 }}>Progress</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{plan.growthPlanPercentAchieved || 0}%</span>
              </div>
              <div style={{ background: '#E2E8F0', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, plan.growthPlanPercentAchieved || 0)}%`, height: '100%', background: C.primary, borderRadius: 4 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PasswordTab({ entityId }) {
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ new: false, confirm: false });

  const changeMutation = useMutation({
    mutationFn: () => api.changePassword({ entityId, newPassword: form.newPassword }),
    onSuccess: () => {
      toast.success('Password changed!');
      setForm({ newPassword: '', confirmPassword: '' });
    },
    onError: () => toast.error('Failed to change password'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.newPassword || !form.confirmPassword) { toast.error('Fill in all fields'); return; }
    if (form.newPassword !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.newPassword.length < 8) { toast.error('Min 8 characters'); return; }
    changeMutation.mutate();
  };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, maxWidth: 440 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: C.text }}>Change Password</h2>
      <form onSubmit={handleSubmit}>
        {[
          { key: 'newPassword', label: 'New Password', showKey: 'new' },
          { key: 'confirmPassword', label: 'Confirm New Password', showKey: 'confirm' },
        ].map(({ key, label, showKey }) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={show[showKey] ? 'text' : 'password'}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder="••••••••"
                style={{ width: '100%', padding: '10px 40px 10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <button type="button" onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.text2, display: 'flex' }}>
                {show[showKey] ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        ))}
        <button
          type="submit"
          disabled={changeMutation.isPending}
          style={{ width: '100%', padding: '11px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, opacity: changeMutation.isPending ? 0.7 : 1 }}
        >
          {changeMutation.isPending ? 'Saving…' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
