import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import * as api from '../../../api/client';

const C = {
  primary: '#0197cc',
  surface: '#FFFFFF',
  bg: '#F8FAFC',
  border: '#E2E8F0',
  text: '#0F172A',
  text2: '#64748B',
  danger: '#EF4444',
};

const selectStyle = {
  width: '100%',
  padding: '9px 12px',
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  background: C.surface,
};

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <Loader2 size={28} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function TemplateManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('1'); // '1'=Move, '2'=Delete

  // Move Template state
  const [fromCompanyId, setFromCompanyId] = useState('');
  const [toCompanyId, setToCompanyId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [userId, setUserId] = useState('');
  const [templateList, setTemplateList] = useState([]);
  const [userList, setUserList] = useState([]);

  // Delete Template state (reuses fromCompanyId + templateId per tab)
  const [delCompanyId, setDelCompanyId] = useState('');
  const [delTemplateId, setDelTemplateId] = useState('');
  const [delTemplateList, setDelTemplateList] = useState([]);

  // Company picklist
  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['picklist-company'],
    queryFn: () => api.getPicklist({ picklistType: 'COMPANY' }),
    select: (res) => res.data?.picklist || [],
  });

  const switchTab = (tab) => {
    setActiveTab(tab);
    setFromCompanyId('');
    setToCompanyId('');
    setTemplateId('');
    setTemplateList([]);
    setUserList([]);
    setDelCompanyId('');
    setDelTemplateId('');
    setDelTemplateList([]);
  };

  const getTemplateList = async (cid) => {
    try {
      const res = await api.getTemplates({ action: 'COMMUNITYGROWTHPLAN', companyId: cid });
      return res.data?.result || [];
    } catch { return []; }
  };

  const getAdminUsers = async (cid) => {
    try {
      const res = await api.getAdminUsers({ companyId: cid });
      return res.data?.users || res.data?.EntityUser || [];
    } catch { return []; }
  };

  const moveMutation = useMutation({
    mutationFn: (data) => api.moveTemplates(data),
    onSuccess: (res) => {
      if (res.data?.header?.errorCode === 0) {
        toast.success('Saved Successfully');
      } else {
        toast.success('Template moved');
      }
    },
    onError: () => toast.error('Failed to move template'),
  });

  const deleteMutation = useMutation({
    mutationFn: (data) => api.moveTemplates(data),
    onSuccess: (res) => {
      toast.success('Deleted Successfully');
      setDelTemplateId('');
      getTemplateList(delCompanyId).then(setDelTemplateList);
    },
    onError: () => toast.error('Failed to delete template'),
  });

  const handleMoveSubmit = () => {
    if (!fromCompanyId) { toast.warning('Please select from company'); return; }
    if (!templateId) { toast.warning('Please select template'); return; }
    if (!toCompanyId) { toast.warning('Please select to company'); return; }
    if (!userId) { toast.warning('Please select user'); return; }
    moveMutation.mutate({
      action: 'MOVETOTEMPLATE',
      growthPlanId: templateId,
      entityId: userId,
      managerEntityId: toCompanyId,
      teamId: templateId,
    });
  };

  const handleDeleteSubmit = () => {
    if (!delCompanyId) { toast.warning('Please select company'); return; }
    if (!delTemplateId) { toast.warning('Please select template'); return; }
    if (!window.confirm('Are you sure you want delete template?')) { setDelTemplateId(''); setDelTemplateList([]); setDelCompanyId(''); return; }
    deleteMutation.mutate({
      action: 'DELETEFROMTEMPLATE',
      growthPlanId: delTemplateId.split('-')[0],
      entityId: null,
      managerEntityId: null,
      teamId: delTemplateId,
    });
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', fontSize: 26, fontWeight: 700, color: C.text, marginBottom: 28 }}>
        Template Management
      </h1>

      {/* Tabs */}
      <div style={{ borderBottom: `2px solid ${C.border}`, display: 'flex', gap: 0, marginBottom: 28 }}>
        {[{ id: '1', label: 'Move Template' }, { id: '2', label: 'Delete Template' }].map(tab => (
          <button key={tab.id} onClick={() => switchTab(tab.id)}
            style={{
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === tab.id ? C.primary : C.text2,
              borderBottom: activeTab === tab.id ? `2px solid ${C.primary}` : '2px solid transparent',
              marginBottom: -2,
              transition: 'color 0.15s',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loadingCompanies && <Spinner />}

      {/* Tab 1: Move Template */}
      {activeTab === '1' && !loadingCompanies && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 540 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>From Company</label>
                <select value={fromCompanyId} onChange={async e => {
                  const cid = e.target.value;
                  setFromCompanyId(cid);
                  setTemplateId('');
                  if (cid) {
                    const tl = await getTemplateList(cid);
                    setTemplateList(tl);
                  } else setTemplateList([]);
                }} style={selectStyle}>
                  <option>Select</option>
                  {companies.map((c, i) => <option key={i} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>To Company</label>
                <select value={toCompanyId} onChange={async e => {
                  const cid = e.target.value;
                  setToCompanyId(cid);
                  setUserId('');
                  if (cid) {
                    const ul = await getAdminUsers(cid);
                    setUserList(ul);
                  } else setUserList([]);
                }} style={selectStyle}>
                  <option>Select</option>
                  {companies.map((c, i) => <option key={i} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Template</label>
                <select value={templateId} onChange={e => setTemplateId(e.target.value)} style={selectStyle}>
                  <option>Select</option>
                  {templateList.map((t, i) => <option key={i} value={t.teamId}>{t.NAME}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>User</label>
                <select value={userId} onChange={e => setUserId(e.target.value)} style={selectStyle}>
                  <option>Select</option>
                  {userList.map((u, i) => <option key={i} value={u.entityId}>{u.firstName} {u.lastName}</option>)}
                </select>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <button onClick={handleMoveSubmit} disabled={moveMutation.isPending}
                style={{ padding: '9px 28px', background: C.primary, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#fff', opacity: moveMutation.isPending ? 0.7 : 1 }}>
                {moveMutation.isPending ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Delete Template */}
      {activeTab === '2' && !loadingCompanies && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 280 }}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Company</label>
              <select value={delCompanyId} onChange={async e => {
                const cid = e.target.value;
                setDelCompanyId(cid);
                setDelTemplateId('');
                if (cid) {
                  const tl = await getTemplateList(cid);
                  setDelTemplateList(tl);
                } else setDelTemplateList([]);
              }} style={selectStyle}>
                <option>Select</option>
                {companies.map((c, i) => <option key={i} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Template</label>
              <select value={delTemplateId} onChange={e => setDelTemplateId(e.target.value)} style={selectStyle}>
                <option>Select</option>
                {delTemplateList.map((t, i) => <option key={i} value={t.teamId}>{t.NAME}</option>)}
              </select>
            </div>
            <div style={{ textAlign: 'center' }}>
              <button onClick={handleDeleteSubmit} disabled={deleteMutation.isPending}
                style={{ padding: '9px 28px', background: C.primary, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#fff', opacity: deleteMutation.isPending ? 0.7 : 1 }}>
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
