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

  // Use profile image if available
  const profileImg = setupData?.imageUri || setupData?.profileImage || null;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
        }}
      >
        <span style={{ fontSize: 15, color: C.text, fontWeight: 400 }}>{fullName}</span>
        {profileImg ? (
          <img
            src={profileImg}
            alt={fullName}
            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: C.teal, display: profileImg ? 'none' : 'flex', alignItems: 'center',
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

// ── Company/User name center element — matches vembu header center ─────────────
// In vembu this is an admin user-switcher dropdown (react-select)
// We render it as a styled select input that looks like the vembu placeholder
function CompanyUserSelect({ userList, onSwitch }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: 240 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          border: 'none', borderRadius: 4,
          padding: '7px 12px', background: 'transparent',
          fontSize: 14, color: C.grey, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          minWidth: 220,
        }}
      >
        <span>Company and User name</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 9999,
          background: C.white, border: `1px solid ${C.border}`, borderRadius: 4,
          boxShadow: '0 4px 16px rgba(0,0,0,.15)', maxHeight: 320, overflowY: 'auto',
        }}>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.border}` }}>
            <input
              autoFocus
              placeholder="Search users…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', border: `1px solid ${C.border}`, borderRadius: 4,
                padding: '5px 8px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
              onClick={e => e.stopPropagation()}
            />
          </div>
          {(userList || [])
            .filter(u => !search || `${u.firstname} ${u.lastname}`.toLowerCase().includes(search.toLowerCase()))
            .slice(0, 30)
            .map((u, i) => (
              <div
                key={u.id || i}
                onClick={() => { onSwitch && onSwitch(u); setOpen(false); setSearch(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${C.border}`,
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0faff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: C.teal,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>
                  {((u.firstname || '')[0] || '') + ((u.lastname || '')[0] || '')}
                </div>
                <div>
                  <div style={{ fontSize: 14, color: C.text }}>{u.firstname} {u.lastname}</div>
                  <div style={{ fontSize: 12, color: C.teal }}>{u.companyName}</div>
                </div>
              </div>
            ))}
          {(!userList || userList.length === 0) && (
            <div style={{ padding: '12px 16px', color: C.grey, fontSize: 13, textAlign: 'center' }}>
              No users available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Secondary nav (keep for app usability — vembu had CoreUI sidebar) ─────────
function SecondaryNav({ currentPath }) {
  return (
    <nav style={{
      background: C.navBg,
      borderBottom: `1px solid ${C.border}`,
      display: 'flex',
      alignItems: 'stretch',
      height: 48,
      paddingLeft: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,.06)',
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
              padding: '0 18px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              fontSize: 15,
              fontWeight: active ? 600 : 400,
              color: active ? C.teal : '#4e5a65',
              borderBottom: active ? `3px solid ${C.teal}` : '3px solid transparent',
              whiteSpace: 'nowrap',
              transition: 'color .15s',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.teal; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#4e5a65'; }}
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

  // Fetch user list for admin user-switcher (Company and User name dropdown)
  const { data: userListData } = useQuery({
    queryKey: ['searchUsers', user?.entityId],
    queryFn: () => api.getPicklist({ picklistType: 'SEARCH_USER', entityId: user?.entityId }),
    enabled: !!user?.entityId,
    select: r => {
      const list = r.data?.picklist || [];
      return list.filter(u => !(u.id === user?.entityId && u.companyId === user?.companyId));
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const isAdmin = setupData?.securityToken
    ? Number(setupData.securityToken) <= 2
    : (user?.securityToken ? Number(user.securityToken) <= 2 : false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const currentPath = location.pathname;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── Top Header — matches vembu: logo left | company+user center | name+avatar right ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 1000,
        background: C.headerBg, borderBottom: `1px solid ${C.border}`,
        height: 70, display: 'flex', alignItems: 'center',
        padding: '0 24px',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,.08)',
      }}>
        {/* Left: Logo */}
        <Link to="/dashboard" style={{
          textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0,
        }}>
          <img
            src="/logo.png"
            alt="TeamOnUP"
            style={{ width: 300, height: 'auto', objectFit: 'contain', maxHeight: 70 }}
          />
        </Link>

        {/* Center: Company and User name dropdown — matches vembu header */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 24px' }}>
          <CompanyUserSelect
            userList={userListData}
            onSwitch={(u) => {
              // Admin user-switching functionality would go here
              console.log('Switch to user:', u);
            }}
          />
        </div>

        {/* Right: Name + Avatar dropdown */}
        <UserDropdown
          user={user}
          setupData={setupData}
          onLogout={handleLogout}
          isAdmin={isAdmin}
        />
      </header>

      {/* ── Secondary Nav Bar — navigation (replaces CoreUI sidebar from vembu) ── */}
      <SecondaryNav currentPath={currentPath} />

      {/* ── Page content ── */}
      <main>
        {children}
      </main>
    </div>
  );
}
