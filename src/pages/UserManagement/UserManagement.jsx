import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Users, Search, Trash2, UserPlus, Loader2, AlertCircle, X, Edit2 } from 'lucide-react';
import * as api from '../../api/client';
import useAuthStore from '../../store/authStore';

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
  purple: '#6B3FA0',
};

const ROLE_MAP = { 0: 'User', 1: 'Admin', 2: 'Super Admin' };
const TIMEZONES = [
  { id: 1, name: 'Eastern Time (US & Canada)' },
  { id: 2, name: 'Central Time (US & Canada)' },
  { id: 3, name: 'Mountain Time (US & Canada)' },
  { id: 4, name: 'Pacific Time (US & Canada)' },
  { id: 5, name: 'UTC' },
];

function RoleBadge({ securityToken }) {
  const role = ROLE_MAP[securityToken] || 'User';
  const colors = {
    'User': { bg: '#EFF6FF', color: '#1D4ED8' },
    'Admin': { bg: '#FEF3C7', color: '#92400E' },
    'Super Admin': { bg: '#F3E8FF', color: '#6B21A8' },
  };
  const c = colors[role] || colors['User'];
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color }}>
      {role}
    </span>
  );
}

function StatusBadge({ statusId }) {
  const isActive = statusId === 1;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: isActive ? '#D1FAE5' : '#F1F5F9', color: isActive ? '#065F46' : '#475569' }}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
        {label}{required && <sup style={{ color: C.danger }}> *</sup>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  background: C.surface,
  color: C.text,
};

const EMPTY_USER = {
  entityId: null,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  landline: '',
  title: '',
  companyId: '',
  departmentId: '',
  countryId: '',
  stateId: '',
  city: '',
  timezoneId: '',
  statusId: 1,
  securityToken: 0,
  templateId: '',
};

export default function UserManagement() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const currentSecurityToken = user?.securityToken ?? 0;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showActive, setShowActive] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' | 'UPDATE'
  const [form, setForm] = useState({ ...EMPTY_USER });

  // Load users
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['adminUsers', companyId],
    queryFn: () => api.getAdminUsers({ companyId }),
    select: (res) => res.data?.users || res.data?.result || [],
    enabled: !!companyId,
  });

  // Load templates for CREATE modal
  const { data: templates = [] } = useQuery({
    queryKey: ['templates', companyId],
    queryFn: () => api.getTemplates({ action: 'COMMUNITYGROWTHPLAN', companyId }),
    select: (res) => res.data?.result || [],
    enabled: !!companyId && showModal && modalMode === 'CREATE',
  });

  // Load picklist departments
  const { data: departments = [] } = useQuery({
    queryKey: ['picklist-department'],
    queryFn: () => api.getPicklist({ picklistType: 'DEPARTMENT' }),
    select: (res) => res.data?.picklist || [],
    enabled: showModal,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => api.updateEntityPersonal(data),
    onSuccess: () => {
      toast.success(modalMode === 'CREATE' ? 'User created!' : 'User updated!');
      queryClient.invalidateQueries(['adminUsers']);
      setShowModal(false);
    },
    onError: (e) => toast.error('Failed: ' + (e?.response?.data?.error || e.message)),
  });

  const deleteMutation = useMutation({
    mutationFn: (entityId) => api.deleteUser({ entityId, companyId }),
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries(['adminUsers']);
    },
    onError: () => toast.error('Failed to delete user'),
  });

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = !q || (u.email || u.displayName || '').toLowerCase().includes(q) ||
      ((u.firstName || '') + ' ' + (u.lastName || '')).toLowerCase().includes(q);
    const matchesStatus = showActive ? u.statusId === 1 : u.statusId !== 1;
    return matchesSearch && matchesStatus;
  });

  const openCreate = () => {
    setForm({ ...EMPTY_USER, companyId: companyId || '' });
    setModalMode('CREATE');
    setShowModal(true);
  };

  const openEdit = (u) => {
    setForm({
      entityId: u.entityId,
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      phone: u.phone || '',
      landline: u.landline || '',
      title: u.title || '',
      companyId: u.companyId || companyId || '',
      departmentId: u.departmentId || '',
      countryId: u.countryId || '',
      stateId: u.stateId || '',
      city: u.city || '',
      timezoneId: u.timezoneId || '',
      statusId: u.statusId ?? 1,
      securityToken: u.securityToken ?? 0,
      templateId: '',
    });
    setModalMode('UPDATE');
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = () => {
    if (!form.firstName?.trim()) { toast.warning('Enter First Name'); return; }
    if (!form.lastName?.trim()) { toast.warning('Enter Last Name'); return; }
    if (!form.email?.trim()) { toast.warning('Enter Email'); return; }
    if (!form.phone?.trim() || form.phone.replace(/\D/g, '').length < 10) {
      toast.warning('Enter Phone (10 digits)'); return;
    }

    const payload = {
      action: modalMode,
      entityId: form.entityId || null,
      companyId: form.companyId || companyId,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      landline: form.landline || null,
      title: form.title || null,
      departmentId: form.departmentId || null,
      countryId: form.countryId || null,
      stateId: form.stateId || null,
      city: form.city || null,
      timeZoneId: form.timezoneId || null,
      statusId: modalMode === 'UPDATE' ? (form.statusId ?? 1) : null,
      securityToken: parseInt(form.securityToken) || 0,
      templateId: form.templateId || null,
    };
    saveMutation.mutate(payload);
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.text }}>User Management</h1>
          <p style={{ margin: '4px 0 0', color: C.text2, fontSize: 14 }}>{users.length} total users</p>
        </div>
        <button onClick={openCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <UserPlus size={16} /> Create User
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.text2 }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users…"
            style={{ width: '100%', padding: '11px 12px 11px 38px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: C.surface }} />
        </div>
        <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
          {[true, false].map(active => (
            <button key={String(active)} onClick={() => setShowActive(active)}
              style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: showActive === active ? C.primary : C.surface,
                color: showActive === active ? '#fff' : C.text2 }}>
              {active ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <Spinner />}
      {isError && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: C.danger, padding: 16, background: '#FEF2F2', borderRadius: 8 }}>
          <AlertCircle size={16} /> Failed to load users.
        </div>
      )}

      {!isLoading && !isError && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {['Name / Email', 'Title', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: C.text2 }}>
                    {search ? 'No users match your search.' : 'No users found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((u, i) => {
                  const name = (u.firstName && u.lastName) ? `${u.firstName} ${u.lastName}` : (u.displayName || u.email || '');
                  const initial = name[0]?.toUpperCase() || '?';
                  return (
                    <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.purple, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{name}</div>
                            <div style={{ fontSize: 12, color: C.text2 }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: C.text2 }}>{u.title || '—'}</td>
                      <td style={{ padding: '14px 16px' }}><RoleBadge securityToken={u.securityToken} /></td>
                      <td style={{ padding: '14px 16px' }}><StatusBadge statusId={u.statusId} /></td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => openEdit(u)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: C.primaryLight, border: `1px solid ${C.primary}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C.primary }}>
                            <Edit2 size={12} /> Edit
                          </button>
                          <button onClick={() => { if (window.confirm(`Delete ${name}?`)) deleteMutation.mutate(u.entityId); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C.danger }}>
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: C.surface, borderRadius: 16, width: '100%', maxWidth: 760, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.surface, zIndex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>
                {modalMode === 'CREATE' ? 'Add User' : 'Edit User'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text2 }}><X size={20} /></button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <Field label="First Name" required>
                  <input name="firstName" value={form.firstName} onChange={handleChange} style={inputStyle} placeholder="First name" />
                </Field>
                <Field label="Last Name" required>
                  <input name="lastName" value={form.lastName} onChange={handleChange} style={inputStyle} placeholder="Last name" />
                </Field>
                <Field label="Email" required>
                  <input name="email" value={form.email} onChange={handleChange} style={{ ...inputStyle, background: modalMode === 'UPDATE' ? '#F8FAFC' : C.surface }} readOnly={modalMode === 'UPDATE'} placeholder="email@example.com" />
                </Field>
                <Field label="Phone" required>
                  <input name="phone" value={form.phone} onChange={handleChange} style={inputStyle} placeholder="10-digit phone" type="tel" />
                </Field>
                <Field label="Landline">
                  <input name="landline" value={form.landline} onChange={handleChange} style={inputStyle} placeholder="Landline number" />
                </Field>
                <Field label="Title">
                  <input name="title" value={form.title} onChange={handleChange} style={inputStyle} placeholder="Job title" />
                </Field>
                <Field label="City">
                  <input name="city" value={form.city} onChange={handleChange} style={inputStyle} placeholder="City" />
                </Field>
                <Field label="Department">
                  <select name="departmentId" value={form.departmentId} onChange={handleChange} style={inputStyle}>
                    <option value="">Please select department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </Field>
                <Field label="Timezone">
                  <select name="timezoneId" value={form.timezoneId} onChange={handleChange} style={inputStyle}>
                    <option value="">Please select timezone</option>
                    {TIMEZONES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </Field>
                <Field label="User Type">
                  <select name="securityToken" value={form.securityToken} onChange={handleChange} style={inputStyle}>
                    <option value={0}>User</option>
                    <option value={1}>Admin</option>
                    {currentSecurityToken === 2 && <option value={2}>Super Admin</option>}
                  </select>
                </Field>
                {modalMode === 'CREATE' && (
                  <Field label="Template">
                    <select name="templateId" value={form.templateId} onChange={handleChange} style={inputStyle}>
                      <option value="">Please select a template</option>
                      {templates.map(t => <option key={t.teamId} value={t.teamId}>{t.NAME}</option>)}
                    </select>
                  </Field>
                )}
                {modalMode === 'UPDATE' && (
                  <Field label="Status">
                    <select name="statusId" value={form.statusId} onChange={handleChange} style={inputStyle}>
                      <option value={1}>Active</option>
                      <option value={2}>Inactive</option>
                    </select>
                  </Field>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 28px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10, position: 'sticky', bottom: 0, background: C.surface }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: '9px 20px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: C.text }}>
                Close
              </button>
              <button onClick={handleSave} disabled={saveMutation.isPending}
                style={{ padding: '9px 20px', background: C.danger, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#fff', opacity: saveMutation.isPending ? 0.7 : 1 }}>
                {saveMutation.isPending ? 'Saving…' : (modalMode === 'UPDATE' ? 'Update' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
