import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { PieChart as PieChartIcon, Edit2, ToggleLeft, ToggleRight, X, Save, Loader2, AlertCircle } from 'lucide-react';
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

export default function AnalyticsAdmin() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const queryClient = useQueryClient();
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data: companies = [], isLoading, isError } = useQuery({
    queryKey: ['analyticsAdminCompanies', companyId],
    queryFn: () => api.getAnalyticsCompany({ action: 'GET', companyId }),
    select: (res) => res.data?.result || res.data?.companies || [],
    enabled: !!companyId,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ company, enabled }) => api.companyMapping({
      action: enabled ? 'ENABLE' : 'DISABLE',
      companyId: company.companyId || company.id,
    }),
    onSuccess: (_, vars) => {
      toast.success(`Company ${vars.enabled ? 'enabled' : 'disabled'}`);
      queryClient.invalidateQueries(['analyticsAdminCompanies']);
    },
    onError: () => toast.error('Failed to update company status'),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.getAnalyticsConfig({
      action: 'UPDATE',
      ...editForm,
      companyId: editingRow?.companyId || editingRow?.id,
    }),
    onSuccess: () => {
      toast.success('Config updated!');
      queryClient.invalidateQueries(['analyticsAdminCompanies']);
      setEditingRow(null);
    },
    onError: () => toast.error('Failed to update config'),
  });

  const handleEdit = (c) => {
    setEditingRow(c);
    setEditForm({
      startYear: c.startYear || '',
      endYear: c.endYear || '',
      charterId: c.charterId || '',
    });
  };

  const isEnabled = (c) => c.enabled === true || c.isEnabled === true || c.enabled === 1;

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <PieChartIcon size={28} color={C.primary} />
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.text }}>Analytics Admin</h1>
          <p style={{ margin: '2px 0 0', color: C.text2, fontSize: 14 }}>Manage tracked companies and analytics configuration</p>
        </div>
      </div>

      {isLoading && <Spinner />}
      {isError && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: C.danger, padding: 16, background: '#FEF2F2', borderRadius: 8, marginBottom: 20 }}>
          <AlertCircle size={16} /> Failed to load analytics companies.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Companies', value: companies.length, color: C.primary },
              { label: 'Enabled', value: companies.filter(c => isEnabled(c)).length, color: C.success },
              { label: 'Disabled', value: companies.filter(c => !isEnabled(c)).length, color: C.text2 },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {companies.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center', color: C.text2 }}>
                <PieChartIcon size={40} style={{ color: '#CBD5E1', marginBottom: 12 }} />
                <p style={{ margin: 0 }}>No analytics companies configured.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: C.bg }}>
                      {['Company', 'ID', 'Start Year', 'End Year', 'Charter ID', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((c, i) => {
                      const enabled = isEnabled(c);
                      return (
                        <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}
                          onMouseEnter={e => e.currentTarget.style.background = C.bg}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '14px 16px', fontWeight: 500, fontSize: 14, color: C.text }}>
                            {c.companyName || c.name || `Company ${i + 1}`}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: C.text2 }}>
                            {c.companyId || c.id}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: C.text2 }}>{c.startYear || '—'}</td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: C.text2 }}>{c.endYear || '—'}</td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: C.text2 }}>{c.charterId || '—'}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              fontSize: 12,
                              fontWeight: 600,
                              padding: '3px 10px',
                              borderRadius: 20,
                              background: enabled ? '#D1FAE5' : '#F1F5F9',
                              color: enabled ? '#065F46' : '#475569',
                            }}>
                              {enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                onClick={() => toggleMutation.mutate({ company: c, enabled: !enabled })}
                                disabled={toggleMutation.isPending}
                                title={enabled ? 'Disable' : 'Enable'}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '5px 10px',
                                  background: enabled ? '#FEF2F2' : '#ECFDF5',
                                  border: `1px solid ${enabled ? '#FECACA' : '#6EE7B7'}`,
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: enabled ? C.danger : C.success,
                                }}
                              >
                                {enabled ? <><ToggleRight size={12} /> Disable</> : <><ToggleLeft size={12} /> Enable</>}
                              </button>
                              <button
                                onClick={() => handleEdit(c)}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: C.primaryLight, border: `1px solid ${C.primary}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C.primary }}
                              >
                                <Edit2 size={12} /> Config
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Config Modal */}
      {editingRow && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: C.surface, borderRadius: 16, padding: 32, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>Edit Configuration</h2>
                <p style={{ margin: '4px 0 0', color: C.text2, fontSize: 13 }}>{editingRow.companyName || editingRow.name}</p>
              </div>
              <button onClick={() => setEditingRow(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text2 }}><X size={20} /></button>
            </div>
            {[
              { key: 'startYear', label: 'Start Year', type: 'number', placeholder: '2020' },
              { key: 'endYear', label: 'End Year', type: 'number', placeholder: '2025' },
              { key: 'charterId', label: 'Charter ID', type: 'text', placeholder: 'e.g. CH-001' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
                <input
                  type={type}
                  value={editForm[key]}
                  onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={() => setEditingRow(null)} style={{ flex: 1, padding: 10, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Cancel</button>
              <button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                style={{ flex: 1, padding: 10, background: C.primary, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: updateMutation.isPending ? 0.7 : 1 }}
              >
                <Save size={14} /> {updateMutation.isPending ? 'Saving…' : 'Save Config'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
