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
  navBg:    '#ffffff',
  navHover: '#f0faff',
};

const NAV_ITEMS = [
  { label: 'Dashboard',     path: '/dashboard'     },
  { label: 'Work Plan',     path: '/work-plan'      },
  { label: 'Meetings',      path: '/meetings'       },
  { label: 'ThoughtPad',    path: '/thoughtpad'     },
  { label: 'Notifications', path: '/notifications'  },
  { label: 'Reporting',     path: '/reporting'      },
  { label: 'Analytics',     path: '/analytics'      },
];

const dropItemStyle = {
  display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '10px 16px', fontSize: 14, color: C.text,
};

function UserDropdown({ user, setupData, onLogout, isAdmin }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const firstName  = setupData?.firstName || '';
  const lastName   = setupData?.lastName  || '';
  const emailPrefix = user?.email ? user.email.split('@')[0] : '';
  const fullName   = [firstName, lastName].filter(Boolean).join(' ') || emailPrefix || 'User';
  const initials   = firstName && lastName
    ? (firstName[0] + lastName[0]).toUpperCase()
    : fullName.slice(0, 2).toUpperCase();

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
        }}
      >
        <span style={{ fontSize: 15, color: C.text, fontWeight: 500 }}>{fullName}</span>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
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
            👤 My Profile
          </button>
          <button onClick={() => { setOpen(false); navigate('/change-password'); }} style={dropItemStyle}>
            🔒 Change Password
          </button>
          {isAdmin && (
            <button onClick={() => { setOpen(false); navigate('/adminLandingPage'); }} style={dropItemStyle}>
              🛡️ Admin
            </button>
          )}
          {isAdmin && (
            <button onClick={() => { setOpen(false); navigate('/userManagement'); }} style={dropItemStyle}>
              ➕ Add User
            </button>
          )}
          {isAdmin && (
            <button onClick={() => { setOpen(false); navigate('/reporting'); }} style={dropItemStyle}>
              📊 Reporting
            </button>
          )}
          <button onClick={() => { setOpen(false); onLogout(); }} style={{ ...dropItemStyle, color: '#dc3545', borderTop: `1px solid ${C.border}` }}>
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
}

function SecondaryNav({ currentPath }) {
  return (
    <nav style={{
      background: C.navBg,
      borderBottom: `1px solid ${C.border}`,
      display: 'flex',
      alignItems: 'stretch',
      height: 46,
      paddingLeft: 16,
    }}>
      {NAV_ITEMS.map(item => {
        const active = currentPath === item.path ||
          (item.path !== '/dashboard' && currentPath.startsWith(item.path));
        return (
          <Link
            key={item.path}
            to={item.path}
            style={{
              textDecoration: 'none',
              padding: '0 16px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              fontSize: 14,
              fontWeight: active ? 600 : 400,
              color: active ? C.teal : C.text,
              borderBottom: active ? `3px solid ${C.teal}` : '3px solid transparent',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.teal; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.text; }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();

  const { data: setupData } = useQuery({
    queryKey: ['entitySetup', user?.entityId],
    queryFn:  () => api.getEntitySetup(user?.entityId),
    enabled:  !!user?.entityId,
    select:   r => r.data?.entity || {},
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const isAdmin = setupData?.securityToken
    ? Number(setupData.securityToken) <= 2
    : (user?.securityToken ? Number(user.securityToken) <= 2 : false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const companyName = setupData?.companyName || 'OnUP';
  const currentPath = location.pathname;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── Top Header — matches vembu: logo | company+user center | name+avatar right ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 1000,
        background: C.headerBg, borderBottom: `1px solid ${C.border}`,
        height: 85, display: 'flex', alignItems: 'center',
        padding: '0 24px',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,.08)',
      }}>
        {/* Left: Logo */}
        <Link to="/dashboard" style={{
          textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1 }}>
            <span style={{ color: C.text }}>Team</span>
            <span style={{ color: C.teal }}>On</span>
            <span style={{ color: C.purple }}>UP</span>
          </span>
        </Link>

        {/* Center: Company and User name label (matches vembu) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: C.grey, fontSize: 14 }}>
          <span>Company and User name</span>
          <span style={{ color: C.text, fontWeight: 500 }}>{companyName}</span>
        </div>

        {/* Right: Name + Avatar dropdown */}
        <UserDropdown
          user={user}
          setupData={setupData}
          onLogout={handleLogout}
          isAdmin={isAdmin}
        />
      </header>

      {/* ── Secondary Nav Bar — Dashboard, Work Plan, Meetings etc. ── */}
      <SecondaryNav currentPath={currentPath} />

      {/* ── Page content ── */}
      <main>
        {children}
      </main>
    </div>
  );
}
