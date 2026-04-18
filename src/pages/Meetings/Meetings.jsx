import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, Download, Video, SmilePlus, Frown, Calendar,
  Clock, Tag, ChevronLeft, ChevronRight, X, Users,
} from 'lucide-react';
import { http } from '../../api/client';

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const C = {
  primary:    '#0197cc',
  primaryLight: '#e6f7fd',
  purple:     '#6B3FA0',
  teal:       '#00b4d8',
  tealLight:  '#e0f7fb',
  success:    '#00e15a',
  warning:    '#ffa500',
  bg:         '#f4f5fa',
  surface:    '#FFFFFF',
  border:     '#e4e7ea',
  text:       '#23282c',
  text2:      '#73818f',
  danger:     '#dc3545',
};

const font = "'Source Sans 3', 'Source Sans Pro', sans-serif";

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function getUser() {
  try { return JSON.parse(localStorage.getItem('onup_user')) || {}; }
  catch { return {}; }
}

/**
 * Parse a date string and apply a UTC+0 offset (no shifting).
 * Mirrors: moment(str).utcOffset(0)
 */
function parseUTC(str) {
  if (!str) return null;
  // If already has timezone info, just parse it
  const d = new Date(str);
  if (isNaN(d)) return null;
  return d;
}

function fmtDate(d) {
  if (!d) return '';
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2,'0')}, ${d.getUTCFullYear()}`;
}

function fmtTime(d) {
  if (!d) return '';
  let h = d.getUTCHours(), m = d.getUTCMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2,'0')} ${ampm}`;
}

/* ─── Spinner ───────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
      <Loader2
        size={34}
        color={C.primary}
        style={{ animation:'spin 1s linear infinite' }}
      />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ─── Empty state ───────────────────────────────────────────────────────── */
function Empty() {
  return (
    <div style={{
      textAlign:'center', padding:'56px 24px',
      color:C.text2, fontFamily:font,
    }}>
      <Video size={44} color="#CBD5E1" style={{ marginBottom:12 }} />
      <p style={{ margin:0, fontSize:15 }}>No meetings have been scheduled yet.</p>
    </div>
  );
}

/* ─── ConfirmModal ──────────────────────────────────────────────────────── */
function ConfirmModal({ title, bodyHtml, cancelLabel, confirmLabel, onCancel, onConfirm }) {
  return (
    <div style={{
      position:'fixed', inset:0,
      background:'rgba(0,0,0,0.48)',
      zIndex:2000,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:font,
    }}>
      <div style={{
        background:'#fff', borderRadius:10,
        padding:'28px 32px', width:460,
        boxShadow:'0 12px 40px rgba(0,0,0,0.22)',
      }}>
        <h3 style={{ margin:'0 0 14px', fontSize:17, fontWeight:700, color:C.text }}>{title}</h3>
        <div
          style={{ margin:'0 0 24px', fontSize:14, color:C.text2, lineHeight:1.5 }}
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding:'9px 20px',
              background:'#fff',
              color:C.text,
              border:`1px solid ${C.border}`,
              borderRadius:6,
              cursor:'pointer',
              fontWeight:600,
              fontSize:14,
              fontFamily:font,
            }}
          >{cancelLabel}</button>
          <button
            onClick={onConfirm}
            style={{
              padding:'9px 20px',
              background:C.danger,
              color:'#fff',
              border:'none',
              borderRadius:6,
              cursor:'pointer',
              fontWeight:600,
              fontSize:14,
              fontFamily:font,
            }}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── JoinButton with countdown ─────────────────────────────────────────── */
function JoinButton({ meeting, onJoin }) {
  const { actorId, scheduledGC, scheduledMM, showJoinButton } = meeting;
  const rawDate = actorId === 1 ? scheduledGC : scheduledMM;
  const scheduledDate = parseUTC(rawDate);

  const calcBtnShow = useCallback(() => {
    if (!scheduledDate) return 1;
    const diff = scheduledDate.valueOf() - Date.now() - (showJoinButton || 0);
    return diff <= 0 ? 1 : diff;
  }, [scheduledDate, showJoinButton]);

  const [ms, setMs] = useState(calcBtnShow);
  const enabled = ms <= 1;

  useEffect(() => {
    if (enabled) return;
    const id = setInterval(() => {
      const next = calcBtnShow();
      setMs(next);
      if (next <= 1) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [calcBtnShow, enabled]);

  const fmtCountdown = (msLeft) => {
    const s = Math.floor(msLeft / 1000);
    const days = Math.floor(s / 86400);
    const hrs  = Math.floor((s % 86400) / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (days > 0) return `${days}d ${hrs}h ${mins}m`;
    return `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  };

  return (
    <button
      onClick={enabled ? onJoin : undefined}
      disabled={!enabled}
      title={!enabled ? `Available in ${fmtCountdown(ms)}` : 'Join Now'}
      style={{
        padding:'7px 18px',
        background: enabled ? C.primary : '#a0c4d8',
        color:'#fff',
        border:'none',
        borderRadius:6,
        fontWeight:700,
        fontSize:14,
        fontFamily:font,
        cursor: enabled ? 'pointer' : 'not-allowed',
        whiteSpace:'nowrap',
        transition:'background 0.2s',
      }}
    >
      {enabled ? 'Join Now' : `Join in ${fmtCountdown(ms)}`}
    </button>
  );
}

/* ─── MeetingCard (upcoming) ────────────────────────────────────────────── */
function MeetingCard({ meeting, onCancel, onReschedule }) {
  const navigate = useNavigate();
  const {
    meetingId, growthPlanId, growthPlanName,
    actorId, scheduledGC, scheduledMM, scheduledMinutes,
    title, topic, matchList = [], colorCodeHex,
    mentorFirstName, gpTimeZone, mentorTimeZone,
    meetingType, teamMembers,
  } = meeting;

  const borderColor = actorId === 1
    ? (colorCodeHex ? `#${colorCodeHex.replace(/^#/,'')}` : C.primary)
    : C.teal;

  const rawDate     = actorId === 1 ? scheduledGC : scheduledMM;
  const scheduledDate = parseUTC(rawDate);
  const mdate = scheduledDate ? fmtDate(scheduledDate) : '';
  const mtime = scheduledDate ? fmtTime(scheduledDate) : '';

  // matchList split by scope
  const sharedInterests = (matchList || []).filter(i => i.scope === 'INTEREST' || i.scope === 'Interest');
  const relevantSkills  = (matchList || []).filter(i => i.scope === 'SKILL'    || i.scope === 'Skill');

  // teamMembers for community meetings (meetingType===3)
  const members = teamMembers
    ? teamMembers.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  // ICS download
  const handleDownload = () => {
    if (!scheduledDate) return;
    const dtStart = scheduledDate.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
    const dtEnd   = new Date(scheduledDate.valueOf() + (scheduledMinutes||60)*60000)
      .toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${title || 'Meeting'}`,
      `DESCRIPTION:${topic || ''}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type:'text/calendar' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'meeting.ics'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleJoin = () => {
    if (meetingType === 1) navigate('/meetnow');
    else if (meetingType === 3) navigate('/communityMeetingPage');
    else navigate('/chatsession');
  };

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderLeft: `8px solid ${borderColor}`,
      borderRadius: 10,
      marginBottom: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      overflow:'hidden',
      fontFamily: font,
    }}>
      {/* Card header */}
      <div style={{
        display:'flex',
        flexWrap:'wrap',
        alignItems:'center',
        justifyContent:'space-between',
        gap:12,
        padding:'14px 20px',
        borderBottom:`1px solid ${C.border}`,
        background:'#fafbfc',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, color:C.text, fontWeight:600, fontSize:14 }}>
            <Calendar size={15} color={C.primary} />
            {mdate}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, color:C.text2, fontSize:13 }}>
            <Clock size={14} />
            {mtime}
          </div>
          {scheduledMinutes && (
            <div style={{ fontSize:13, color:C.text2 }}>
              {scheduledMinutes} minute session
            </div>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <button
            onClick={handleDownload}
            style={{
              display:'flex', alignItems:'center', gap:5,
              background:'none', border:'none', cursor:'pointer',
              color:C.primary, fontSize:13, fontWeight:600, fontFamily:font,
              padding:'4px 2px',
            }}
          >
            <Download size={14} /> Download Appointment
          </button>
          <JoinButton meeting={meeting} onJoin={handleJoin} />
          <button
            onClick={() => onCancel(meeting)}
            style={{
              padding:'6px 14px',
              background:'#fff',
              color:C.danger,
              border:`1px solid ${C.danger}`,
              borderRadius:6,
              fontWeight:600,
              fontSize:13,
              fontFamily:font,
              cursor:'pointer',
            }}
          >Cancel</button>
        </div>
      </div>

      {/* Card body */}
      <div style={{ display:'flex', gap:0, flexWrap:'wrap' }}>
        {/* Left col */}
        <div style={{
          flex:'1 1 260px',
          padding:'18px 20px',
          borderRight:`1px solid ${C.border}`,
        }}>
          {growthPlanName && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:C.text2, marginBottom:4, letterSpacing:'0.06em' }}>
                Growth Plan
              </div>
              <a
                href={`/growth-plan/${growthPlanId}`}
                style={{ color:C.primary, fontWeight:700, fontSize:15, textDecoration:'none' }}
              >{growthPlanName}</a>
            </div>
          )}
          {topic && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:C.text2, marginBottom:6, letterSpacing:'0.06em' }}>
                Topic for Conversation
              </div>
              <div style={{ fontSize:14, color:C.text, lineHeight:1.6 }}>{topic}</div>
            </div>
          )}
          {!topic && title && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:C.text2, marginBottom:6, letterSpacing:'0.06em' }}>
                Meeting
              </div>
              <div style={{ fontSize:14, color:C.text, fontWeight:600 }}>{title}</div>
            </div>
          )}
        </div>

        {/* Right col */}
        <div style={{
          flex:'1 1 260px',
          padding:'18px 20px',
        }}>
          {mentorFirstName && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:C.text2, marginBottom:8, letterSpacing:'0.06em' }}>
                About Your Growth Champion
              </div>
              <div style={{ fontWeight:700, fontSize:15, color:C.text, marginBottom:10 }}>
                {mentorFirstName}
              </div>
            </div>
          )}

          {sharedInterests.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:C.text2, marginBottom:6, letterSpacing:'0.06em' }}>
                Shared Interest
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {sharedInterests.map((item, i) => (
                  <span key={i} style={{
                    padding:'3px 10px',
                    background:C.primaryLight,
                    color:C.primary,
                    borderRadius:20,
                    fontSize:12,
                    fontWeight:600,
                  }}>{item.tag}</span>
                ))}
              </div>
            </div>
          )}

          {relevantSkills.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:C.text2, marginBottom:6, letterSpacing:'0.06em' }}>
                Relevant Skills
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {relevantSkills.map((item, i) => (
                  <span key={i} style={{
                    padding:'3px 10px',
                    background:C.tealLight,
                    color:C.teal,
                    borderRadius:20,
                    fontSize:12,
                    fontWeight:600,
                  }}>{item.tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Team members for community meetings */}
          {meetingType === 3 && members.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:C.text2, marginBottom:6, letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:4 }}>
                <Users size={12} /> Team Members
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {members.map((name, i) => (
                  <span key={i} style={{
                    padding:'3px 10px',
                    background:C.tealLight,
                    color:C.teal,
                    borderRadius:20,
                    fontSize:12,
                    fontWeight:600,
                  }}>{name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── PastMeetingCard ───────────────────────────────────────────────────── */
function PastMeetingCard({ meeting, entityId }) {
  const {
    meetingId, title, topic, actorId,
    scheduledGC, scheduledMM, scheduledMinutes,
    growthPlanName, growthPlanId,
    entityMentorId, mentorFirstName,
    gcFeedbakList = [],
  } = meeting;

  // Determine actorId: entityMentorId === entityId → actorId=2, else actorId=1
  const resolvedActorId = entityMentorId === entityId ? 2 : 1;
  const rawDate = resolvedActorId === 1 ? scheduledGC : scheduledMM;
  const scheduledDate = parseUTC(rawDate);
  const mdate = scheduledDate ? fmtDate(scheduledDate) : '';
  const mtime = scheduledDate ? fmtTime(scheduledDate) : '';

  const borderColor = resolvedActorId === 1 ? C.primary : C.teal;

  // Match current user's feedback
  const myFeedback    = gcFeedbakList.find(f => f.feedbackActorId === entityId);
  const otherFeedback = gcFeedbakList.find(f => f.feedbackActorId !== entityId);

  const otherName = mentorFirstName || 'your match';
  const howDidItGo = myFeedback?.howDidItGo;

  return (
    <div style={{
      background:C.surface,
      border:`1px solid ${C.border}`,
      borderLeft:`8px solid ${borderColor}`,
      borderRadius:10,
      marginBottom:16,
      boxShadow:'0 2px 8px rgba(0,0,0,0.05)',
      overflow:'hidden',
      fontFamily:font,
    }}>
      {/* Header */}
      <div style={{
        display:'flex', flexWrap:'wrap', alignItems:'center',
        justifyContent:'space-between', gap:12,
        padding:'14px 20px',
        borderBottom:`1px solid ${C.border}`,
        background:'#fafbfc',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <div style={{ fontWeight:700, fontSize:15, color:C.text }}>{title || 'Meeting'}</div>
          <div style={{ display:'flex', alignItems:'center', gap:6, color:C.text2, fontSize:13 }}>
            <Calendar size={14} color={C.primary} />
            {mdate}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5, color:C.text2, fontSize:13 }}>
            <Clock size={13} /> {mtime}
          </div>
        </div>
        <div style={{ fontSize:13, color:C.text2, fontStyle:'italic' }}>Completed</div>
      </div>

      {/* Body */}
      <div style={{ padding:'18px 20px' }}>
        <div style={{ fontSize:14, color:C.text2, marginBottom:14 }}>
          You met with <span style={{ fontWeight:700, color:C.text }}>{otherName}</span>
        </div>

        {/* How did it go */}
        {howDidItGo && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <span style={{ fontSize:13, fontWeight:600, color:C.text2 }}>How did it go?</span>
            {howDidItGo === 'Good'
              ? <SmilePlus size={22} color={C.success} />
              : <Frown size={22} color={C.danger} />
            }
            <span style={{
              fontSize:13, fontWeight:700,
              color: howDidItGo === 'Good' ? C.success : C.danger,
            }}>{howDidItGo}</span>
          </div>
        )}

        {/* Topics covered */}
        {topic && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:C.text2, marginBottom:5, letterSpacing:'0.06em' }}>
              Topics Covered
            </div>
            <div style={{ fontSize:14, color:C.text, lineHeight:1.6 }}>{topic}</div>
          </div>
        )}

        {/* Meeting feedback */}
        {myFeedback && (
          <div style={{
            background:C.bg,
            border:`1px solid ${C.border}`,
            borderRadius:8,
            padding:'14px 16px',
            marginBottom:12,
          }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:10 }}>Meeting Feedback</div>

            {/* My Notes */}
            {myFeedback.improvementSuggestions && (
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:C.text2, marginBottom:4, letterSpacing:'0.06em' }}>
                  My Notes
                </div>
                <div style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>
                  {myFeedback.improvementSuggestions}
                </div>
              </div>
            )}

            {/* Other person's notes */}
            {otherFeedback?.improvementSuggestions && (
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:C.text2, marginBottom:4, letterSpacing:'0.06em' }}>
                  {otherName}'s Notes
                </div>
                <div style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>
                  {otherFeedback.improvementSuggestions}
                </div>
              </div>
            )}

            {/* Feedback tags */}
            {myFeedback.feedbackTags && myFeedback.feedbackTags.length > 0 && (
              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:C.text2, marginBottom:6, letterSpacing:'0.06em' }}>
                  Feedback Tags
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {(Array.isArray(myFeedback.feedbackTags)
                    ? myFeedback.feedbackTags
                    : myFeedback.feedbackTags.split(',').map(s=>s.trim()).filter(Boolean)
                  ).map((tag, i) => (
                    <span key={i} style={{
                      padding:'3px 10px',
                      background:'#fff4e5',
                      color:C.warning,
                      border:`1px solid ${C.warning}`,
                      borderRadius:20,
                      fontSize:12,
                      fontWeight:600,
                      display:'flex', alignItems:'center', gap:4,
                    }}>
                      <Tag size={10} /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Private/Public Notes */}
        {myFeedback?.privateNotes && (
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:C.text2, marginBottom:4, letterSpacing:'0.06em' }}>
              Private Notes
            </div>
            <div style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>{myFeedback.privateNotes}</div>
          </div>
        )}
        {myFeedback?.publicNotes && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:C.text2, marginBottom:4, letterSpacing:'0.06em' }}>
              Public Notes
            </div>
            <div style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>{myFeedback.publicNotes}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── CalendarView ──────────────────────────────────────────────────────── */
function CalendarView({ entityId }) {
  const [scope, setScope]     = useState('DATE');   // 'DATE' | 'WEEK' | 'MONTH'
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (s) => {
    setLoading(true);
    try {
      const res = await http.post('/getMeetingsCalendar', {
        entityId, startDate: null, bucketScope: s,
      });
      const raw = res.data?.buckets || res.data?.calendar || res.data?.meetings || (Array.isArray(res.data) ? res.data : []);
      setBuckets(Array.isArray(raw) ? raw : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [entityId]);

  useEffect(() => { load(scope); }, [scope, load]);

  const scopeLabels = { DATE:'Day', WEEK:'Week', MONTH:'Month' };

  return (
    <div style={{ fontFamily:font }}>
      {/* Toggle */}
      <div style={{
        display:'flex', gap:0, marginBottom:20,
        border:`1px solid ${C.border}`, borderRadius:7,
        overflow:'hidden', width:'fit-content',
      }}>
        {Object.entries(scopeLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setScope(key)}
            style={{
              padding:'8px 22px',
              border:'none',
              borderRight: key !== 'MONTH' ? `1px solid ${C.border}` : 'none',
              background: scope === key ? C.primary : '#fff',
              color: scope === key ? '#fff' : C.text2,
              fontWeight: scope === key ? 700 : 400,
              fontSize:14,
              fontFamily:font,
              cursor:'pointer',
              transition:'background 0.15s',
            }}
          >{label}</button>
        ))}
      </div>

      {loading && <Spinner />}

      {!loading && buckets.length === 0 && (
        <div style={{ textAlign:'center', padding:'48px 24px', color:C.text2, fontSize:15 }}>
          No meetings found for this {scopeLabels[scope].toLowerCase()}.
        </div>
      )}

      {!loading && buckets.map((bucket, bi) => {
        const meetings = bucket.meetings || bucket.meetingList || [];
        return (
          <div key={bi} style={{ marginBottom:20 }}>
            {/* Date header */}
            <div style={{
              fontWeight:700,
              fontSize:15,
              color:C.text,
              padding:'10px 16px',
              background:C.bg,
              border:`1px solid ${C.border}`,
              borderRadius:'8px 8px 0 0',
              borderBottom:'none',
            }}>
              {bucket.bucketLabel || bucket.date || bucket.dateRange || `Period ${bi+1}`}
            </div>

            <div style={{
              border:`1px solid ${C.border}`,
              borderRadius:'0 0 8px 8px',
              overflow:'hidden',
            }}>
              {meetings.length === 0 && (
                <div style={{ padding:'14px 18px', color:C.text2, fontSize:13 }}>
                  No meetings
                </div>
              )}
              {meetings.map((m, mi) => {
                const rawDate = m.actorId === 1 ? m.scheduledGC : m.scheduledMM;
                const sd = parseUTC(rawDate);
                return (
                  <div
                    key={mi}
                    style={{
                      display:'flex',
                      alignItems:'flex-start',
                      gap:16,
                      padding:'12px 18px',
                      borderBottom: mi < meetings.length - 1 ? `1px solid ${C.border}` : 'none',
                      background:'#fff',
                    }}
                  >
                    <div style={{ width:70, flexShrink:0, fontSize:13, fontWeight:600, color:C.primary }}>
                      {sd ? fmtTime(sd) : '—'}
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:2 }}>
                        {m.title || m.growthPlanName || 'Meeting'}
                      </div>
                      {m.topic && (
                        <div style={{ fontSize:13, color:C.text2 }}>{m.topic}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Tabs ──────────────────────────────────────────────────────────────── */
const TABS = [
  { id:'upcoming', label:'Upcoming' },
  { id:'past',     label:'Past' },
  { id:'calendar', label:'Calendar' },
];

/* ─── Main Meetings page ─────────────────────────────────────────────────── */
export default function Meetings() {
  const user      = getUser();
  const entityId  = user?.entityId;

  const [tab, setTab]                   = useState('upcoming');
  const [upcoming, setUpcoming]         = useState([]);
  const [past, setPast]                 = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [loadingPast, setLoadingPast]   = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(null);   // meeting obj
  const [actionLoading, setActionLoading] = useState(false);

  /* ── Load upcoming ── */
  const fetchUpcoming = useCallback(async () => {
    if (!entityId) return;
    setLoadingUpcoming(true);
    try {
      const res = await http.post('/getMeetings', { action:'PENDING', entityId });
      setUpcoming(res.data?.meeting || res.data?.meetings || res.data?.result || []);
    } catch { /* ignore */ }
    finally { setLoadingUpcoming(false); }
  }, [entityId]);

  /* ── Load past ── */
  const fetchPast = useCallback(async () => {
    if (!entityId) return;
    setLoadingPast(true);
    try {
      const res = await http.post('/getMeetings', { action:'COMPLETE', entityId });
      setPast(res.data?.meeting || res.data?.meetings || res.data?.result || []);
    } catch { /* ignore */ }
    finally { setLoadingPast(false); }
  }, [entityId]);

  useEffect(() => {
    if (tab === 'upcoming') fetchUpcoming();
    if (tab === 'past')     fetchPast();
  }, [tab, fetchUpcoming, fetchPast]);

  /* ── Cancel ── */
  const handleCancelConfirm = async () => {
    if (!confirmCancel) return;
    setActionLoading(true);
    try {
      await http.post('/updateMeeting', {
        action:'CANCEL',
        meeting:{ meetingId: confirmCancel.meetingId, statusId: 5 },
      });
      setConfirmCancel(null);
      fetchUpcoming();
    } catch { /* ignore */ }
    finally { setActionLoading(false); }
  };

  /* ── Reschedule ── (no modal shown per spec, direct API call on a reschedule trigger)
     The spec only mentions a Cancel button on upcoming cards; reschedule not in the
     card UI per spec, so it is wired but not shown as a separate button to keep the
     layout matching Vembu.                                                          */

  const isLoadingTab = tab === 'upcoming' ? loadingUpcoming : tab === 'past' ? loadingPast : false;
  const tabList      = tab === 'upcoming' ? upcoming : tab === 'past' ? past : [];

  return (
    <div style={{
      padding:'28px 28px 60px',
      maxWidth:1100,
      margin:'0 auto',
      background:C.bg,
      minHeight:'100vh',
      fontFamily:font,
      boxSizing:'border-box',
    }}>
      {/* Page header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ margin:0, fontSize:24, fontWeight:700, color:C.text }}>Meetings</h1>
        <p style={{ margin:'4px 0 0', color:C.text2, fontSize:14 }}>
          View and manage your scheduled sessions
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display:'flex', gap:0,
        borderBottom:`2px solid ${C.border}`,
        marginBottom:24,
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding:'10px 24px',
              border:'none',
              background:'transparent',
              cursor:'pointer',
              fontSize:14,
              fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? C.primary : C.text2,
              borderBottom: tab === t.id ? `3px solid ${C.primary}` : '3px solid transparent',
              marginBottom:-2,
              fontFamily:font,
              transition:'color 0.15s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Content */}
      {tab === 'calendar' && (
        <CalendarView entityId={entityId} />
      )}

      {tab !== 'calendar' && (
        <>
          {isLoadingTab && <Spinner />}

          {!isLoadingTab && tabList.length === 0 && <Empty />}

          {!isLoadingTab && tabList.length > 0 && tabList.map((meeting, i) => (
            tab === 'upcoming'
              ? (
                <MeetingCard
                  key={meeting.meetingId || i}
                  meeting={meeting}
                  onCancel={setConfirmCancel}
                  onReschedule={() => {}} /* reschedule not surfaced in Vembu upcoming card */
                />
              )
              : (
                <PastMeetingCard
                  key={meeting.meetingId || i}
                  meeting={meeting}
                  entityId={entityId}
                />
              )
          ))}
        </>
      )}

      {/* Cancel confirmation modal */}
      {confirmCancel && (
        <ConfirmModal
          title="Cancel Meeting"
          bodyHtml="Are you sure you want to cancel this meeting? Canceling this meeting will remove it from your calendar and cannot be undone."
          cancelLabel="Keep this Meeting"
          confirmLabel={actionLoading ? 'Canceling…' : 'Cancel Meeting'}
          onCancel={() => setConfirmCancel(null)}
          onConfirm={handleCancelConfirm}
        />
      )}
    </div>
  );
}
