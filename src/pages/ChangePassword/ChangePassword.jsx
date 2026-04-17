import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import * as api from '../../api/client';
import useAuthStore from '../../store/authStore';

const C = {
  primary: '#0197cc',
  danger: '#EF4444',
  surface: '#FFFFFF',
  text: '#0F172A',
  text2: '#64748B',
};

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ new: false, confirm: false });

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.changePassword({
      entityId: user?.entityId,
      newPassword: form.newPassword,
    }),
    onSuccess: () => {
      toast.success('Password changed successfully!');
      navigate('/dashboard');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to change password.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.newPassword || !form.confirmPassword) {
      toast.error('Please fill in all fields'); return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (form.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters'); return;
    }
    mutate();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: 24,
    }}>
      <div style={{
        background: C.surface,
        borderRadius: 16,
        padding: 48,
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 14,
            background: '#e6f7fd',
            marginBottom: 16,
          }}>
            <Lock size={28} color={C.primary} />
          </div>
          <h1 style={{ color: C.text, fontSize: 26, fontWeight: 700, margin: 0 }}>Change Password</h1>
          <p style={{ color: C.text2, fontSize: 14, marginTop: 8 }}>
            {user?.email ? `Changing password for ${user.email}` : 'Set a new password'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {[
            { key: 'newPassword', label: 'New Password', showKey: 'new' },
            { key: 'confirmPassword', label: 'Confirm New Password', showKey: 'confirm' },
          ].map(({ key, label, showKey }) => (
            <div key={key} style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                {label}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                  <Lock size={16} color="#94A3B8" />
                </span>
                <input
                  type={show[showKey] ? 'text' : 'password'}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 38px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}
                >
                  {show[showKey] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}

          {form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', marginBottom: 16, color: C.danger, fontSize: 13 }}>
              Passwords do not match
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            style={{
              width: '100%',
              padding: '13px',
              background: isPending ? '#818CF8' : C.primary,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending ? 'Saving…' : 'Change Password'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/dashboard" style={{ color: C.primary, fontSize: 14, textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
