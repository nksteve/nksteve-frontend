import { useState } from 'react';
import { Upload, Server, FolderOpen, Key, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const C = {
  primary: '#0197cc',
  primaryLight: '#e6f7fd',
  success: '#10B981',
  warning: '#F59E0B',
  surface: '#FFFFFF',
  bg: '#F8FAFC',
  border: '#E2E8F0',
  text: '#0F172A',
  text2: '#64748B',
};

const IMPORT_HISTORY = [
  // empty placeholder — history will come from API when configured
];

function FieldRow({ label, icon: Icon, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
          <Icon size={16} color={C.text2} />
        </span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '11px 12px 11px 38px',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
            color: C.text,
          }}
          onFocus={e => e.target.style.borderColor = C.primary}
          onBlur={e => e.target.style.borderColor = C.border}
        />
      </div>
    </div>
  );
}

export default function SftpManagement() {
  const [config, setConfig] = useState({
    host: '',
    port: '22',
    username: '',
    remotePath: '/uploads',
    privateKey: '',
  });
  const [saved, setSaved] = useState(false);

  const setField = (key) => (val) => {
    setConfig(c => ({ ...c, [key]: val }));
    setSaved(false);
  };

  const handleSave = () => {
    // Placeholder — real save would call API
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <Upload size={28} color={C.primary} />
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.text }}>SFTP Management</h1>
          <p style={{ margin: '2px 0 0', color: C.text2, fontSize: 14 }}>Configure secure file transfer settings</p>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '14px 18px', marginBottom: 28, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <AlertTriangle size={18} color={C.warning} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#9A3412' }}>Server-Side Configuration Required</div>
          <div style={{ fontSize: 13, color: '#9A3412', marginTop: 2 }}>
            File upload via SFTP requires server-side configuration. Contact your system administrator to enable this feature.
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Config Panel */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: C.text }}>Connection Settings</h2>
          <FieldRow label="SFTP Host" icon={Server} value={config.host} onChange={setField('host')} placeholder="sftp.example.com" />
          <FieldRow label="Port" icon={Server} value={config.port} onChange={setField('port')} placeholder="22" type="number" />
          <FieldRow label="Username" icon={Key} value={config.username} onChange={setField('username')} placeholder="sftp_user" />
          <FieldRow label="Remote Path" icon={FolderOpen} value={config.remotePath} onChange={setField('remotePath')} placeholder="/uploads/data" />

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Private Key (PEM format)</label>
            <textarea
              value={config.privateKey}
              onChange={e => { setConfig(c => ({ ...c, privateKey: e.target.value })); setSaved(false); }}
              placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;…"
              rows={4}
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>

          <button
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 24px',
              background: saved ? C.success : C.primary,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              transition: 'background 0.15s',
            }}
          >
            {saved ? <><CheckCircle size={16} /> Saved!</> : <><Upload size={16} /> Save Configuration</>}
          </button>
        </div>

        {/* Status Panel */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: C.text }}>Connection Status</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '16px 18px', background: C.bg, borderRadius: 10, marginBottom: 20 }}>
            <XCircle size={20} color="#CBD5E1" />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.text2 }}>Not Connected</div>
              <div style={{ fontSize: 13, color: C.text2, marginTop: 2 }}>Configure settings to establish connection</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Host', value: config.host || '—' },
              { label: 'Port', value: config.port || '22' },
              { label: 'Username', value: config.username || '—' },
              { label: 'Remote Path', value: config.remotePath || '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, color: C.text2 }}>{label}</span>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Import History */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} color={C.primary} />
          <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>Import History</span>
        </div>
        {IMPORT_HISTORY.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: C.text2 }}>
            <Upload size={32} style={{ color: '#CBD5E1', marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 14 }}>No import history. Configure SFTP to begin importing files.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {['File Name', 'Date', 'Status', 'Records'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {IMPORT_HISTORY.map((row, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: C.text }}>{row.fileName}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: C.text2 }}>{row.date}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: row.status === 'Success' ? '#D1FAE5' : '#FEE2E2', color: row.status === 'Success' ? '#065F46' : '#991B1B' }}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: C.text2 }}>{row.records}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
