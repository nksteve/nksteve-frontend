import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Edit2, Loader2, AlertCircle, X, Plus } from 'lucide-react';
import * as api from '../../../api/client';

const C = {
  primary: '#0197cc',
  primaryLight: '#e6f7fd',
  success: '#10B981',
  danger: '#EF4444',
  surface: '#FFFFFF',
  bg: '#F8FAFC',
  border: '#E2E8F0',
  text: '#0F172A',
  text2: '#64748B',
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getNextDate(dayIndex) {
  // Returns YYYY-MM-DD for the next occurrence of dayIndex (0=Sun)
  const today = new Date();
  const todayDay = today.getDay();
  let diff = dayIndex - todayDay;
  if (diff <= 0) diff += 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next.toISOString().split('T')[0];
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: `1px solid #E2E8F0`,
  borderRadius: 6,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  background: '#FFFFFF',
};

export default function CronManagement() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('INSERT'); // INSERT | UPDATE
  const [dayName, setDayName] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  // Fetch cron list
  const { data: crons = [], isLoading, isError } = useQuery({
    queryKey: ['cronList'],
    queryFn: () => api.http.post('/cronsettings', { action: 'GETAll', type: 'GOALWEEKLYREPORT' }),
    select: (res) => res.data?.result || [],
  });

  // Fetch company picklist
  const { data: companies = [] } = useQuery({
    queryKey: ['picklist-company'],
    queryFn: () => api.getPicklist({ picklistType: 'COMPANY' }),
    select: (res) => res.data?.picklist || [],
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => api.http.post('/cronsettings', payload),
    onSuccess: (res) => {
      if (res.data?.header?.errorCode === 0) {
        toast.success('Cron Updated Successfully');
        queryClient.invalidateQueries(['cronList']);
        setIsModalOpen(false);
        setDayName('');
        setSelectedCompanyId('');
      }
    },
    onError: () => toast.error('Failed to update cron'),
  });

  const statusMutation = useMutation({
    mutationFn: (payload) => api.http.post('/cronsettings', payload),
    onSuccess: () => {
      toast.success('Status Updated Successfully');
      queryClient.invalidateQueries(['cronList']);
    },
    onError: () => toast.error('Failed to update status'),
  });

  const openAddModal = () => {
    setModalMode('INSERT');
    setDayName('');
    setSelectedCompanyId('');
    setIsModalOpen(true);
  };

  const openEditModal = (cron) => {
    setModalMode('UPDATE');
    setDayName(String(cron.cronDay));
    setSelectedCompanyId(String(cron.companyId));
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!dayName) { toast.warning('Please select day'); return; }
    if (!selectedCompanyId) { toast.warning('Please select company'); return; }
    saveMutation.mutate({
      action: 'UPDATE',
      type: 'GOALWEEKLYREPORT',
      cronDay: parseInt(dayName),
      cronDate: getNextDate(parseInt(dayName)),
      companyId: parseInt(selectedCompanyId),
    });
  };

  const toggleStatus = (cron) => {
    statusMutation.mutate({
      action: 'UPDATE',
      type: 'GOALWEEKLYREPORT',
      status: cron.status === 1 ? 0 : 1,
      companyId: cron.companyId,
    });
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', fontSize: 26, fontWeight: 700, color: C.text, marginBottom: 28 }}>
        Cron Management
      </h1>

      {/* Add button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={openAddModal}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', background: '#6C757D', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> Add Cron Job
        </button>
      </div>

      {isLoading && <Spinner />}
      {isError && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: C.danger, padding: 16, background: '#FEF2F2', borderRadius: 8 }}>
          <AlertCircle size={16} /> Failed to load cron jobs.
        </div>
      )}

      {!isLoading && !isError && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {['Company Name', 'Cron Day', 'Cron Date', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {crons.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: C.text2 }}>No cron jobs found.</td>
                </tr>
              ) : (
                crons.map((cron, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: C.text, fontWeight: 500 }}>{cron.companyName}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: C.text2 }}>
                      {cron.cronDay !== null && cron.cronDay !== undefined ? DAY_NAMES[cron.cronDay] : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: C.text2 }}>{cron.cronDateString || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => toggleStatus(cron)}
                        style={{
                          padding: '3px 16px', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 4, cursor: 'pointer',
                          background: cron.status === 1 ? C.primary : '#6C757D', color: '#fff',
                        }}>
                        {cron.status === 1 ? 'Active' : 'InActive'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => openEditModal(cron)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: C.primaryLight, border: `1px solid ${C.primary}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, color: C.primary, fontWeight: 600 }}>
                        <Edit2 size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: C.surface, borderRadius: 12, width: 540, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>
                {modalMode !== 'UPDATE' ? 'Add New Cron Job (Goal Weekly Report)' : 'Update Cron Job (Goal Weekly Report)'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text2 }}><X size={18} /></button>
            </div>
            <div style={{ padding: '24px 32px' }}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Company Name <sup style={{ color: C.danger }}>*</sup>
                </label>
                <select value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)}
                  disabled={modalMode === 'UPDATE'}
                  style={{ ...inputStyle, background: modalMode === 'UPDATE' ? C.bg : C.surface }}>
                  <option value="">Select</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Day <sup style={{ color: C.danger }}>*</sup>
                </label>
                <select value={dayName} onChange={e => setDayName(e.target.value)} style={inputStyle}>
                  <option value="">Select</option>
                  {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setIsModalOpen(false)}
                style={{ padding: '8px 18px', background: C.primary, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#fff' }}>
                Close
              </button>
              <button onClick={handleSave} disabled={saveMutation.isPending}
                style={{ padding: '8px 18px', background: C.danger, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#fff' }}>
                {saveMutation.isPending ? 'Saving…' : (modalMode === 'UPDATE' ? 'Update' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
