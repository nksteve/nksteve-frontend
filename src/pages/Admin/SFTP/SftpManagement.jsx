import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Edit2, Loader2, AlertCircle, X, Plus, Download } from 'lucide-react';
import * as api from '../../../api/client';
import useAuthStore from '../../../store/authStore';

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

const inputStyle = {
  padding: '9px 12px',
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  background: C.surface,
  width: '100%',
};

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function SftpManagement() {
  const { user } = useAuthStore();
  const securityToken = user?.securityToken ?? 0;
  const queryClient = useQueryClient();

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [config, setConfig] = useState(null);
  const [measures, setMeasures] = useState([]);
  const [viewPassword, setViewPassword] = useState(false);
  const [editFileName, setEditFileName] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Add SFTP user modal
  const [addUserModal, setAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ companyId: '', location: '', username: '', password: '' });

  // Add/Edit Measure modal
  const [measureModal, setMeasureModal] = useState(false);
  const [measureValue, setMeasureValue] = useState('');
  const [editMeasureId, setEditMeasureId] = useState(null);

  // Fetch companies (superAdmin sees all, others see own)
  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['sftp-companies'],
    queryFn: () => api.sftpAdmin({ action: 'GET_COMPANIES' }),
    select: (res) => res.data?.results?.result || [],
  });

  // Set default company
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      const found = companies.find(c => c.id === user?.companyId) || companies[0];
      setSelectedCompanyId(String(found.id));
      loadData(found.id);
    }
  }, [companies]);

  const loadData = async (cid) => {
    try {
      const res = await api.sftpAdmin({ action: 'GET', companyId: cid });
      const result = res.data?.results?.result;
      setConfig(result?.config || null);
      setMeasures(result?.data || []);
    } catch (e) {
      console.error(e);
      setConfig(null);
      setMeasures([]);
    }
  };

  const handleCompanyChange = (e) => {
    const cid = e.target.value;
    setSelectedCompanyId(cid);
    setConfig(null);
    setMeasures([]);
    setEditFileName(false);
    loadData(cid);
  };

  const fileNameMutation = useMutation({
    mutationFn: (data) => api.sftpUser(data),
    onSuccess: () => {
      toast.success('File name updated');
      setEditFileName(false);
      setConfig(c => ({ ...c, fileName: newFileName }));
      loadData(selectedCompanyId);
    },
    onError: () => toast.error('Failed to update file name'),
  });

  const createUserMutation = useMutation({
    mutationFn: (data) => api.createSftpUser(data),
    onSuccess: () => {
      toast.success('SFTP user created');
      setAddUserModal(false);
      setNewUser({ companyId: '', location: '', username: '', password: '' });
      loadData(selectedCompanyId);
    },
    onError: (e) => toast.error('Failed: ' + (e?.response?.data?.error || e.message)),
  });

  const measureMutation = useMutation({
    mutationFn: (data) => api.sftpAdmin(data),
    onSuccess: () => {
      toast.success(editMeasureId ? 'Measure updated' : 'Measure added');
      setMeasureModal(false);
      setMeasureValue('');
      setEditMeasureId(null);
      loadData(selectedCompanyId);
    },
    onError: () => toast.error('Failed to save measure'),
  });

  const downloadCSV = () => {
    if (!measures.length) { toast.warning('No measures to download'); return; }
    const headers = measures.map(m => m.measure).join(',');
    const values = measures.map(() => 0).join(',');
    const csv = `${headers}\n${values}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config?.fileName || 'sftp'}-sample.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const openEditMeasure = (m) => {
    setEditMeasureId(m.endPointId || m.id);
    setMeasureValue(m.measure);
    setMeasureModal(true);
  };

  const handleSaveMeasure = () => {
    if (!measureValue.trim()) return;
    const payload = {
      action: editMeasureId ? 'UPDATE' : 'INSERT',
      endpointId: editMeasureId || null,
      measure: measureValue,
      companyId: selectedCompanyId,
      ...(editMeasureId ? {} : { configKey: 'MEASURE', fileName: config?.fileName }),
    };
    measureMutation.mutate(payload);
  };

  const companyName = companies.find(c => String(c.id) === String(selectedCompanyId))?.name || '';

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', fontSize: 26, fontWeight: 700, color: C.text, marginBottom: 28 }}>
        SFTP Management
      </h1>

      {loadingCompanies && <Spinner />}

      {!loadingCompanies && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Company row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>Company :</span>
            {securityToken === 2 ? (
              <select value={selectedCompanyId} onChange={handleCompanyChange}
                style={{ ...inputStyle, width: 200 }}>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <span style={{ fontSize: 15 }}>{companyName}</span>
            )}
            <button onClick={() => setAddUserModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#6C757D', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              <Plus size={14} /> Add SFTP User
            </button>
          </div>

          {/* Username / Password */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>User Name :</span>
              <span style={{ fontSize: 15 }}>{config?.username || '—'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>Password :</span>
              <span style={{ fontSize: 15, fontFamily: 'monospace' }}>
                {config ? (viewPassword ? config.password : '•••••••••') : '—'}
              </span>
              <button onClick={() => setViewPassword(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text2, display: 'flex', padding: 4 }}>
                {viewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* File Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>File Location :</span>
            <span style={{ fontSize: 15 }}>{config?.location || '—'}</span>
          </div>

          {/* File Name row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>File Name :</span>
              {editFileName ? (
                <>
                  <input value={newFileName} onChange={e => setNewFileName(e.target.value)}
                    style={{ ...inputStyle, width: 180 }} />
                  <button onClick={() => fileNameMutation.mutate({ action: 'UPDATE', companyId: selectedCompanyId, fileName: newFileName })}
                    style={{ padding: '7px 14px', background: C.success, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    Save
                  </button>
                  <button onClick={() => { setNewFileName(''); setEditFileName(false); }}
                    style={{ padding: '7px 14px', background: C.danger, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 15 }}>{config?.fileName || ''}</span>
                  <button onClick={() => { setNewFileName(config?.fileName || ''); setEditFileName(true); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text2, display: 'flex', padding: 4 }}>
                    <Edit2 size={15} />
                  </button>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setMeasureValue(''); setEditMeasureId(null); setMeasureModal(true); }}
                style={{ padding: '8px 16px', background: '#6C757D', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                Add Measure
              </button>
              <button onClick={downloadCSV}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#6C757D', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                <Download size={14} /> Download Sample CSV
              </button>
            </div>
          </div>

          {/* Measures table */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginTop: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {['Measure', 'Config Key', 'Calculation', ''].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {measures.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '40px 20px', textAlign: 'center', color: C.text2 }}>
                      {config ? 'No measures configured.' : 'Select a company to view SFTP data.'}
                    </td>
                  </tr>
                ) : (
                  measures.map((m, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: C.text }}>{m.measure}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: C.text2 }}>{m.configKey || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: C.text2 }}>{m.calculation || '—'}</td>
                      <td style={{ padding: '12px 16px', width: 50 }}>
                        <button onClick={() => openEditMeasure(m)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.primary, display: 'flex' }}>
                          <Edit2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add SFTP User Modal */}
      {addUserModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: C.surface, borderRadius: 12, width: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Add SFTP User</h3>
              <button onClick={() => setAddUserModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'companyId', label: 'Company ID', type: 'number' },
                { key: 'location', label: 'Location', type: 'text', placeholder: '/var/sftp/company/files/' },
                { key: 'username', label: 'Username', type: 'text' },
                { key: 'password', label: 'Password', type: 'password' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
                  <input type={type} value={newUser[key]} onChange={e => setNewUser(u => ({ ...u, [key]: e.target.value }))}
                    placeholder={placeholder || ''} style={inputStyle} />
                </div>
              ))}
            </div>
            <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setAddUserModal(false)}
                style={{ padding: '8px 18px', background: C.primary, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: '#fff' }}>
                Cancel
              </button>
              <button onClick={() => createUserMutation.mutate(newUser)} disabled={createUserMutation.isPending}
                style={{ padding: '8px 18px', background: C.success, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: '#fff' }}>
                {createUserMutation.isPending ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Measure Modal */}
      {measureModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: C.surface, borderRadius: 12, width: 400 }}>
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{editMeasureId ? 'Edit' : 'New'} Measure</h3>
              <button onClick={() => { setMeasureModal(false); setMeasureValue(''); setEditMeasureId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Measure :</label>
              <input value={measureValue} onChange={e => setMeasureValue(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => { setMeasureModal(false); setMeasureValue(''); setEditMeasureId(null); }}
                style={{ padding: '8px 18px', background: C.primary, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: '#fff' }}>
                Cancel
              </button>
              <button onClick={handleSaveMeasure} disabled={measureMutation.isPending}
                style={{ padding: '8px 18px', background: '#6C757D', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, color: '#fff' }}>
                {editMeasureId ? 'Edit' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
