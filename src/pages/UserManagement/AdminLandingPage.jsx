import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const C = {
  teal: '#0197cc',
  white: '#ffffff',
  bg: '#f4f5fa',
  text: '#23282c',
  text2: '#989898',
};

const btnStyle = {
  display: 'inline-block',
  padding: '10px 24px',
  background: C.teal,
  color: C.white,
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 15,
  fontWeight: 400,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

export default function AdminLandingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const securityToken = Number(user?.securityToken || 3);
  const isSuperAdmin = securityToken === 2;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      minHeight: 'calc(100vh - 133px)',
      background: '#ffffff',
      padding: '40px 24px',
    }}>
      {/* Title */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400, color: C.text2 }}>Admin Landing Page</h2>
      </div>

      {/* Row 1 — Super Admin only */}
      {isSuperAdmin && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 32, marginBottom: 32 }}>
          <Link to="/companymanagement" style={btnStyle}>Company Management</Link>
          <Link to="/templatemanagement" style={btnStyle}>Template Management</Link>
          <Link to="/cronmanagement" style={btnStyle}>Cron Management</Link>
        </div>
      )}

      {/* Row 2 — All admins */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 32, marginBottom: 32 }}>
        <button onClick={() => navigate('/userManagement')} style={btnStyle}>User Management</button>
        <Link to="/training/admin" style={btnStyle}>Wealth</Link>
        {isSuperAdmin && (
          <Link to="/analyticsAdmin" style={btnStyle}>Analytics Admin</Link>
        )}
      </div>

      {/* Row 3 — SFTP (super admin) */}
      {isSuperAdmin && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 32 }}>
          <Link to="/sftpAdmin" style={btnStyle}>SFTP InBound Data</Link>
        </div>
      )}
    </div>
  );
}
