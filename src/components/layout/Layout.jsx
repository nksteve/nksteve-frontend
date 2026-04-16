import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as api from '../../api/client';
import useAuthStore from '../../store/authStore';

const C = {
  teal:     '#0197cc',
  purple:   '#a25ddc',
  white:    '#ffffff',
  grey:     '#989898',
  border:   '#e4e7ea',
  bg:       '#f4f5fa',
  text:     '#23282c',
  headerBg: '#ffffff',
};

function UserDropdown({ user, setupData, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const firstName = setupData?.firstName || '';
  const lastName  = setupData?.lastName  || '';
  const fullName  = [firstName, lastName].filter(Boolean).join(' ') || user?.email || '';
  const initials  = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
        }}
      >
        <span style={{ fontSize: 14, color: C.text }}>{fullName}</span>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: C.teal, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: C.white, fontWeight: 700, fontSize: 15,
        }}>
          {initials}
        </div>
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%', background: C.white,
          border: `1px solid ${C.border}`, borderRadius: 4, minWidth: 180,
          boxShadow: '0 4px 16px rgba(0,0,0,.15)', zIndex: 9999,
        }}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{fullName}</div>
            <div style={{ fontSize: 12, color: C.grey }}>{user?.email}</div>
          </div>
          <button onClick={() => { setOpen(false); navigate('/userprofile'); }} style={dropItemStyle}>
            My Profile
          </button>
          <button onClick={() => { setOpen(false); onLogout(); }} style={{ ...dropItemStyle, color: '#dc3545' }}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

const dropItemStyle = {
  display: 'block', width: '100%', textAlign: 'left',
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '10px 16px', fontSize: 14, color: C.text,
};

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: setupData } = useQuery({
    queryKey: ['entitySetup', user?.entityId],
    queryFn: () => api.getEntitySetup(user?.entityId),
    enabled: !!user?.entityId,
    select: r => r.data?.entity || {},
    staleTime: 5 * 60 * 1000,
  });

  const isAdmin = user?.securityToken && Number(user.securityToken) <= 2;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const companyName = setupData?.companyName || '';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'acumin-pro, -apple-system, sans-serif' }}>
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 1000,
        background: C.headerBg, borderBottom: `1px solid ${C.border}`,
        height: 70, display: 'flex', alignItems: 'center',
        padding: '0 24px', justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,.08)',
      }}>
        {/* Logo */}
        <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, color: C.teal }}>
            TeamOn<span style={{ color: C.purple }}>UP</span>
          </span>
        </Link>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {companyName && (
            <span style={{ fontSize: 14, color: C.grey }}>{companyName}</span>
          )}
          <UserDropdown user={user} setupData={setupData} onLogout={handleLogout} />
        </div>
      </header>

      {/* ── Page content ──────────────────────────────────────────────────────── */}
      <main>
        {children}
      </main>
    </div>
  );
}
