import { useQuery } from '@tanstack/react-query';
import { Loader2, CalendarDays, Clock, Video, AlertCircle } from 'lucide-react';
import * as api from '../../api/client';
import useAuthStore from '../../store/authStore';

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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getWeekDays() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function MeetingChip({ meeting }) {
  return (
    <div style={{
      background: C.primaryLight,
      borderLeft: `3px solid ${C.primary}`,
      borderRadius: '0 6px 6px 0',
      padding: '6px 10px',
      marginBottom: 4,
      fontSize: 11,
      color: C.primary,
      fontWeight: 600,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}>
      {meeting.meetingTitle || meeting.title || 'Meeting'}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function WorkPlan() {
  const { user } = useAuthStore();
  const entityId = user?.entityId;
  const companyId = user?.companyId;

  const { data: meetings = [], isLoading, isError } = useQuery({
    queryKey: ['meetingsCalendar', entityId, companyId],
    queryFn: () => api.getMeetingsCalendar({ entityId, companyId }),
    select: (res) => res.data?.meetings || res.data?.result || [],
    enabled: !!entityId,
  });

  const weekDays = getWeekDays();
  const today = new Date();

  const getMeetingsForDay = (day) => {
    return meetings.filter(m => {
      const mDate = m.meetingDate ? new Date(m.meetingDate) : null;
      return mDate && isSameDay(mDate, day);
    });
  };

  const upcomingMeetings = meetings
    .filter(m => {
      const mDate = m.meetingDate ? new Date(m.meetingDate) : null;
      return mDate && mDate >= today;
    })
    .sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate))
    .slice(0, 10);

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.text }}>Work Plan</h1>
        <p style={{ margin: '4px 0 0', color: C.text2, fontSize: 14 }}>Your 7-day schedule</p>
      </div>

      {isLoading && <Spinner />}
      {isError && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#EF4444', padding: 16, background: '#FEF2F2', borderRadius: 8, marginBottom: 20 }}>
          <AlertCircle size={16} /> Failed to load calendar data.
        </div>
      )}

      {!isLoading && (
        <>
          {/* Weekly Calendar */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarDays size={18} color={C.primary} />
              <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>This Week</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
              {weekDays.map((day, i) => {
                const isToday = isSameDay(day, today);
                const dayMeetings = getMeetingsForDay(day);
                return (
                  <div
                    key={i}
                    style={{
                      borderRight: i < 6 ? `1px solid ${C.border}` : 'none',
                      minHeight: 120,
                    }}
                  >
                    <div style={{
                      padding: '12px 10px 8px',
                      borderBottom: `1px solid ${C.border}`,
                      textAlign: 'center',
                      background: isToday ? C.primaryLight : 'transparent',
                    }}>
                      <div style={{ fontSize: 11, color: C.text2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {DAYS[day.getDay()]}
                      </div>
                      <div style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: isToday ? C.primary : C.text,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: isToday ? C.primary : 'transparent',
                        color: isToday ? '#fff' : C.text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '4px auto 0',
                        fontSize: 16,
                      }}>
                        {day.getDate()}
                      </div>
                    </div>
                    <div style={{ padding: '8px 6px' }}>
                      {dayMeetings.map((m, j) => <MeetingChip key={j} meeting={m} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Meetings List */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Video size={18} color={C.primary} />
              <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>Upcoming Meetings</span>
            </div>
            {upcomingMeetings.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: C.text2 }}>
                No upcoming meetings scheduled.
              </div>
            ) : (
              upcomingMeetings.map((m, i) => (
                <div key={i} style={{
                  padding: '16px 20px',
                  borderBottom: i < upcomingMeetings.length - 1 ? `1px solid ${C.border}` : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Video size={18} color={C.primary} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>
                        {m.meetingTitle || m.title || 'Meeting'}
                      </div>
                      {m.growthPlanName && (
                        <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{m.growthPlanName}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {m.meetingDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.text2 }}>
                        <Clock size={13} />
                        {new Date(m.meetingDate).toLocaleString()}
                      </div>
                    )}
                    {m.meetingStatus && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.primary, background: C.primaryLight, padding: '3px 8px', borderRadius: 12 }}>
                        {m.meetingStatus}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
