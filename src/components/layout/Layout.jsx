import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Video, BookOpen, Bell, BarChart2, TrendingUp,
  Shield, Users, GraduationCap, FileText, Upload, Building, Clock, PieChart,
  LogOut, User, ChevronLeft, ChevronRight, Menu,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const C = {
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  surface: '#FFFFFF',
  bg: '#F8FAFC',
  border: '#E2E8F0',
  text: '#0F172A',
  text2: '#64748B',
  sidebar: '#1E293B',
  sidebarText: '#94A3B8',
  sidebarActive: '#4F46E5',
};

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/work-plan', label: 'Work Plan', icon: Calendar },
  { to: '/meetings', label: 'Meetings', icon: Video },
  { to: '/thoughtpad', label: 'ThoughtPad', icon: BookOpen },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/reporting', label: 'Reporting', icon: BarChart2 },
  { to: '/analytics', label: 'Analytics', icon: TrendingUp },
];

const adminItems = [
  { to: '/adminLandingPage', label: 'Admin Dashboard', icon: Shield },
  { to: '/userManagement', label: 'User Management', icon: Users },
  { to: '/training/video', label: 'Training', icon: GraduationCap },
  { to: '/templatemanagement', label: 'Templates', icon: FileText },
  { to: '/sftpAdmin', label: 'SFTP', icon: Upload },
  { to: '/companymanagement', label: 'Company', icon: Building },
  { to: '/cronmanagement', label: 'Cron Jobs', icon: Clock },
  { to: '/analyticsAdmin', label: 'Analytics Admin', icon: PieChart },
];

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = user?.securityToken !== undefined && Number(user.securityToken) <= 2;

  const sidebarW = collapsed ? 64 : 240;

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarW,
        minWidth: sidebarW,
        background: C.sidebar,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
        zIndex: 100,
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '20px 0' : '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          minHeight: 64,
        }}>
          {!collapsed && (
            <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 20, letterSpacing: '-0.5px' }}>
              On<span style={{ color: C.primary }}>Up</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: 6,
              padding: 6,
              cursor: 'pointer',
              color: C.sidebarText,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavItem key={to} to={to} label={label} Icon={Icon} collapsed={collapsed} />
          ))}

          {isAdmin && (
            <>
              <div style={{
                margin: '12px 16px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: 12,
              }}>
                {!collapsed && (
                  <span style={{ color: 'rgba(148,163,184,0.6)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Admin
                  </span>
                )}
              </div>
              {adminItems.map(({ to, label, icon: Icon }) => (
                <NavItem key={to} to={to} label={label} Icon={Icon} collapsed={collapsed} />
              ))}
            </>
          )}
        </nav>

        {/* User section */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: collapsed ? '12px 0' : '12px 16px',
        }}>
          {!collapsed && (
            <button
              onClick={() => navigate('/userprofile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 0',
                marginBottom: 4,
              }}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: C.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <User size={16} color="#fff" />
              </div>
              <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                <div style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                  {user?.email || 'User'}
                </div>
                <div style={{ color: C.sidebarText, fontSize: 11 }}>View Profile</div>
              </div>
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => navigate('/userprofile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 0',
                marginBottom: 4,
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} color="#fff" />
              </div>
            </button>
          )}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 8,
              width: '100%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: 6,
              color: C.sidebarText,
              fontSize: 13,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top header */}
        <header style={{
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 16,
          flexShrink: 0,
        }}>
          <span style={{ color: C.text2, fontSize: 14 }}>{user?.email}</span>
          <button
            onClick={() => navigate('/userprofile')}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: C.primaryLight,
              border: `2px solid ${C.primary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: C.primary,
            }}
          >
            <User size={16} />
          </button>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, label, Icon, collapsed }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : 12,
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '10px 0' : '10px 20px',
        margin: '2px 8px',
        borderRadius: 8,
        textDecoration: 'none',
        color: isActive ? '#FFFFFF' : '#94A3B8',
        background: isActive ? 'rgba(79,70,229,0.25)' : 'transparent',
        fontWeight: isActive ? 600 : 400,
        fontSize: 14,
        transition: 'all 0.15s',
        borderLeft: isActive ? `3px solid #4F46E5` : '3px solid transparent',
      })}
      onMouseEnter={e => {
        if (!e.currentTarget.classList.contains('active')) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        }
      }}
      onMouseLeave={e => {
        // Let NavLink handle active styles
      }}
    >
      <Icon size={18} style={{ flexShrink: 0 }} />
      {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
    </NavLink>
  );
}
