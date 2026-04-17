import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as api from '../../api/client';
import useAuthStore from '../../store/authStore';

const C = {
  teal:     '#0197cc',
  tealDark: '#0086c0',
  purple:   '#a25ddc',
  white:    '#ffffff',
  grey:     '#989898',
  border:   '#e4e7ea',
  bg:       '#f4f5fa',
  text:     '#23282c',
  headerBg: '#ffffff',
  navHover: '#f0faff',
};

// ── Nav items — matches vembu's page structure ──────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard',   path: '/dashboard'     },
  { label: 'Work Plan',   path: '/work-plan'      },
  { label: 'Meetings',    path: '/meetings'       },
  { label: 'ThoughtPad',  path: '/thoughtpad'     },
  { label: 'Notifications', path: '/notifications' },
  { label: 'Reporting',   path: '/reporting'      },
  { label: 'Analytics',   path: '/analytics'      },
];

function UserDropdown({ user, setupData, onLogout, isAdmin }) {
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
  // Fallback: use email prefix if name not yet loaded
  const emailPrefix = user?.email ? user.email.split('@')[0] : '';
  const fullName  = [firstName, lastName].filter(Boolean).join(' ')
    || emailPrefix
    || 'User';
  const initials  = firstName && lastName
    ? (firstName[0] + lastName[0]).toUpperCase()
    : fullName.slice(0, 2).toUpperCase();

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
        }}
      >
        <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{fullName}</span>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: C.teal, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: C.white, fontWeight: 700, fontSize: 15,
          flexShrink: 0,
        }}>
          {initials}
        </div>
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%', background: C.white,
          border: `1px solid ${C.border}`, borderRadius: 4, minWidth: 200,
          boxShadow: '0 4px 16px rgba(0,0,0,.15)', zIndex: 9999,
        }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{fullName}</div>
            <div style={{ fontSize: 12, color: C.grey, marginTop: 2 }}>{user?.email}</div>
          </div>
          <button onClick={() => { setOpen(false); navigate('/userprofile'); }} style={dropItemStyle}>
            <i style={{ width: 18, display: 'inline-block' }}>👤</i> My Profile
          </button>
          <button onClick={() => { setOpen(false); navigate('/change-password'); }} style={dropItemStyle}>
            <i style={{ width: 18, display: 'inline-block' }}>🔒</i> Change Password
          </button>
          {isAdmin && (
            <button onClick={() => { setOpen(false); navigate('/adminLandingPage'); }} style={dropItemStyle}>
              <i style={{ width: 18, display: 'inline-block' }}>🛡️</i> Admin
            </button>
          )}
          {isAdmin && (
            <button onClick={() => { setOpen(false); navigate('/reporting'); }} style={dropItemStyle}>
              <i style={{ width: 18, display: 'inline-block' }}>📊</i> Reporting
            </button>
          )}
          <button onClick={() => { setOpen(false); onLogout(); }} style={{ ...dropItemStyle, color: '#dc3545', borderTop: `1px solid ${C.border}` }}>
            <i style={{ width: 18, display: 'inline-block' }}>🚪</i> Logout
          </button>
        </div>
      )}
    </div>
  );
}

const dropItemStyle = {
  display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '10px 16px', fontSize: 14, color: C.text,
};

function NavLink({ to, label, currentPath }) {
  const active = currentPath === to || (to !== '/dashboard' && currentPath.startsWith(to));
  return (
    <Link
      to={to}
      style={{
        textDecoration: 'none',
        padding: '0 14px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        color: active ? C.teal : C.text,
        borderBottom: active ? `3px solid ${C.teal}` : '3px solid transparent',
        transition: 'all .15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.color = C.teal; e.currentTarget.style.background = C.navHover; }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.color = C.text; e.currentTarget.style.background = 'transparent'; }}}
    >
      {label}
    </Link>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: setupData } = useQuery({
    queryKey: ['entitySetup', user?.entityId],
    queryFn: () => api.getEntitySetup(user?.entityId),
    enabled: !!user?.entityId,
    select: r => r.data?.entity || {},
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const isAdmin = setupData?.securityToken
    ? Number(setupData.securityToken) <= 2
    : (user?.securityToken ? Number(user.securityToken) <= 2 : false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const companyName = setupData?.companyName || '';
  const currentPath = location.pathname;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif' }}>
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 1000,
        background: C.headerBg, borderBottom: `1px solid ${C.border}`,
        height: 60, display: 'flex', alignItems: 'stretch',
        padding: '0 24px 0 16px',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,.08)',
      }}>
        {/* Left: Logo + Nav */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
          {/* Logo */}
          <Link to="/dashboard" style={{
            textDecoration: 'none', display: 'flex', alignItems: 'center',
            marginRight: 16, paddingRight: 16, borderRight: `1px solid ${C.border}`,
          }}>
            <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, color: C.teal, lineHeight: 1 }}>
              Team<span style={{ color: C.teal }}>On</span><span style={{ color: C.purple }}>UP</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'stretch', height: '100%' }}>
            {NAV_ITEMS.map(item => (
              <NavLink key={item.path} to={item.path} label={item.label} currentPath={currentPath} />
            ))}
          </nav>
        </div>

        {/* Right side: company name + user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {companyName && (
            <span style={{ fontSize: 13, color: C.grey, fontStyle: 'italic' }}>{companyName}</span>
          )}
          <UserDropdown
            user={user}
            setupData={setupData}
            onLogout={handleLogout}
            isAdmin={isAdmin}
          />
        </div>
      </header>

      {/* ── Page content ──────────────────────────────────────────────────────── */}
      <main>
        {children}
      </main>
    </div>
  );
}
