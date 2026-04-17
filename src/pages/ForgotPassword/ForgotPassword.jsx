import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import * as api from '../../api/client';

const C = {
  primary: '#0197cc',
  surface: '#FFFFFF',
  text: '#0F172A',
  text2: '#64748B',
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.forgotPassword({ email }),
    onSuccess: () => {
      setSent(true);
      toast.success('Reset link sent! Check your email.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Something went wrong.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    mutate();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
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
            <KeyRound size={28} color={C.primary} />
          </div>
          <h1 style={{ color: C.text, fontSize: 26, fontWeight: 700, margin: 0 }}>Forgot Password</h1>
          <p style={{ color: C.text2, fontSize: 14, marginTop: 8 }}>
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div style={{
            background: '#ECFDF5',
            border: '1px solid #6EE7B7',
            borderRadius: 10,
            padding: '20px 24px',
            textAlign: 'center',
            marginBottom: 24,
          }}>
            <div style={{ color: '#065F46', fontWeight: 600, marginBottom: 6 }}>Email Sent!</div>
            <div style={{ color: '#065F46', fontSize: 14 }}>
              Check your inbox at <strong>{email}</strong> for a password reset link.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Email Address
            </label>
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                <Mail size={16} color="#94A3B8" />
              </span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 38px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>
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
              {isPending ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/login" style={{ color: C.primary, fontSize: 14, textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
