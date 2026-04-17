import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as api from '../../api/client';
import useAuthStore from '../../store/authStore';

// Vembu login styling: dark gray bg #464848, dark blue-gray inputs #6E7F8D
export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => api.login({ email: form.email, password: form.password }),
    onSuccess: (res) => {
      const { token, user } = res.data;
      setAuth(user, token);
      navigate('/dashboard');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Login failed. Please check your credentials.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    mutate();
  };

  return (
    <div className="login-section" style={{
      minHeight: '100vh',
      background: '#464848',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div className="login-container" style={{ width: 300, textAlign: 'center' }}>
        {/* Logo */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <img
            src="/logo.png"
            alt="TeamOnUP"
            style={{ width: 300, height: 'auto', objectFit: 'contain', marginLeft: -30 }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>

        <form onSubmit={handleSubmit} className="login-form-fields">
          {/* Email */}
          <div style={{ marginBottom: 12 }}>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="Email Address"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 6,
                border: '1px solid transparent',
                background: '#6E7F8D', color: '#fff', fontSize: 16,
                outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.background = '#80929E'}
              onBlur={e => e.target.style.background = '#6E7F8D'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 12, position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Password"
              style={{
                width: '100%', padding: '10px 40px 10px 14px', borderRadius: 6,
                border: '1px solid transparent',
                background: '#6E7F8D', color: '#fff', fontSize: 16,
                outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.background = '#80929E'}
              onBlur={e => e.target.style.background = '#6E7F8D'}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#ACB7BD', fontSize: 14,
              }}
            >
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>

          {error && (
            <div style={{
              background: 'rgba(220,53,69,0.2)', border: '1px solid rgba(220,53,69,0.4)',
              borderRadius: 4, padding: '8px 12px', marginBottom: 12,
              color: '#ff8080', fontSize: 14,
            }}>
              {error?.response?.data?.message || 'Login failed'}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            style={{
              width: '100%', padding: '10px',
              background: '#0197CC',
              color: '#fff', border: 'none', borderRadius: 6,
              fontSize: 16, fontWeight: 400, cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {isPending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link
            to="/forgot-password"
            style={{ color: '#ACB7BD', fontSize: 16, textDecoration: 'none' }}
          >
            Forgotten your password?
          </Link>
        </div>
      </div>
    </div>
  );
}
