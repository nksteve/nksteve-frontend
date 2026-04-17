import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Users, Search, Trash2, UserPlus, Loader2, AlertCircle, X } from 'lucide-react';
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
};

function StatusBadge({ statusId }) {
  const isActive = statusId === 1;
  return (
    <span style={{
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      background: isActive ? '#D1FAE5' : '#F1F5F9',
      color: isActive ? '#065F46' : '#475569',
    }}>
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

export default function UserManagement() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['adminUsers', companyId],
    queryFn: () => api.getAdminUsers({ companyId }),
    select: (res) => res.data?.users || res.data?.result || [],
    enabled: !!companyId,
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
    return !q || (u.email || u.displayName || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.text }}>User Management</h1>
          <p style={{ margin: '4px 0 0', color: C.text2, fontSize: 14 }}>{users.length} total users</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          <UserPlus size={16} /> Invite User
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.text2 }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users by email…"
          style={{ width: '100%', padding: '11px 12px 11px 38px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: C.surface }}
          onFocus={e => e.target.style.borderColor = C.primary}
          onBlur={e => e.target.style.borderColor = C.border}
        />
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
                {['Email / Name', 'Entity ID', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '40px 20px', textAlign: 'center', color: C.text2 }}>
                    {search ? 'No users match your search.' : 'No users found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((u, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                          {(u.email || u.displayName || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 14, color: C.text }}>{u.displayName || u.email}</div>
                          {u.displayName && u.email && <div style={{ fontSize: 12, color: C.text2 }}>{u.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: C.text2 }}>{u.entityId}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge statusId={u.statusId} />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${u.email || u.displayName}?`)) {
                            deleteMutation.mutate(u.entityId);
                          }
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C.danger }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: C.surface, borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>Invite User</h2>
              <button onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text2 }}><X size={20} /></button>
            </div>
            <p style={{ color: C.text2, fontSize: 14, marginBottom: 16 }}>
              Enter the user's email address to send an invitation.
            </p>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email Address</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="user@company.com"
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 20 }}
            />
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: '#9A3412' }}>ℹ Invitation functionality requires backend configuration. This is a UI placeholder.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowInviteModal(false)} style={{ flex: 1, padding: 10, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Cancel</button>
              <button onClick={() => { toast.info('Invite feature coming soon'); setShowInviteModal(false); }} style={{ flex: 1, padding: 10, background: C.primary, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#fff' }}>Send Invite</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
