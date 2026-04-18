import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import http from '../../api/client';

/* ─── Design tokens ──────────────────────────────────────────────────────────── */
const C = {
  primary:  '#0197cc',
  purple:   '#6B3FA0',
  success:  '#00e15a',
  warning:  '#ffa500',
  bg:       '#f4f5fa',
  surface:  '#FFFFFF',
  border:   '#e4e7ea',
  text:     '#23282c',
  text2:    '#73818f',
};

/* ─── Auth helpers ───────────────────────────────────────────────────────────── */
function getAuth() {
  try {
    const user = JSON.parse(localStorage.getItem('onup_user')) || {};
    return { entityId: user.entityId, companyId: user.companyId };
  } catch {
    return { entityId: null, companyId: null };
  }
}

/* ─── Spinner ────────────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
      <style>{`@keyframes _spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <Loader2 size={32} color={C.primary} style={{ animation: '_spin 1s linear infinite' }} />
    </div>
  );
}

/* ─── Date helpers (moment-compatible without moment) ───────────────────────── */
function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function fromNow(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff)) return '';
  const secs = Math.floor(diff / 1000);
  if (secs < 45)  return 'a few seconds ago';
  if (secs < 90)  return 'a minute ago';
  const mins = Math.floor(secs / 60);
  if (mins < 45)  return `${mins} minutes ago`;
  if (mins < 90)  return 'an hour ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 22)   return `${hrs} hours ago`;
  if (hrs < 36)   return 'a day ago';
  const days = Math.floor(hrs / 24);
  if (days < 25)  return `${days} days ago`;
  if (days < 45)  return 'a month ago';
  const months = Math.floor(days / 30);
  if (months < 11) return `${months} months ago`;
  if (months < 18) return 'a year ago';
  const years = Math.round(months / 12);
  return `${years} years ago`;
}

/* ─── Date range helper ──────────────────────────────────────────────────────── */
function getDateRange(filter) {
  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  if (filter === 'THISWEEK') {
    const start = new Date(today);
    start.setDate(today.getDate() - 7);
    return { dateStart: fmt(start), dateEnd: fmt(today) };
  }
  if (filter === 'THISMONTH') {
    const start = new Date(today);
    start.setMonth(today.getMonth() - 1);
    return { dateStart: fmt(start), dateEnd: fmt(today) };
  }
  if (filter === 'YEAR') {
    const start = new Date(today);
    start.setFullYear(today.getFullYear() - 1);
    return { dateStart: fmt(start), dateEnd: fmt(today) };
  }
  return { dateStart: null, dateEnd: null };
}

/* ─── Message parsing (Vembu Notification.js getDescription) ────────────────── */
function getDescription(obj) {
  const activity = obj.activity || '';
  let msg = obj.auditMessage || '';
  const planName   = obj.planName   || obj.growthPlanName || obj.name || '';
  const goalName   = obj.goalName   || '';
  const actionName = obj.actionName || '';

  // Build breadcrumb
  const crumbParts = [planName, goalName, actionName].filter(Boolean);
  const breadcrumb = crumbParts.length > 0
    ? `< ${crumbParts.join(' / ')} >`
    : '';

  let description = '';

  switch (activity) {
    case 'ADDNOTES': {
      const parts = msg.split('for');
      description = (parts[0] || msg).trim() + ' on';
      break;
    }
    case 'UNITMEASUREMENT': {
      const lower = msg.toLowerCase();
      if (lower.includes('today')) {
        // extract value
        const match = msg.match(/value of ([^,]+)/i) || msg.match(/value ([^,]+)/i);
        const val = match ? match[1].trim() : '';
        description = `Added the value of ${val} on`;
      } else if (
        lower.includes('end') ||
        lower.includes('actual') ||
        lower.includes('min') ||
        lower.includes('exceed')
      ) {
        // "Updated X to Y on"
        const toMatch = msg.match(/updated (.+?) to (.+)/i);
        if (toMatch) {
          description = `Updated ${toMatch[1].trim()} to ${toMatch[2].trim()} on`;
        } else {
          description = buildDefault(msg);
        }
      } else {
        description = buildDefault(msg);
      }
      break;
    }
    case 'ACTIONPERCENTAGE': {
      const numMatch = msg.match(/(\d+(?:\.\d+)?)/);
      const num = numMatch ? numMatch[1] : '';
      description = `Updated the value to ${num} on`;
      break;
    }
    case 'TOGGLEGOAL': {
      const lower = msg.toLowerCase();
      if (lower.includes('actual')) {
        description = 'Updated the input option to actual on';
      } else if (lower.includes('today')) {
        description = 'Updated the input option to today on';
      } else {
        description = buildDefault(msg);
      }
      break;
    }
    case 'ADDGOAL': {
      // check if file upload
      if (msg.toLowerCase().includes('upload') || msg.toLowerCase().includes('file')) {
        description = 'Uploaded a new file on';
      } else {
        // extract goal name from auditText or message
        const name = obj.auditText || goalName || '';
        description = name
          ? `Added the new goal ${name} to`
          : buildDefault(msg);
      }
      break;
    }
    case 'ADDACTION': {
      // check if user assigned
      if (msg.toLowerCase().includes('assigned') || msg.toLowerCase().includes('user')) {
        const userMatch = msg.match(/assigned(?:\s+this\s+user)?\s+(.+)/i);
        const userName = userMatch ? userMatch[1].trim() : (obj.auditText || '');
        description = `Assigned this User ${userName} to`;
      } else {
        const name = obj.auditText || actionName || '';
        description = name
          ? `Added the new action ${name} to`
          : buildDefault(msg);
      }
      break;
    }
    case 'ADDORREMOVECONTRIBUTOR': {
      const name = obj.auditText || '';
      description = `Added this User ${name} as contributor on`;
      break;
    }
    case 'DELETEGOAL': {
      const name = obj.auditText || goalName || '';
      description = `Deleted this goal < ${name} > from`;
      break;
    }
    case 'DELETEACTION': {
      const name = obj.auditText || actionName || '';
      description = `Deleted this action < ${name} > from`;
      break;
    }
    default: {
      description = buildDefault(msg);
      break;
    }
  }

  return { description, breadcrumb };
}

function buildDefault(msg) {
  if (!msg) return '';
  // Remove leading "You "
  let s = msg.replace(/^You\s+/i, '');
  // Capitalize first char
  s = s.charAt(0).toUpperCase() + s.slice(1);
  // Add " on" at end if not already there
  if (!s.endsWith(' on') && !s.endsWith(' on.')) {
    s = s.replace(/\.*$/, '') + ' on';
  }
  return s;
}

/* ─── Avatar ─────────────────────────────────────────────────────────────────── */
function Avatar({ imageUri, firstName, lastName, size = 36 }) {
  const initials = [firstName, lastName]
    .filter(Boolean)
    .map(n => n.charAt(0).toUpperCase())
    .join('');

  if (imageUri) {
    return (
      <img
        src={imageUri}
        alt={`${firstName || ''} ${lastName || ''}`}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
          border: `2px solid ${C.border}`,
        }}
        onError={e => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: C.primary, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
    }}>
      {initials || '?'}
    </div>
  );
}

/* ─── Graph component (for DECISION / HEADSUP notifications) ────────────────── */
function Graph({ obj }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    http.post('/goalPlanReport', {
      action:      'GETREPORT',
      teamId:      obj.growthPlanId,
      goalTagId:   obj.goalTagId,
      actionTagId: obj.actionTagId,
    })
      .then(res => {
        if (!cancelled) {
          const rows = res.data?.data || res.data?.result || res.data?.report || [];
          setData(rows);
        }
      })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [obj.growthPlanId, obj.goalTagId, obj.actionTagId]);

  const notifDateStr = (obj.createdOn || obj.createdUTC || '').split('T')[0];

  // Custom dot renderer — marks the notification date with activity-specific icon
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    const isMatch = payload && (payload.date || '').startsWith(notifDateStr);

    if (isMatch && obj.activity === 'DECISION') {
      // Red wrench SVG icon
      return (
        <g key={`dot-${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r={10} fill="red" fillOpacity={0.15} />
          <svg x={cx - 7} y={cy - 7} width={14} height={14} viewBox="0 0 24 24" fill="none">
            <path
              d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
              stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </g>
      );
    }

    if (isMatch && obj.activity === 'HEADSUP') {
      // Purple info circle SVG icon
      return (
        <g key={`dot-${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r={10} fill={C.purple} fillOpacity={0.15} />
          <svg x={cx - 7} y={cy - 7} width={14} height={14} viewBox="0 0 24 24" fill="none">
            <circle cx={12} cy={12} r={10} stroke={C.purple} strokeWidth="2" />
            <line x1={12} y1={8} x2={12} y2={8} stroke={C.purple} strokeWidth="2" strokeLinecap="round" />
            <line x1={12} y1={12} x2={12} y2={16} stroke={C.purple} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </g>
      );
    }

    // Default white circle with black stroke
    return (
      <circle
        key={`dot-${cx}-${cy}`}
        cx={cx} cy={cy} r={4}
        fill="#fff"
        stroke="#333"
        strokeWidth={1.5}
      />
    );
  };

  if (loading) {
    return (
      <div style={{ width: 250, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#dfdcff', borderRadius: 8 }}>
        <Loader2 size={18} color={C.purple} style={{ animation: '_spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <div style={{ width: 250, height: 100, background: '#dfdcff', borderRadius: 8, marginTop: 8 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -24 }}>
          <XAxis dataKey="date" hide />
          <YAxis />
          <Tooltip
            contentStyle={{ fontSize: 11, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={C.purple}
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Single Notification row (Vembu Notification.js) ───────────────────────── */
function NotificationRow({ obj, isLast }) {
  const { description, breadcrumb } = getDescription(obj);
  const showGraph = obj.activity === 'DECISION' || obj.activity === 'HEADSUP';
  const timeStr = formatTime(obj.createdOn || obj.createdUTC);
  const agoStr  = fromNow(obj.createdOn || obj.createdUTC);

  return (
    <div style={{
      display: 'flex',
      gap: 12,
      padding: '14px 18px',
      borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
      alignItems: 'flex-start',
    }}>
      {/* Avatar */}
      <Avatar
        imageUri={obj.imageUri}
        firstName={obj.firstName}
        lastName={obj.lastName}
      />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name */}
        <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>
          {[obj.firstName, obj.lastName].filter(Boolean).join(' ')}
        </span>
        {' '}
        {/* Description */}
        <span style={{ fontSize: 13, color: C.text }}>
          {description}
        </span>
        {' '}
        {/* Breadcrumb */}
        {breadcrumb && (
          <span style={{ fontSize: 13, color: C.primary, fontWeight: 600 }}>
            {breadcrumb}
          </span>
        )}

        {/* Time */}
        <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>
          {timeStr && <span>{timeStr}</span>}
          {timeStr && agoStr && <span style={{ margin: '0 6px' }}>·</span>}
          {agoStr && <span>{agoStr}</span>}
        </div>

        {/* Inline graph for DECISION / HEADSUP */}
        {showGraph && <Graph obj={obj} />}
      </div>
    </div>
  );
}

/* ─── Overview Tab (Vembu Overview.js) ──────────────────────────────────────── */
function OverviewTab({ filter, userFilter, onUsersLoaded }) {
  const { entityId, companyId } = getAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(() => {
    if (!entityId) { setLoading(false); return; }
    setLoading(true);
    const { dateStart, dateEnd } = getDateRange(filter);
    http.post('/getNotifications', {
      entityId,
      companyId,
      growthPlanId: null,
      dateStart: null,  // backend uses SP defaults when null
      dateEnd:   null,
      // pass as startDate/endDate which is what backend expects
      startDate: dateStart,
      endDate:   dateEnd,
    })
      .then(res => {
        const rows = res.data?.notifications || res.data?.result || [];
        setNotifications(rows);
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [entityId, companyId, filter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Populate By User dropdown from unique entityIds
  useEffect(() => {
    if (notifications.length > 0 && onUsersLoaded) {
      const seen = new Set();
      const unique = [];
      notifications.forEach(n => {
        if (n.entityId && !seen.has(String(n.entityId))) {
          seen.add(String(n.entityId));
          unique.push(n);
        }
      });
      onUsersLoaded(unique);
    }
  }, [notifications, onUsersLoaded]);

  // Apply user filter
  const displayed = userFilter
    ? notifications.filter(n => String(n.entityId) === String(userFilter))
    : notifications;

  if (loading) return <Spinner />;

  if (displayed.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', color: C.text2, fontSize: 14 }}>
        No Notification Available
      </div>
    );
  }

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
      {displayed.map((n, i) => (
        <NotificationRow
          key={n.entityActivityId || i}
          obj={n}
          isLast={i === displayed.length - 1}
        />
      ))}
    </div>
  );
}

/* ─── Last Login Tab (Vembu LastLogged.js) ───────────────────────────────────── */
function LastLoginTab() {
  const { entityId } = getAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('lastLogin');
  const [sortDir,   setSortDir]   = useState('desc');

  useEffect(() => {
    if (!entityId) { setLoading(false); return; }
    setLoading(true);
    http.post('/getPicklist', { picklistType: 'LAST_LOGGED', entityId })
      .then(res => {
        const rows = res.data?.picklist || res.data?.result || [];
        setUsers(rows);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [entityId]);

  function toggleSort(field) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  const sorted = [...users].sort((a, b) => {
    const av = a[sortField] || '';
    const bv = b[sortField] || '';
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function lastLoginLabel(dateStr) {
    if (!dateStr) return 'Not Logged In';
    return fromNow(dateStr);
  }

  const cols = [
    { key: 'firstname',   label: 'First' },
    { key: 'lastname',    label: 'Last' },
    { key: 'companyName', label: 'Company' },
    { key: 'lastLogin',   label: 'Last Login', fmt: lastLoginLabel },
  ];

  if (loading) return <Spinner />;

  if (sorted.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', color: C.text2, fontSize: 14 }}>
        No Notification Available
      </div>
    );
  }

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: C.bg }}>
            {cols.map(col => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                style={{
                  padding: '10px 16px',
                  textAlign: 'left',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderBottom: `2px solid ${C.border}`,
                  color: sortField === col.key ? C.primary : C.text,
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}
              >
                {col.label}
                {sortField === col.key && (
                  <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((u, i) => (
            <tr
              key={i}
              style={{ background: i % 2 === 0 ? C.surface : C.bg, transition: 'background .1s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e8f4fb'; }}
              onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? C.surface : C.bg; }}
            >
              {cols.map(col => (
                <td key={col.key} style={{ padding: '9px 16px', color: C.text, borderBottom: `1px solid ${C.border}` }}>
                  {col.fmt ? col.fmt(u[col.key]) : (u[col.key] || '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Main Notifications component ──────────────────────────────────────────── */
export default function Notifications() {
  const [tab,        setTab]        = useState('overview'); // 'overview' | 'lastlogin'
  const [dateFilter, setDateFilter] = useState('');         // '' | 'THISWEEK' | 'THISMONTH' | 'YEAR'
  const [userFilter, setUserFilter] = useState('');         // entityId string or ''
  const [userList,   setUserList]   = useState([]);         // populated from Overview notifications

  const tabs = [
    { id: 'overview',  label: 'Overview'   },
    { id: 'lastlogin', label: 'Last Login' },
  ];

  return (
    <div style={{ padding: '24px 28px', background: C.bg, minHeight: '100vh' }}>
      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#000' }}>Notifications</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* By User filter */}
          <label style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>By User:</label>
          <select
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            style={{
              padding: '6px 10px', border: `1px solid ${C.border}`, borderRadius: 5,
              fontSize: 13, outline: 'none', background: C.surface, color: C.text,
              minWidth: 140, cursor: 'pointer',
            }}
          >
            <option value="">All Users</option>
            {userList.map((u, i) => (
              <option key={i} value={String(u.entityId)}>
                {[u.firstName, u.lastName].filter(Boolean).join(' ')}
              </option>
            ))}
          </select>

          {/* By Date filter */}
          <label style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>By Date:</label>
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{
              padding: '6px 10px', border: `1px solid ${C.border}`, borderRadius: 5,
              fontSize: 13, outline: 'none', background: C.surface, color: C.text,
              minWidth: 130, cursor: 'pointer',
            }}
          >
            <option value="">All Time</option>
            <option value="THISWEEK">This Week</option>
            <option value="THISMONTH">This Month</option>
            <option value="YEAR">Year</option>
          </select>
        </div>
      </div>

      {/* ── Pill nav tabs (border bottom style) ─────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: `2px solid ${C.border}`, marginBottom: 20 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 24px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? C.primary : C.text2,
              borderBottom: tab === t.id ? `2px solid ${C.primary}` : '2px solid transparent',
              marginBottom: -2,
              outline: 'none',
              transition: 'color .15s, border-color .15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <OverviewTab
          filter={dateFilter}
          userFilter={userFilter}
          onUsersLoaded={setUserList}
        />
      )}
      {tab === 'lastlogin' && (
        <LastLoginTab />
      )}
    </div>
  );
}
