import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { LogIn, Mail, Lock, Hash, Eye, EyeOff } from 'lucide-react';
import * as api from '../../api/client';
import useAuthStore from '../../store/authStore';

const C = {
  primary: '#0197cc',
  primaryLight: '#e6f7fd',
  danger: '#EF4444',
  surface: '#FFFFFF',
  bg: '#F8FAFC',
  border: '#E2E8F0',
  text: '#0F172A',
  text2: '#64748B',
};

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '', companyId: '' });
  const [showPw, setShowPw] = useState(false);

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => api.login({ email: form.email, password: form.password, companyId: Number(form.companyId) }),
    onSuccess: (res) => {
      const { token, user } = res.data;
      setAuth(user, token);
      toast.success('Welcome back!');
      navigate('/dashboard');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Login failed. Please check your credentials.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.companyId) {
      toast.error('Please fill in all fields');
      return;
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
        maxWidth: 440,
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 14,
            background: C.primary,
            marginBottom: 16,
          }}>
            <LogIn size={28} color="#fff" />
          </div>
          <h1 style={{ color: C.text, fontSize: 28, fontWeight: 700, margin: 0 }}>
            On<span style={{ color: C.primary }}>Up</span>
          </h1>
          <p style={{ color: C.text2, fontSize: 15, marginTop: 8 }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <InputField
            label="Email"
            type="email"
            icon={<Mail size={16} color={C.text2} />}
            value={form.email}
            onChange={v => setForm(f => ({ ...f, email: v }))}
            placeholder="you@company.com"
          />
          <InputField
            label="Password"
            type={showPw ? 'text' : 'password'}
            icon={<Lock size={16} color={C.text2} />}
            value={form.password}
            onChange={v => setForm(f => ({ ...f, password: v }))}
            placeholder="••••••••"
            suffix={
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text2, display: 'flex' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <InputField
            label="Company ID"
            type="number"
            icon={<Hash size={16} color={C.text2} />}
            value={form.companyId}
            onChange={v => setForm(f => ({ ...f, companyId: v }))}
            placeholder="e.g. 1234"
          />

          {error && (
            <div style={{ background: '#FEF2F2', border: `1px solid #FECACA`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: C.danger, fontSize: 14 }}>
              {error?.response?.data?.message || 'Login failed'}
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
              marginTop: 8,
              transition: 'background 0.15s',
            }}
          >
            {isPending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/forgot-password" style={{ color: C.primary, fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, type, icon, value, onChange, placeholder, suffix }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: 12, display: 'flex', pointerEvents: 'none' }}>{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '11px 12px 11px 38px',
            border: `1px solid #D1D5DB`,
            borderRadius: 8,
            fontSize: 14,
            color: '#111827',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
            paddingRight: suffix ? 40 : 12,
          }}
          onFocus={e => e.target.style.borderColor = '#0197cc'}
          onBlur={e => e.target.style.borderColor = '#D1D5DB'}
        />
        {suffix && <span style={{ position: 'absolute', right: 12 }}>{suffix}</span>}
      </div>
    </div>
  );
}
