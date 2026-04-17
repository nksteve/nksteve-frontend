import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Building, Edit2, X, Loader2, AlertCircle, Save } from 'lucide-react';
import * as api from '../../../api/client';
import useAuthStore from '../../../store/authStore';

const C = {
  primary: '#0197cc',
  primaryLight: '#e6f7fd',
  success: '#10B981',
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

export default function CompanyManagement() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const queryClient = useQueryClient();
  const [editingCompany, setEditingCompany] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data: companies = [], isLoading, isError } = useQuery({
    queryKey: ['picklist-company'],
    queryFn: () => api.getPicklist({ picklistType: 'COMPANY', companyId: null }),
    select: (res) => res.data?.picklist || res.data?.result || res.data?.companies || [],
  });

  const updateMutation = useMutation({
    mutationFn: () => api.updateCompany({ ...editForm, companyId: editingCompany?.companyId || editingCompany?.id }),
    onSuccess: () => {
      toast.success('Company updated!');
      queryClient.invalidateQueries(['picklist-company']);
      setEditingCompany(null);
    },
    onError: () => toast.error('Failed to update company'),
  });

  const handleEdit = (company) => {
    setEditingCompany(company);
    setEditForm({ ...company });
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <Building size={28} color={C.primary} />
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.text }}>Company Management</h1>
          <p style={{ margin: '2px 0 0', color: C.text2, fontSize: 14 }}>{companies.length} companies</p>
        </div>
      </div>

      {isLoading && <Spinner />}
      {isError && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#EF4444', padding: 16, background: '#FEF2F2', borderRadius: 8 }}>
          <AlertCircle size={16} /> Failed to load companies.
        </div>
      )}

      {!isLoading && !isError && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {companies.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: C.text2 }}>
              <Building size={40} style={{ color: '#CBD5E1', marginBottom: 12 }} />
              <p style={{ margin: 0 }}>No companies found.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {['Company', 'ID', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companies.map((c, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building size={16} color={C.primary} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 14, color: C.text }}>{c.companyName || c.label || c.name}</div>
                          {c.domain && <div style={{ fontSize: 12, color: C.text2 }}>{c.domain}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: C.text2 }}>{c.companyId || c.id || c.value}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {c.status !== undefined && (
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: c.status === 'Active' || c.status === 1 ? '#D1FAE5' : '#F1F5F9', color: c.status === 'Active' || c.status === 1 ? '#065F46' : '#475569' }}>
                          {c.status === 1 ? 'Active' : c.status || 'Active'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => handleEdit(c)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: C.primaryLight, border: `1px solid ${C.primary}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C.primary }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingCompany && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: C.surface, borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>Edit Company</h2>
              <button onClick={() => setEditingCompany(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text2 }}><X size={20} /></button>
            </div>
            {Object.keys(editForm).filter(k => typeof editForm[k] !== 'object').slice(0, 8).map(key => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'capitalize' }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <input
                  type="text"
                  value={editForm[key] || ''}
                  onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={() => setEditingCompany(null)} style={{ flex: 1, padding: 10, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Cancel</button>
              <button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                style={{ flex: 1, padding: 10, background: C.primary, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: updateMutation.isPending ? 0.7 : 1 }}
              >
                <Save size={14} /> {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
