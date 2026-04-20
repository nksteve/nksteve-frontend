import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ReactSpeedometer from 'react-d3-speedometer';
import SlickSlider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import uploadImg  from '../../assets/upload.png';
import linkImg    from '../../assets/link.png';
import linkImage  from '../../assets/link-image.png';
import wordImage  from '../../assets/word-image.png';
import pdfImage   from '../../assets/pdf-image.png';
import pptImage   from '../../assets/ppt-image.png';
import excelImage from '../../assets/excel-image.png';
import playImage  from '../../assets/play-button.png';
import noImage    from '../../assets/noimage.png';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  RefreshCw, Plus, Loader2, AlertCircle, X,
  BarChart2, ArrowUp, MessageCircle, Users,
} from 'lucide-react';
import { Slider } from '@mui/material';
import { styled } from '@mui/material/styles';
import * as api from '../../api/client';
// simple HTML tag stripper — avoids dompurify dep
const stripHtml = (html) => (html || '').replace(/<[^>]*>/g, '').replace(/^-$/, '').trim();
import useAuthStore from '../../store/authStore';

/* ─── Design tokens ────────────────────────────────────────────────────────── */
const C = {
  teal:    '#0197cc',
  purple:  '#6B3FA0',          // vembu goal row purple
  orange:  '#ffa500',
  green:   '#00e15a',
  bg:      '#f4f5fa',
  white:   '#ffffff',
  border:  '#e4e7ea',
  text:    '#23282c',
  text2:   '#73818f',
};

/* ─── Speedometer — matches vembu: react-d3-speedometer, minValue=-3, maxValue=8, 7 segments ── */
function Speedometer({ percent = 0 }) {
  const p = Math.min(100, Math.max(0, Number(percent) || 0));
  // Map 0-100% to -3..8 scale (same as vembu NIM scale)
  const nimValue = -3 + (p / 100) * 11;
  const barColor = p < 50 ? C.orange : p < 80 ? '#e6a817' : '#0B6623';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1 }}>
      <div style={{ flexShrink: 0, width: 172, height: 120, overflow: 'hidden' }}>
        <ReactSpeedometer
          minValue={-3}
          maxValue={8}
          value={nimValue}
          needleColor="black"
          needleTransitionDuration={2000}
          needleHeightRatio={0.7}
          segments={7}
          segmentColors={[
            '#FE0F0D',
            '#FF4311',
            '#FF7B14',
            '#FCA425',
            '#DCB533',
            '#9EB339',
            '#6CB34B',
          ]}
          width={172}
          height={120}
          textColor="black"
          currentValueText={`${p.toFixed(0)}%`}
          ringWidth={10}
          arcWidth={0.3}
        />
      </div>
      {/* Progress label + bar — fills remaining width */}
      <div style={{ flex: 1, paddingLeft: 14 }}>
        <div style={{ fontSize: 12, color: C.text2, marginBottom: 5, fontWeight: 500 }}>Progress</div>
        <div style={{ background: '#e8e8e8', borderRadius: 4, height: 22, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            width: `${p}%`, height: '100%', borderRadius: 4,
            background: barColor, transition: 'width .4s',
          }} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginTop: 4 }}>
          {Number(percent || 0).toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

/* ─── Header toolbar icons — 17px to match vembu FA icon sizes ───────────────── */
const TOOLBAR_ICONS = [
  { title: 'Notes',   svg: <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2}><rect x={5} y={2} width={14} height={20} rx={2}/><line x1={9} y1={7} x2={15} y2={7}/><line x1={9} y1={11} x2={15} y2={11}/><line x1={9} y1={15} x2={12} y2={15}/></svg> },
  { title: 'Link',    svg: <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
  { title: 'Chart',   svg: <BarChart2 size={17} /> },
  { title: 'Palette', svg: <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2}><circle cx={12} cy={12} r={10}/><circle cx={8} cy={14} r={1} fill="currentColor"/><circle cx={12} cy={8} r={1} fill="currentColor"/><circle cx={16} cy={14} r={1} fill="currentColor"/></svg> },
  { title: 'Print',   svg: <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x={6} y={14} width={12} height={8}/></svg> },
  { title: 'Stack',   svg: <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={3}  width={20} height={4} rx={1}/><rect x={2} y={10} width={20} height={4} rx={1}/><rect x={2} y={17} width={20} height={4} rx={1}/></svg> },
  { title: 'Fire',    svg: <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> },
  { title: 'Users',   svg: <Users size={17} /> },
];

/* ─── Goal progress bar — matches vembu: colored fill + 3 tick marks ────────── */
function GoalProgressBar({ pct, goalMin, goalStretch, goalProgressType, themeColor }) {
  const p   = Math.min(100, Math.max(0, Number(pct) || 0));
  // vembu color logic: goalProgressType===1 means lower-is-better (e.g. cost reduction)
  // progressType===1: >=80 red, 50-79 orange, <50 green
  // progressType!==1: >=80 green, 50-79 blue, <50 orange
  const fill = goalProgressType === 1
    ? (p >= 80 ? '#b7274b' : p >= 50 ? '#ffa500' : '#0B6623')
    : (p >= 80 ? '#0B6623' : p >= 50 ? '#0086c0' : '#ffa500');
  // tick positions
  const minPct     = goalMin     ? Math.min(100, Number(goalMin))     : null;
  const stretchPct = goalStretch ? Math.min(99,  Number(goalStretch)) : null;
  const greenPct   = (goalStretch && goalStretch > 100) ? (100 / goalStretch * 100) : null;

  return (
    <div style={{ flex: 1, position: 'relative', height: 14, background: '#e0e0e0', borderRadius: 3, margin: '0 8px', overflow: 'visible' }}>
      {/* filled portion */}
      <div style={{ width: `${p}%`, height: '100%', background: fill, borderRadius: 3, transition: 'width .4s' }} />
      {/* red tick (min) */}
      {minPct !== null && (
        <span style={{ position: 'absolute', left: `${minPct}%`, top: 0, width: 4, height: '100%', background: 'red', cursor: 'pointer' }} />
      )}
      {/* purple tick (stretch) */}
      {stretchPct !== null && (
        <span style={{ position: 'absolute', left: `${stretchPct}%`, top: 0, width: 4, height: '100%', background: 'purple', cursor: 'pointer', zIndex: 1 }} />
      )}
      {/* green tick (100% mark when stretch>100) */}
      {greenPct !== null && (
        <span style={{ position: 'absolute', left: `${greenPct}%`, top: 0, width: 4, height: '100%', background: 'green', cursor: 'pointer', zIndex: 1 }} />
      )}
    </div>
  );
}

/* ─── Action progress slider — MUI Slider, matches vembu exactly ──────────── */
// Color logic matches vembu: orange <50, #008ECC 50-79, #0B6623 >=80
function sliderColor(pct) {
  if (pct >= 80) return '#0B6623';
  if (pct >= 50) return '#008ECC';
  return '#ffa500';
}

// IMPORTANT: PrettoSlider must be defined OUTSIDE the component render.
// Defining styled() inside a component causes React to unmount/remount on every
// render, which completely breaks drag interaction.
const makeSlider = (color) => styled(Slider)({
  color,
  height: 8,
  padding: '13px 0',
  '& .MuiSlider-thumb': {
    height: 22,
    width: 22,
    backgroundColor: '#fff',
    border: '2px solid currentColor',
    boxShadow: '0 1px 4px rgba(0,0,0,.2)',
    '&:focus,&:hover,&.Mui-active': { boxShadow: '0 0 0 6px rgba(0,0,0,.1)' },
  },
  '& .MuiSlider-track': { height: 8, borderRadius: 4 },
  '& .MuiSlider-rail':  { height: 8, borderRadius: 4, opacity: 0.28 },
  '& .MuiSlider-valueLabel': { fontSize: 11, background: color },
});

// Pre-build the 3 color variants — reused across all sliders, no remounting
const SliderOrange = makeSlider('#ffa500');
const SliderBlue   = makeSlider('#008ECC');
const SliderGreen  = makeSlider('#0B6623');

function ActionSlider({ pct, onCommit }) {
  const p = Math.min(100, Math.max(0, Number(pct) || 0));
  const [localVal, setLocalVal] = useState(p);

  // Sync when the prop changes (e.g. after refetch)
  useEffect(() => {
    setLocalVal(Math.min(100, Math.max(0, Number(pct) || 0)));
  }, [pct]);

  // Pick pre-built slider by color bucket — no recreation on render
  const PrettoSlider = localVal >= 80 ? SliderGreen : localVal >= 50 ? SliderBlue : SliderOrange;

  return (
    <div style={{ flex: 1, padding: '0 8px', display: 'flex', alignItems: 'center' }}>
      <PrettoSlider
        value={localVal}
        valueLabelDisplay="auto"
        onChange={(_, val) => setLocalVal(val)}
        onChangeCommitted={(_, val) => {
          setLocalVal(val);
          onCommit && onCommit(val / 100);
        }}
      />
    </div>
  );
}

/* ─── Checkbox icon (vembu uses a square checkbox style) ───────────────────── */
function Checkbox() {
  return (
    <div style={{ width: 16, height: 16, border: '1.5px solid #adb5bd', borderRadius: 2, flexShrink: 0, background: '#fff' }} />
  );
}

/* ─── Folder-OPEN icon (fa-folder-open exact match — vembu uses this) ────────── */
function FolderIcon({ color = '#adb5bd' }) {
  return (
    <svg viewBox="0 0 576 512" width={16} height={14} fill={color} style={{ flexShrink: 0 }}>
      {/* Font Awesome fa-folder-open path */}
      <path d="M572.694 292.093L500.27 416.248A63.997 63.997 0 0 1 444.989 448H45.025c-18.523 0-30.064-20.093-20.731-36.093l72.424-124.155A64 64 0 0 1 151.998 256H528c18.523 0 30.064 20.093 20.694 36.093zM152 224h328v-48c0-26.51-21.49-48-48-48H272l-64-64H48C21.49 64 0 85.49 0 112v278.046l69.077-118.418C86.214 242.25 117.989 224 152 224z"/>
    </svg>
  );
}

/* ─── Notes icon — fa-sticky-note-o (post-it with folded corner, exact vembu shape) */
function NoteIcon({ color = '#adb5bd', hasNotes = false }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <svg viewBox="0 0 448 512" width={14} height={14} fill={color}>
        {/* Font Awesome fa-sticky-note-o — post-it shape */}
        <path d="M400 0H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V48c0-26.5-21.5-48-48-48zm16 464c0 8.8-7.2 16-16 16H48c-8.8 0-16-7.2-16-16V48c0-8.8 7.2-16 16-16h352c8.8 0 16 7.2 16 16v416zM128 136c0-4.4 3.6-8 8-8h176c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8 8H136c-4.4 0-8-3.6-8-8v-16zm0 64c0-4.4 3.6-8 8-8h176c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8 8H136c-4.4 0-8-3.6-8-8v-16zm0 64c0-4.4 3.6-8 8-8h176c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8 8H136c-4.4 0-8-3.6-8-8v-16z"/>
      </svg>
      {hasNotes && (
        <span style={{
          position: 'absolute', top: -4, left: -4,
          fontSize: 9, fontWeight: 700, color: '#fff',
          background: '#0197cc', borderRadius: 2,
          width: 10, height: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1,
        }}>!</span>
      )}
    </div>
  );
}

/* ─── Decision icon — exact vembu DecisionSvg (scissors/decision shape) ────── */
function DecisionIcon({ color, active }) {
  const fill = active ? '#27b74b' : (color || '#adb5bd');
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path
        d="M9.60494 1.23532C9.46153 1.03804 9.27706 0.874185 9.06423 0.755049C8.85141 0.635914 8.61529 0.564328 8.37214 0.545224C8.12898 0.52612 7.88458 0.559951 7.65576 0.644387C7.42694 0.728823 7.21915 0.861857 7.04669 1.03432L4.44794 3.63307C4.27137 3.80957 4.13617 4.02304 4.05207 4.2581C3.96798 4.49316 3.93709 4.74395 3.96162 4.99239C3.98616 5.24083 4.06551 5.48074 4.19396 5.69481C4.32241 5.90887 4.49676 6.09178 4.70444 6.23032L6.21194 7.23457L1.05719 12.2918C0.874302 12.4641 0.727741 12.6712 0.626143 12.9009C0.524544 13.1307 0.469962 13.3785 0.465614 13.6297C0.461266 13.8808 0.507239 14.1304 0.600824 14.3635C0.694409 14.5966 0.833714 14.8087 1.01053 14.9872C1.18734 15.1656 1.39809 15.3069 1.63035 15.4027C1.86262 15.4984 2.11169 15.5467 2.36291 15.5447C2.61413 15.5427 2.8624 15.4904 3.0931 15.3909C3.3238 15.2915 3.53225 15.1468 3.70619 14.9656L8.86019 9.81157L9.77219 11.2441C9.90778 11.4574 10.0896 11.6376 10.3041 11.7712C10.5187 11.9049 10.7605 11.9886 11.0118 12.0163C11.2631 12.0439 11.5174 12.0148 11.7558 11.931C11.9943 11.8471 12.2109 11.7108 12.3897 11.5321L14.9667 8.95507C15.1392 8.78261 15.2722 8.57482 15.3566 8.346C15.4411 8.11718 15.4749 7.87278 15.4558 7.62962C15.4367 7.38647 15.3651 7.15035 15.246 6.93753C15.1268 6.7247 14.963 6.54023 14.7657 6.39682L11.8497 4.27582C11.8023 4.24067 11.7603 4.19872 11.7252 4.15132L9.60494 1.23532ZM7.84244 1.82932C7.89995 1.77199 7.9692 1.7278 8.04542 1.69977C8.12163 1.67174 8.20302 1.66055 8.28397 1.66696C8.36493 1.67338 8.44353 1.69724 8.51439 1.73692C8.58524 1.7766 8.64667 1.83115 8.69444 1.89682L9.03944 2.37082L5.80094 5.60782L5.32844 5.29282C5.25925 5.24664 5.20118 5.18568 5.15839 5.11435C5.1156 5.04301 5.08916 4.96308 5.08098 4.8803C5.0728 4.79752 5.08309 4.71395 5.11109 4.63562C5.1391 4.5573 5.18413 4.48616 5.24294 4.42732L7.84244 1.82932ZM6.75494 6.24532L9.70919 3.29182L10.8154 4.81282C10.9204 4.95632 11.0444 5.08057 11.1874 5.18557L12.6574 6.25282L9.76844 9.14107L8.97794 7.89832C8.85186 7.70021 8.68582 7.5306 8.49044 7.40032L6.75494 6.24532ZM10.3864 10.1146L13.5777 6.92332L14.1042 7.30582C14.1701 7.35358 14.2249 7.41508 14.2647 7.48607C14.3045 7.55706 14.3285 7.63585 14.3349 7.717C14.3413 7.79814 14.3301 7.87972 14.3019 7.95609C14.2737 8.03246 14.2293 8.1018 14.1717 8.15932L11.5939 10.7363C11.5344 10.7959 11.4623 10.8413 11.3828 10.8693C11.3034 10.8973 11.2187 10.9071 11.135 10.8979C11.0512 10.8888 10.9706 10.8609 10.8991 10.8165C10.8276 10.772 10.767 10.7121 10.7217 10.6411L10.3864 10.1146ZM8.24144 8.83957L2.91044 14.1706C2.84067 14.2445 2.75673 14.3036 2.66362 14.3445C2.57052 14.3853 2.47015 14.4069 2.3685 14.4081C2.26685 14.4093 2.16599 14.3901 2.07195 14.3515C1.9779 14.3129 1.89258 14.2557 1.82108 14.1835C1.74957 14.1112 1.69335 14.0253 1.65574 13.9309C1.61814 13.8364 1.59993 13.7354 1.60221 13.6337C1.60448 13.5321 1.62719 13.432 1.66897 13.3393C1.71076 13.2466 1.77077 13.1633 1.84544 13.0943L7.16744 7.87207L7.86494 8.33707C7.9302 8.38062 7.98564 8.43733 8.02769 8.50357L8.24144 8.83957ZM10.0624 13.2503C9.91325 13.2503 9.77018 13.3096 9.66469 13.4151C9.5592 13.5206 9.49994 13.6636 9.49994 13.8128C9.49994 13.962 9.5592 14.1051 9.66469 14.2106C9.77018 14.3161 9.91325 14.3753 10.0624 14.3753H8.56244C8.41325 14.3753 8.27018 14.4346 8.16469 14.5401C8.0592 14.6456 7.99994 14.7886 7.99994 14.9378C7.99994 15.087 8.0592 15.2301 8.16469 15.3356C8.27018 15.4411 8.41325 15.5003 8.56244 15.5003H14.9374C15.0866 15.5003 15.2297 15.4411 15.3352 15.3356C15.4407 15.2301 15.4999 15.087 15.4999 14.9378C15.4999 14.7886 15.4407 14.6456 15.3352 14.5401C15.2297 14.4346 15.0866 14.3753 14.9374 14.3753H13.4374C13.5866 14.3753 13.7297 14.3161 13.8352 14.2106C13.9407 14.1051 13.9999 13.962 13.9999 13.8128C13.9999 13.6636 13.9407 13.5206 13.8352 13.4151C13.7297 13.3096 13.5866 13.2503 13.4374 13.2503H10.0624Z"
        fill={fill}
      />
    </svg>
  );
}

/* ─── HeadsUp info-circle icon — matches vembu fa fa-info-circle exactly ─────── */
function InfoCircle({ onClick, style = {} }) {
  return (
    <svg
      viewBox="0 0 512 512" width={12} height={12}
      fill="#d50000"
      style={{ cursor: 'pointer', flexShrink: 0, ...style }}
      onClick={onClick}
      title="HeadsUp pending"
    >
      {/* Font Awesome fa-info-circle path */}
      <path d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"/>
    </svg>
  );
}

/* ─── Goal header row — purple band matching vembu ─────────────────────────── */
function GoalRow({ goal, goalActions, onChartClick, onDecisionClick, onNoteClick, onNotePopoverClick, onFileClick }) {
  // Aggregate % from actions (average of actionGoalPercentAchieve)
  const actionPcts = goalActions.map(a => Number(a.actionGoalPercentAchieve || 0));
  const aggPct     = actionPcts.length > 0
    ? actionPcts.reduce((s, v) => s + v, 0) / actionPcts.length
    : Number(goal.goalPercentAchieved || 0);
  const pct = Math.min(100, aggPct);
  const milestoneDate = goal.goalMilestoneDate || goal.milestoneDate;
  const bgcolor = C.purple; // vembu always uses purple for goal rows
  const hasHeadsUp = goal.goalFeedbackStatus != null && goal.goalFeedbackStatus === 0;

  return (
    <tr style={{ background: bgcolor, height: 34 }}>
      {/* Left color stripe */}
      <td style={{ width: 4, background: bgcolor, padding: 0 }} />

      {/* Goal name box with note + folder icons on the RIGHT — matches vembu */}
      <td style={{ padding: '0 4px', width: 277 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          fontSize: 13, fontWeight: 600, color: C.text,
          background: '#fff',
          border: '1px solid rgba(255,255,255,0.5)',
          borderRadius: 3,
          padding: '2px 4px 2px 6px',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <span style={{
            flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {goal.goalName || '—'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, marginLeft: 4 }}>
            <button
              onClick={e => (onNotePopoverClick || onNoteClick)(e)}
              title="Notes / History / Activity Log"
              style={{ background:'none',border:'none',cursor:'pointer',padding:0,position:'relative',display:'flex' }}
            >
              <NoteIcon color={goal.notesCount > 0 ? C.teal : '#adb5bd'} hasNotes={goal.notesCount > 0} />
            </button>
            <button onClick={onFileClick} title="Files" style={{ background:'none',border:'none',cursor:'pointer',padding:0,position:'relative',display:'flex' }}>
              <FolderIcon color={goal.docsCount > 0 ? C.teal : '#adb5bd'} />
              {goal.docsCount > 0 && <span style={{ position:'absolute',top:-4,right:-4,background:C.teal,color:'#fff',borderRadius:'50%',fontSize:8,width:12,height:12,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700 }}>{goal.docsCount}</span>}
            </button>
          </div>
        </div>
      </td>

      {/* Bar chart + decision icons — vembu: no dot here, info-circle goes on the % cell */}
      <td style={{ padding: '0 4px', width: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => onChartClick && onChartClick(goal, goalActions)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.85)', display: 'flex' }}
            title="View Chart"
          >
            <BarChart2 size={14} />
          </button>
          <button
            onClick={() => onDecisionClick && onDecisionClick(goal, goalActions)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.75)', display: 'flex' }}
            title="Decision"
          >
            <DecisionIcon color="rgba(255,255,255,0.75)" />
          </button>
        </div>
      </td>

      {/* Goal progress bar (wide, colored, with ticks) */}
      <td style={{ padding: '0 4px' }}>
        <GoalProgressBar
          pct={pct}
          goalMin={goal.goalMin}
          goalStretch={goal.goalStretch}
          goalProgressType={goal.goalProgressType}
        />
      </td>

      {/* % cell — red+bold+animated + info-circle icon when HeadsUp pending (matches vembu exactly) */}
      <td style={{ padding: '0 6px', width: 60, textAlign: 'right', fontSize: 13, fontWeight: 700, color: hasHeadsUp ? '#d50000' : '#fff', whiteSpace: 'nowrap', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
          <span style={hasHeadsUp ? { fontWeight: 800, animation: 'pulse 1.2s infinite' } : {}}>
            {pct.toFixed(1)}%
          </span>
          {hasHeadsUp && <InfoCircle style={{ position: 'absolute', fontSize: 12, top: '50%', right: 2, transform: 'translateY(-50%)' }} />}
        </div>
      </td>

      {/* Due date */}
      <td style={{ padding: '0 8px', width: 110, textAlign: 'right', fontSize: 12, fontWeight: 600, color: pct > 0 ? '#7DF9BC' : 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>
        {milestoneDate
          ? new Date(milestoneDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
          : ''}
      </td>
    </tr>
  );
}

/* ─── Action sub-row — white background, vembu style ────────────────────────── */
function ActionRow({ action, themeColor, onSliderCommit, onChartClick, onDecisionClick, onNoteClick, onNotePopoverClick, onFileClick, isChild, onPublishToggle, onNameSave }) {
  const pct        = Math.min(100, Number(action.actionGoalPercentAchieve || 0));
  const [localPct, setLocalPct] = useState(pct);
  const [localName, setLocalName] = useState(action.actionName || '');
  const endDate    = action.endDate || action.milestoneDate;
  const planColor  = themeColor || C.teal;
  const hasHeadsUp = action.actionFeedbackStatus != null && action.actionFeedbackStatus === 0;
  // publishToMaster: 0 = no relationship (skip checkbox), non-zero = child plan row (show checkbox)
  // Checkbox only shows when isChild=true AND publishToMaster !== 0
  const showPublish = !!isChild && action.publishToMaster !== 0;

  const handleNameBlur = () => {
    const trimmed = localName.trim();
    if (trimmed && trimmed !== action.actionName) {
      onNameSave && onNameSave(trimmed);
    } else {
      setLocalName(action.actionName || '');
    }
  };

  return (
    <tr style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, height: 32 }}>
      {/* Left color stripe — thin colored border matching plan color */}
      <td style={{ width: 4, background: planColor, padding: 0 }} />

      {/* Action name box with note + folder icons on the RIGHT — matches vembu */}
      <td style={{ padding: '0 4px', width: 277 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: '#fff',
          border: '1px solid #c8ced3',
          borderRadius: 3,
          padding: '2px 4px 2px 6px',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          {/* publishToMaster checkbox — only on child plan action rows where publishToMaster !== 0 */}
          {showPublish && (
            <input
              type="checkbox"
              checked={action.publishToMaster === 1 || action.publishToMaster === 3}
              onChange={() => {}}
              onClick={() => onPublishToggle && onPublishToggle(action)}
              title="Sync to master plan"
              style={{ cursor: 'pointer', marginRight: 5, flexShrink: 0 }}
            />
          )}
          <input
            type="text"
            value={localName}
            onChange={e => setLocalName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            style={{
              fontSize: 12.5, color: C.text,
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              padding: 0, cursor: 'text', minWidth: 0,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, marginLeft: 4 }}>
            <button
              onClick={e => (onNotePopoverClick || onNoteClick)(e)}
              title="Notes / History / Activity Log"
              style={{ background:'none',border:'none',cursor:'pointer',padding:0,position:'relative',display:'flex' }}
            >
              <NoteIcon color={action.notesCount > 0 ? planColor : '#adb5bd'} hasNotes={action.notesCount > 0} />
            </button>
            <button onClick={onFileClick} title="Files" style={{ background:'none',border:'none',cursor:'pointer',padding:0,position:'relative',display:'flex' }}>
              <FolderIcon color={action.docsCount > 0 ? planColor : '#adb5bd'} />
              {action.docsCount > 0 && <span style={{ position:'absolute',top:-4,right:-4,background:planColor,color:'#fff',borderRadius:'50%',fontSize:8,width:12,height:12,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700 }}>{action.docsCount}</span>}
            </button>
          </div>
        </div>
      </td>

      {/* Bar chart + decision icons — vembu: no dot here, info-circle goes on the % cell */}
      <td style={{ padding: '0 4px', width: 64, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={onChartClick}
            title="Chart"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: C.text2, display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => e.currentTarget.style.color = C.teal}
            onMouseLeave={e => e.currentTarget.style.color = C.text2}
          >
            <BarChart2 size={13} />
          </button>
          <button
            onClick={onDecisionClick}
            title="Decision / HeadsUp"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: C.text2, display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => e.currentTarget.style.color = C.purple}
            onMouseLeave={e => e.currentTarget.style.color = C.text2}
          >
            <DecisionIcon color="currentColor" />
          </button>
        </div>
      </td>

      {/* Action slider — MUI, draggable, saves on release */}
      <td style={{ padding: '0 4px' }}>
        <ActionSlider
          pct={localPct}
          onCommit={(dec) => {
            const newPct = Math.round(dec * 100);
            setLocalPct(newPct);
            onSliderCommit && onSliderCommit(dec);
          }}
        />
      </td>

      {/* % cell — red+bold+animated + info-circle icon when HeadsUp pending (matches vembu exactly) */}
      <td style={{ padding: '0 6px', width: 60, textAlign: 'right', fontSize: 12.5, fontWeight: 600, color: hasHeadsUp ? '#d50000' : C.text, whiteSpace: 'nowrap', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
          <span style={hasHeadsUp ? { fontWeight: 800, animation: 'pulse 1.2s infinite' } : {}}>
            {localPct.toFixed(1)}%
          </span>
          {hasHeadsUp && <InfoCircle style={{ position: 'absolute', fontSize: 12, top: '50%', right: 2, transform: 'translateY(-50%)' }} />}
        </div>
      </td>

      {/* Due date — date text if set, FA-style calendar icon if not (matches vembu) */}
      <td style={{ padding: '0 8px', width: 110, textAlign: 'right' }}>
        {endDate
          ? <span style={{ fontSize: 11.5, color: C.teal, fontWeight: 600 }}>
              {new Date(endDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
            </span>
          : <svg viewBox="0 0 448 512" width={13} height={13} fill={C.text2} style={{ display: 'inline-block' }}>
              {/* FA fa-calendar solid */}
              <path d="M148 288h-40c-6.6 0-12-5.4-12-12v-40c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12zm108-12v-40c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12zm96 0v-40c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12zm-96 96v-40c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12zm-96 0v-40c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12zm192 0v-40c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12zm96-260v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V112c0-26.5 21.5-48 48-48h48V12c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v52h128V12c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v52h48c26.5 0 48 21.5 48 48zm-48 346V160H48v298c0 3.3 2.7 6 6 6h340c3.3 0 6-2.7 6-6z"/>
            </svg>
        }
      </td>
    </tr>
  );
}

/* ─── Goal Chart Modal ────────────────────────────────────────────────────────── */
/* ─── Notes Modal ──────────────────────────────────────────────────────────────────── */
function NotesModal({ onClose, growthPlanId, goalTagId, actionTagId, planColor }) {
  const user = useAuthStore(s => s.user);
  const [notes, setNotes]         = useState([]);
  const [text, setText]           = useState('');
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [editId, setEditId]       = useState(null);   // notesId being edited
  const [editText, setEditText]   = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // notesId pending delete
  // filters
  const [filterText, setFilterText]   = useState('');
  const [filterDate, setFilterDate]   = useState('');
  const title = actionTagId ? 'Action Notes' : 'Goal Notes';

  useEffect(() => { fetchNotes(); }, []);

  async function fetchNotes() {
    setLoading(true);
    try {
      const res = await api.updateGoalActionNotes({ action: 'GET', growthPlanId, goalTagId, actionTagId });
      setNotes(res.data.result || []);
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  async function saveNote() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const res = await api.updateGoalActionNotes({
        action: 'ADD', growthPlanId, goalTagId, actionTagId,
        entityId: user?.entityId, notesType: 'public',
        notes: `<p>${text}</p>-`,
      });
      setNotes(res.data.result || []);
      setText('');
    } catch(e) { toast.error('Failed to save note'); }
    setSaving(false);
  }

  async function confirmDelete() {
    const notesId = deleteConfirm;
    setDeleteConfirm(null);
    try {
      await api.updateGoalActionNotes({ action: 'DELETE', growthPlanId, notesId });
      setNotes(prev => prev.filter(n => n.notesId !== notesId));
    } catch(e) { toast.error('Failed to delete note'); }
  }

  async function saveEdit(notesId) {
    if (!editText.trim()) return;
    try {
      const res = await api.updateGoalActionNotes({
        action: 'UPDATE', growthPlanId, goalTagId, actionTagId,
        notesId, notes: `<p>${editText}</p>-`, notesType: 'public',
      });
      setNotes(res.data.result || []);
      setEditId(null); setEditText('');
    } catch(e) { toast.error('Failed to update note'); }
  }

  // client-side filter
  const visibleNotes = notes.filter(n => {
    const matchText = !filterText || stripHtml(n.notes).toLowerCase().includes(filterText.toLowerCase());
    const matchDate = !filterDate || (n.created || '').startsWith(filterDate);
    return matchText && matchDate;
  });

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  // vembu: large modal, blue outer border
  const modal   = { background: '#fff', borderRadius: 8, width: 660, maxHeight: '85vh', display: 'flex', flexDirection: 'column', border: '5px solid #20a8d8', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        {/* Header — matches vembu ModalHeader style */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom:'1px solid #e8e8e8' }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#333' }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#666', lineHeight:1 }}>×</button>
        </div>

        {/* Filter bar — matches vembu search row */}
        <div style={{ display:'flex', gap:8, padding:'10px 16px', borderBottom:'1px solid #e8e8e8', flexWrap:'wrap' }}>
          <input
            type="text" placeholder="Search..."
            value={filterText} onChange={e => setFilterText(e.target.value)}
            style={{ flex:1, minWidth:120, border:'1px solid #c8ced3', borderRadius:4, padding:'5px 9px', fontSize:12 }}
          />
          <input
            type="date"
            value={filterDate} onChange={e => setFilterDate(e.target.value)}
            style={{ border:'1px solid #c8ced3', borderRadius:4, padding:'5px 9px', fontSize:12 }}
          />
          {(filterText || filterDate) && (
            <button onClick={() => { setFilterText(''); setFilterDate(''); }}
              style={{ background:'#6c757d', color:'#fff', border:'none', borderRadius:4, padding:'5px 12px', fontSize:12, cursor:'pointer' }}>Reset</button>
          )}
        </div>

        {/* Add note box */}
        <div style={{ padding:'12px 16px', borderBottom:'1px solid #e8e8e8' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea
              value={text} onChange={e => setText(e.target.value)}
              placeholder="Add a note..."
              rows={3}
              style={{ flex:1, border:'1px solid #c8ced3', borderRadius:4, padding:'6px 10px', fontSize:13, resize:'vertical', fontFamily:'inherit' }}
            />
            <button onClick={saveNote} disabled={saving || !text.trim()}
              style={{ background: planColor || C.teal, color:'#fff', border:'none', borderRadius:4, padding:'0 16px', cursor:'pointer', fontWeight:600, fontSize:13, opacity: saving || !text.trim() ? 0.6 : 1 }}
            >{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>

        {/* Notes list */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading
            ? <div style={{ textAlign:'center', color:C.text2, padding:24 }}>Loading...</div>
            : visibleNotes.length === 0
              ? <div style={{ textAlign:'center', color:C.text2, padding:24, fontSize:13 }}>No Record Found</div>
              : visibleNotes.map(n => (
                <div key={n.notesId} style={{ padding:'12px 20px', borderTop:'1px solid #e8e8e8' }}>
                  {/* name row */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontWeight:700, color:'#20a8d8', fontSize:14 }}>
                      {n.firstName || ''} {n.lastName || ''}
                    </span>
                    {Number(n.entityId) === Number(user?.entityId) && editId !== n.notesId && (
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => { setEditId(n.notesId); setEditText(stripHtml(n.notes)); }}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'#20a8d8', fontSize:13, padding:0 }}>✏ Edit</button>
                        <button onClick={() => setDeleteConfirm(n.notesId)}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'#dc3545', fontSize:13, padding:0 }}>🗑 Delete</button>
                      </div>
                    )}
                    {editId === n.notesId && (
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => saveEdit(n.notesId)}
                          style={{ background:'#28a745', color:'#fff', border:'none', borderRadius:4, padding:'3px 12px', fontSize:12, cursor:'pointer' }}>Save</button>
                        <button onClick={() => { setEditId(null); setEditText(''); }}
                          style={{ background:'#20a8d8', color:'#fff', border:'none', borderRadius:4, padding:'3px 12px', fontSize:12, cursor:'pointer' }}>Cancel</button>
                      </div>
                    )}
                  </div>
                  {/* timestamp */}
                  <p style={{ fontSize:13, color:'#555', margin:'2px 0 6px' }}>
                    {n.created ? new Date(n.created).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' }) : ''}
                  </p>
                  {/* note body */}
                  <div style={{ marginLeft:20 }}>
                    <span style={{ fontWeight:700, color:'#28a745', fontSize:13 }}>Plan Notes</span>
                    {editId === n.notesId
                      ? <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3}
                          style={{ display:'block', width:'100%', marginTop:4, border:'1px solid #c8ced3', borderRadius:4, padding:'5px 8px', fontSize:13, resize:'vertical', fontFamily:'inherit' }} />
                      : <div style={{ fontSize:13, color:'#333', marginTop:2 }}>{stripHtml(n.notes)}</div>
                    }
                  </div>
                </div>
              ))
          }
        </div>
      </div>

      {/* Delete confirmation popup — matches vembu CustomModalPopup */}
      {deleteConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:8, width:420, padding:24, boxShadow:'0 8px 32px rgba(0,0,0,0.25)' }}>
            <p style={{ fontSize:14, color:'#333', marginBottom:20 }}>
              You are about to delete this Note. Deleting the Note cannot be undone. Would you like to continue?
            </p>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ background:'#6c757d', color:'#fff', border:'none', borderRadius:4, padding:'7px 20px', cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={confirmDelete}
                style={{ background:'#20a8d8', color:'#fff', border:'none', borderRadius:4, padding:'7px 20px', cursor:'pointer', fontSize:13, fontWeight:600 }}>Ok</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── FilesModal ─ two tabs: Upload + Attachment (matches vembu GoalFiles) ─── */
function FilesModal({ onClose, growthPlanId, goalTagId, actionTagId, planColor }) {
  const [docs, setDocs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');  // 'upload' | 'attachment'
  const [linkMode, setLinkMode]   = useState(false);
  const [linkUrl, setLinkUrl]     = useState('');
  const [linkName, setLinkName]   = useState('');
  const sliderRef = useRef(null);
  const title  = actionTagId ? 'Action Files' : 'Goal Files';
  const user   = useAuthStore(s => s.user);

  useEffect(() => { fetchDocs(); }, []);

  async function fetchDocs() {
    setLoading(true);
    try {
      const res = await api.updateGoalfile({ action: 'GET', growthPlanId, goalTagId, actionTagId });
      setDocs(res.data.result || []);
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['jpeg','jpg','gif','png','pdf','mp4','mkv','3gp','doc','docx','docm','pptx','xls','xlsx','xlsm'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) { toast.error('File format not supported'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityId', String(user?.entityId || ''));
      formData.append('type', 'Goal');
      const token = localStorage.getItem('onup_token');
      const uploadRes = await fetch('/api/fileUpload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error(await uploadRes.text());
      const { Location } = await uploadRes.json();
      const saveRes = await api.updateGoalfile({
        action: 'ADD', growthPlanId, goalTagId, actionTagId,
        fileName: file.name, fileUrl: Location,
      });
      setDocs(saveRes.data.result || []);
      setActiveTab('attachment');
      toast.success('File uploaded');
    } catch(err) {
      console.error(err);
      toast.error('Upload failed: ' + (err.message || 'unknown error'));
    }
    setUploading(false);
    e.target.value = '';
  }

  async function saveLink() {
    if (!linkUrl.trim() || !linkName.trim()) { toast.error('Please enter both URL and description'); return; }
    setUploading(true);
    try {
      const res = await api.updateGoalfile({
        action: 'ADD', growthPlanId, goalTagId, actionTagId,
        fileName: linkName.trim(), fileUrl: linkUrl.trim(),
      });
      setDocs(res.data.result || []);
      setLinkUrl(''); setLinkName(''); setLinkMode(false);
      setActiveTab('attachment');
    } catch(e) { toast.error('Failed to save link'); }
    setUploading(false);
  }

  async function deleteDoc(documentId) {
    try {
      await api.updateGoalfile({ action: 'DELETE', growthPlanId, documentId });
      setDocs(prev => prev.filter(d => d.documentId !== documentId));
    } catch(e) { toast.error('Failed to delete'); }
  }

  // Matches vembu's thumbnail logic exactly
  function getThumbSrc(fileUrl, fileName) {
    if (!fileName) return noImage;
    const ext = fileName.toLowerCase().split('.').pop();
    if (['jpeg','jpg','gif','png'].includes(ext)) return fileUrl || noImage;
    if (ext === 'pdf') return pdfImage;
    if (['mp4','mkv','3gp'].includes(ext)) return playImage;
    if (['docx','doc','docm'].includes(ext)) return wordImage;
    if (ext === 'pptx') return pptImage;
    if (['xlsx','xls','xlsm'].includes(ext)) return excelImage;
    return linkImage;
  }

  function openDoc(fileUrl, fileName) {
    if (!fileUrl) return;
    const ext = (fileName || '').toLowerCase().split('.').pop();
    if (['docx','doc','docm','pptx'].includes(ext)) {
      window.open(`https://docs.google.com/viewerng/viewer?url=${fileUrl}&embedded=true`);
    } else {
      window.open(fileUrl);
    }
  }

  const slideCount = docs.length === 2 ? 2 : 3;
  const slickSettings = {
    infinite: false, speed: 500,
    slidesToShow: Math.min(slideCount, docs.length || 1),
    slidesToScroll: Math.min(slideCount, docs.length || 1),
  };

  const overlay  = { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' };
  // vembu: white bg, no colored header — uses plain ModalHeader
  const modal    = { background:'#fff', borderRadius:8, width:520, maxHeight:'82vh', display:'flex', flexDirection:'column', boxShadow:'0 8px 32px rgba(0,0,0,0.22)' };

  // vembu tab style: just color change, double bottom border on tab row, no underline on tab itself
  const tabRowStyle = { display:'flex', borderBottom:'3px double #dee2e6', padding:'0 8px' };
  const tabStyle = (active) => ({
    padding:'8px 16px', cursor:'pointer', fontSize:14,
    color: active ? 'blue' : '#333',
    background:'none', border:'none', fontWeight: active ? 600 : 400,
  });

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        {/* Header — plain like vembu ModalHeader (no colored bg) */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'8px 12px', borderBottom:'1px solid #e0e0e0' }}>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#666', lineHeight:1 }}>×</button>
        </div>

        {/* Tabs — double bottom border like vembu */}
        <div style={tabRowStyle}>
          <button style={tabStyle(activeTab==='upload')}   onClick={() => { setActiveTab('upload'); setLinkMode(false); }}>Upload</button>
          <button style={tabStyle(activeTab==='attachment')} onClick={() => setActiveTab('attachment')}>Attachment</button>
        </div>

        {/* Tab content */}
        <div style={{ flex:1, overflowY:'auto' }}>

          {/* ── UPLOAD TAB ── */}
          {activeTab === 'upload' && (
            <div style={{ padding:24 }}>
              {!linkMode ? (
                <div style={{ display:'flex', justifyContent:'center' }}>
                  {/* Upload from computer — real vembu upload.png */}
                  <div className="upload-card" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, width:'50%', cursor:'pointer' }}>
                    <label style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, cursor:'pointer', position:'relative' }}>
                      {uploading
                        ? <i className="fa fa-spinner fa-spin" style={{ fontSize:50 }} />
                        : <img src={uploadImg} alt="upload" style={{ width:60, height:60, cursor:'pointer' }} />
                      }
                      <span style={{ fontSize:13, textAlign:'center', color:'#333' }}>Upload files from your computer</span>
                      <span style={{ fontSize:11, color:'#888', textAlign:'center' }}>(Supports images, pdf, docx, pptx, xlsx)</span>
                      <input type="file" style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%' }}
                        onChange={handleFileChange} disabled={uploading}
                        accept=".jpeg,.jpg,.gif,.png,.pdf,.mp4,.mkv,.3gp,.doc,.docx,.docm,.pptx,.xls,.xlsx,.xlsm" />
                    </label>
                  </div>
                  {/* Share a link — real vembu link.png */}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, width:'50%', cursor:'pointer' }}
                    onClick={() => setLinkMode(true)}>
                    <img src={linkImg} alt="link" style={{ width:60, height:60 }} />
                    <span style={{ fontSize:13, textAlign:'center', color:'#333' }}>For large file share a link here</span>
                  </div>
                </div>
              ) : (
                /* Link form — matches vembu exactly */
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <label style={{ width:90, fontSize:13, fontWeight:600, color:'#333' }}>URL:</label>
                    <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                      style={{ flex:1, border:'1px solid #0197cc', borderRadius:4, padding:'6px 10px', fontSize:13 }} />
                  </div>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                    <label style={{ width:90, fontSize:13, fontWeight:600, color:'#333', paddingTop:6 }}>Description:</label>
                    <textarea value={linkName} onChange={e => setLinkName(e.target.value)} rows={3}
                      style={{ flex:1, border:'1px solid #0197cc', borderRadius:4, padding:'6px 10px', fontSize:13, resize:'vertical' }} />
                  </div>
                  <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <button onClick={() => setLinkMode(false)}
                      style={{ background:'none', border:'none', color:'#20a8d8', cursor:'pointer', fontSize:13, fontWeight:600 }}>Back</button>
                    <button onClick={saveLink} disabled={uploading}
                      style={{ background:'#20a8d8', color:'#fff', border:'none', borderRadius:4, padding:'6px 18px', cursor:'pointer', fontWeight:600, fontSize:13 }}>
                      {uploading ? <i className="fa fa-spinner fa-spin" style={{ fontSize:10 }} /> : 'Share Link'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ATTACHMENT TAB ── — slick carousel like vembu */}
          {activeTab === 'attachment' && (
            <div style={{ width:473, padding:'12px 8px', position:'relative' }}>
              {loading ? (
                <div style={{ textAlign:'center', color:C.text2, padding:32, fontSize:13 }}>Loading...</div>
              ) : docs.length === 0 ? (
                <div style={{ textAlign:'center', color:C.text2, padding:32, fontSize:13 }}>No attachments yet.</div>
              ) : (
                <>
                  <SlickSlider {...slickSettings} ref={sliderRef}>
                    {docs.map((d, i) => (
                      <div key={d.documentId} style={{ height:120 }}
                        className="d-flex flex-column align-items-center justify-content-center doc-popup-img position-relative">
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:120, position:'relative' }}>
                          <img
                            src={getThumbSrc(d.fileUrl, d.fileName)}
                            alt={d.fileName}
                            onClick={() => openDoc(d.fileUrl, d.fileName)}
                            style={{ width:80, height:80, objectFit:'contain', cursor:'pointer' }}
                          />
                          <button onClick={() => deleteDoc(d.documentId)}
                            style={{ position:'absolute', top:0, right:8, background:'none', border:'none', cursor:'pointer', color:'#333', fontSize:13, lineHeight:1 }}>×</button>
                          <p style={{ fontSize:12, textAlign:'center', marginTop:4, maxWidth:110, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#333' }}>
                            {d.fileName || d.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </SlickSlider>
                  {docs.length > 3 && (
                    <div style={{ display:'flex', justifyContent:'space-between', position:'absolute', top:'35%', left:0, right:0, pointerEvents:'none' }}>
                      <button onClick={() => sliderRef.current?.slickPrev()}
                        style={{ pointerEvents:'all', background:'none', border:'none', cursor:'pointer', fontSize:18, padding:4 }}>←</button>
                      <button onClick={() => sliderRef.current?.slickNext()}
                        style={{ pointerEvents:'all', background:'none', border:'none', cursor:'pointer', fontSize:18, padding:4 }}>→</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MODAL_TABS = [
  { id: 'chart',    Icon: BarChart2,      label: 'Chart' },
  { id: 'decision', Icon: DecisionIcon,   label: 'Decision' },
  { id: 'headsup',  Icon: MessageCircle,  label: 'HeadsUp' },
];

// ─── Decision Tab ────────────────────────────────────────────────────────────
function DecisionTab({ goal, growthPlanId, entityId }) {
  const [list, setList]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [adding, setAdding]       = useState(false);
  const [text, setText]           = useState('');
  const [date, setDate]           = useState(new Date().toISOString().slice(0,10));
  const [saving, setSaving]       = useState(false);
  const [editId, setEditId]       = useState(null);
  const [editText, setEditText]   = useState('');
  const [deleteId, setDeleteId]   = useState(null);

  const goalTagId    = goal.goalTagId || goal.goalId || null;

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.decisionMaking({ action: 'GET', growthPlanId, teamId: growthPlanId, goalTagId, actionTagId: null, endPointId: null });
      setList(res?.data?.results?.result || []);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    await api.decisionMaking({ action: 'INSERT', growthPlanId, teamId: growthPlanId, goalTagId, actionTagId: null, endPointId: null, entityId, decision: text, decisionDate: date });
    setText(''); setDate(new Date().toISOString().slice(0,10)); setAdding(false);
    await load();
    setSaving(false);
  };

  const update = async (id) => {
    if (!editText.trim()) return;
    setSaving(true);
    await api.decisionMaking({ action: 'UPDATE', decisionId: id, entityId, decision: editText });
    setEditId(null); setEditText('');
    await load();
    setSaving(false);
  };

  const remove = async (id) => {
    await api.decisionMaking({ action: 'DELETE', decisionId: id, entityId });
    setDeleteId(null);
    await load();
  };

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Decision ({goal.goalName})</div>
        {!adding && (
          <button onClick={() => setAdding(true)}
            style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            + Add Decision
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ background: '#EEF4FF', border: '1px solid #d0dcf8', borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ border: '1px solid #ccc', borderRadius: 4, padding: '4px 8px', fontSize: 13 }} />
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={() => { setAdding(false); setText(''); }}
                style={{ background: '#fff', color: '#27ae60', border: '1px solid #27ae60', borderRadius: 4, padding: '4px 14px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={save} disabled={saving || !text.trim()}
                style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 14px', cursor: 'pointer', fontSize: 13 }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write your decision here..."
            style={{ width: '100%', minHeight: 80, padding: 8, border: '1px solid #ccc', borderRadius: 4, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 30, color: C.teal, fontSize: 14 }}>Loading...</div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 30, color: C.text2, fontSize: 14 }}>
          <DecisionIcon color={C.teal} />
          <div style={{ marginTop: 10 }}>No Decision</div>
        </div>
      ) : list.map(d => (
        <div key={d.id} style={{ background: '#f8f9ff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, marginBottom: 10 }}>
          {editId === d.id ? (
            <div>
              <textarea value={editText} onChange={e => setEditText(e.target.value)}
                style={{ width: '100%', minHeight: 70, padding: 8, border: '1px solid #ccc', borderRadius: 4, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setEditId(null); setEditText(''); }}
                  style={{ background: '#fff', color: '#27ae60', border: '1px solid #27ae60', borderRadius: 4, padding: '3px 12px', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                <button onClick={() => update(d.id)} disabled={saving}
                  style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 12px', cursor: 'pointer', fontSize: 12 }}>Save</button>
              </div>
            </div>
          ) : deleteId === d.id ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 10, fontSize: 13 }}>Delete this decision?</div>
              <button onClick={() => remove(d.id)}
                style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 14px', cursor: 'pointer', marginRight: 8, fontSize: 13 }}>Delete</button>
              <button onClick={() => setDeleteId(null)}
                style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 4, padding: '4px 14px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{d.firstName} {d.lastName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: C.text2 }}>{d.decisionDate ? new Date(d.decisionDate).toLocaleDateString() : ''}</span>
                  <svg onClick={() => { setEditId(d.id); setEditText(d.decisions || ''); }} style={{ cursor: 'pointer', color: C.teal }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  <svg onClick={() => setDeleteId(d.id)} style={{ cursor: 'pointer' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: d.decisions || '' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── HeadsUp Tab ─────────────────────────────────────────────────────────────────────── */
function HeadsUpTab({ goal, growthPlanId, entityId, onRefresh }) {
  const goalTagId  = goal?.goalTagId || goal?.goalId || null;
  // Plan-level: HeadsUp is per-plan, not per-action in this modal context
  // Use existing feedback fields from goal object if available
  const [text,    setText]    = useState(goal?.actionFeedback || goal?.goalFeedback || '');
  const [saving,  setSaving]  = useState(false);
  const [status,  setStatus]  = useState(
    goal?.actionFeedbackStatus != null ? goal.actionFeedbackStatus
    : goal?.goalFeedbackStatus  != null ? goal.goalFeedbackStatus
    : null
  );
  const firstName  = goal?.actionFeedbackFirstName  || goal?.goalFeedbackFirstName  || '';
  const lastName   = goal?.actionFeedbackLastName   || goal?.goalFeedbackLastName   || '';
  const lastDate   = goal?.actionFeedbackLastUpdatedDate || goal?.goalFeedbackLastUpdatedDate || null;

  const handleSave = async () => {
    if (!text.trim()) { toast.warning('Enter your comment'); return; }
    setSaving(true);
    try {
      // Vembu: UPDATE action does NOT send actionFeedbackStatus — SP sets it to 0 automatically
      await api.updateActionFeedback({
        action: 'UPDATE',
        teamId: String(growthPlanId),
        goalTagId,
        actionTagId: null,
        actionFeedback: text,
        entityId,
      });
      toast.success('HeadsUp saved');
      setStatus(0);
      onRefresh && onRefresh();
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleThumb = async () => {
    setSaving(true);
    try {
      const newStatus = status === 1 ? 0 : 1;
      await api.updateActionFeedback({
        action: 'UPDATESTATUS',
        teamId: String(growthPlanId),
        goalTagId,
        actionTagId: null,
        actionFeedback: null,
        entityId,
        actionFeedbackStatus: newStatus,
      });
      setStatus(newStatus);
      onRefresh && onRefresh();
    } catch (e) {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#752b8d', marginBottom: 12 }}>HeadsUP</div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Maximum 120 characters"
        maxLength={120}
        style={{
          width: '100%', padding: 10, border: `1px solid ${C.border}`,
          borderRadius: 4, fontSize: 13, resize: 'vertical',
          minHeight: 80, boxSizing: 'border-box', outline: 'none',
        }}
      />
      {/* Last editor name + date */}
      <div style={{ marginTop: 8, fontSize: 13, color: C.text }}>
        {firstName && (
          <span style={{ fontWeight: 700 }}>{firstName} {lastName}</span>
        )}
        {lastDate && (
          <span style={{ marginLeft: 16, fontWeight: 700 }}>
            {new Date(lastDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
          </span>
        )}
      </div>
      {/* Thumb (when status=0) OR Save button (when status !== 0) — matches Vembu */}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, position: 'relative', minHeight: 36 }}>
        {status === 0 && (
          <button
            onClick={handleThumb}
            disabled={saving}
            title="Acknowledge HeadsUp"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, position: 'absolute', left: 220 }}
          >
            {/* fa-thumbs-up SVG */}
            <svg viewBox="0 0 512 512" width={28} height={28} fill="#28a745">
              <path d="M104 224H24c-13.3 0-24 10.7-24 24v240c0 13.3 10.7 24 24 24h80c13.3 0 24-10.7 24-24V248c0-13.3-10.7-24-24-24zM64 472c-13.3 0-24-10.7-24-24s10.7-24 24-24 24 10.7 24 24-10.7 24-24 24zM384 81.5c0 42.4-26 66.2-33.3 94.5H464c26.5 0 48 21.5 48 48 0 18.5-10.5 34.6-26.1 43 15.1 8.8 25.1 25.6 24.1 44.6-1.7 27.5-23.9 49.4-51.4 49.4H448c1.5 6.3 2.2 12.8 2.2 19.4 0 23.4-10.7 45.8-29.1 60.9-16.6 13.6-37.3 19.4-58.6 17.2H192V112c0-1.8.5-3.5 1.4-5l80.7-80.7C292.5 7.4 322.1 0 343.6 0 365.3 0 384 16.5 384 36.1v45.4z"/>
            </svg>
          </button>
        )}
        {status !== 0 && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '6px 18px', background: '#752b8d', color: '#fff',
              border: 'none', borderRadius: 4, cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>
    </div>
  );
}

function GoalChartModal({ goal, goalActions, onClose, initialTab = 'chart', growthPlanId, entityId }) {
  const [modalTab, setModalTab] = useState(initialTab);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ background: '#fff', borderRadius: 8, width: 860, maxWidth: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,.25)' }}>
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{goal.goalName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {MODAL_TABS.map(({ id, Icon, label }) => (
                <button key={id} onClick={() => setModalTab(id)}
                  title={label}
                  style={{
                    background: modalTab === id ? '#e6f7fd' : 'none',
                    border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 4,
                    color: modalTab === id ? C.teal : C.text2, display: 'flex',
                  }}
                >
                  {id === 'decision' ? <DecisionIcon color={modalTab === id ? C.teal : C.text2} /> : <Icon size={15} />}
                </button>
              ))}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text2, display: 'flex' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>
          {modalTab === 'chart' && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: C.text }}>Goal Progress</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.text2 }}>Overall:</span>
                  <div style={{ flex: 1, background: '#e8e8e8', borderRadius: 3, height: 10, position: 'relative', overflow: 'hidden' }}>
                    {(() => {
                      const actionPcts = goalActions.map(a => Number(a.actionGoalPercentAchieve || 0));
                      const agg = actionPcts.length > 0 ? actionPcts.reduce((s,v)=>s+v,0)/actionPcts.length : 0;
                      const fill = agg < 50 ? C.orange : agg < 80 ? '#008ECC' : '#0B6623';
                      return <div style={{ width: `${Math.min(100,agg)}%`, height: '100%', background: fill, borderRadius: 3 }} />;
                    })()}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text, minWidth: 44 }}>
                    {(goalActions.length > 0
                      ? goalActions.reduce((s,a)=>s+Number(a.actionGoalPercentAchieve||0),0)/goalActions.length
                      : 0).toFixed(1)}%
                  </span>
                </div>
              </div>
              {/* Actions list */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 12, color: C.text2, fontWeight: 600 }}>Action</th>
                    <th style={{ textAlign: 'center', padding: '6px 10px', fontSize: 12, color: C.text2, fontWeight: 600, width: 200 }}>Progress</th>
                    <th style={{ textAlign: 'right', padding: '6px 10px', fontSize: 12, color: C.text2, fontWeight: 600, width: 60 }}>%</th>
                    <th style={{ textAlign: 'right', padding: '6px 10px', fontSize: 12, color: C.text2, fontWeight: 600, width: 100 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {goalActions.length === 0 && (
                    <tr><td colSpan={3} style={{ padding: 16, textAlign: 'center', color: C.text2, fontSize: 13 }}>No actions yet.</td></tr>
                  )}
                  {goalActions.map((a, i) => {
                    const p = Math.min(100, Number(a.actionGoalPercentAchieve || 0));
                    const fill = p >= 80 ? '#0B6623' : p >= 50 ? '#008ECC' : C.orange;
                    return (
                      <tr key={a.actionId || i} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td style={{ padding: '7px 10px', fontSize: 13, color: C.text }}>{a.actionName}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <div style={{ background: '#e8e8e8', borderRadius: 3, height: 8, overflow: 'hidden' }}>
                            <div style={{ width: `${p}%`, height: '100%', background: fill, borderRadius: 3 }} />
                          </div>
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: C.text }}>{p.toFixed(1)}%</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                          <span style={{ background: '#e6f7fd', color: C.teal, fontSize: 11, padding: '1px 7px', borderRadius: 10, fontWeight: 600 }}>
                            {a.actionStatus || 'Open'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {modalTab === 'decision' && (
            <DecisionTab goal={goal} growthPlanId={growthPlanId} entityId={entityId} />
          )}
          {modalTab === 'headsup' && (
            <HeadsUpTab goal={goal} growthPlanId={growthPlanId} entityId={entityId} onRefresh={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Add Goal Modal ─────────────────────────────────────────────────────────── */
function AddGoalModal({ onClose, onAdd, isPending }) {
  const [form, setForm] = useState({ goalName: '', category: '', targetValue: '', endDate: '' });
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 26, width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Add Goal</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={17} /></button>
        </div>
        {[
          { key: 'goalName',    label: 'Goal Name *', type: 'text',   placeholder: 'e.g. Improve public speaking' },
          { key: 'category',   label: 'Category',    type: 'text',   placeholder: 'e.g. Leadership' },
          { key: 'targetValue',label: 'Target Value',type: 'number', placeholder: '100' },
          { key: 'endDate',    label: 'End Date',    type: 'date' },
        ].map(({ key, label, type, placeholder }) => (
          <div key={key} style={{ marginBottom: 13 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#374151' }}>{label}</label>
            <input type={type} value={form[key]} placeholder={placeholder}
              onChange={e => setForm(g => ({ ...g, [key]: e.target.value }))}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = C.teal}
              onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 9, background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Cancel</button>
          <button onClick={() => onAdd(form)} disabled={isPending || !form.goalName}
            style={{ flex: 1, padding: 9, background: C.purple, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#fff', opacity: isPending ? 0.7 : 1 }}
          >
            {isPending ? 'Adding…' : 'Add Goal'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <Loader2 size={26} color={C.teal} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ─── Main WorkPlan ──────────────────────────────────────────────────────────── */
export default function WorkPlan() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { user }       = useAuthStore();
  const entityId       = user?.entityId;
  const companyId      = user?.companyId;
  const queryClient    = useQueryClient();

  const planId = searchParams.get('planId');
  const [showGoalModal,    setShowGoalModal]    = useState(false);
  const [chartGoal,        setChartGoal]        = useState(null); // { goal, goalActions }
  const [notesCtx,         setNotesCtx]         = useState(null); // { growthPlanId, goalTagId, actionTagId, planColor }
  const [notePopover,      setNotePopover]      = useState(null); // { x, y, growthPlanId, goalTagId, actionTagId, title, planColor, isAction }
  const [historyCtx,       setHistoryCtx]       = useState(null); // { growthPlanId, goalTagId, actionTagId, title, planColor }
  const [activityCtx,      setActivityCtx]      = useState(null); // { growthPlanId, goalTagId, actionTagId, title }
  const [filesCtx,         setFilesCtx]         = useState(null); // { growthPlanId, goalTagId, actionTagId, planColor }
  const [refreshKey,       setRefreshKey]       = useState(0);
  const [hideComplete,     setHideComplete]     = useState(false);
  const [sortBy,           setSortBy]           = useState(''); // '' | 'Goal' | 'DueDate' | 'Status'
  const [filterOpen,       setFilterOpen]       = useState(false);
  // Toolbar modal states
  const [showPlanNotes,    setShowPlanNotes]    = useState(false);  // Notes toolbar btn
  const [showLinkModal,    setShowLinkModal]    = useState(false);  // Link btn
  const [showPickerModal,  setShowPickerModal]  = useState(false);  // Palette/color picker
  const [showContribModal, setShowContribModal] = useState(false);  // Users/contributors
  const [showRateModal,    setShowRateModal]    = useState(false);  // Rate Meeting
  const [showBarReport,    setShowBarReport]    = useState(false);  // Chart (bar) btn
  const [showStackReport,  setShowStackReport]  = useState(false);  // Stack btn
  const [showFireReport,   setShowFireReport]   = useState(false);  // Fire/trending btn

  /* ── queries ── */
  const plansQuery = useQuery({
    queryKey: ['myPlans', entityId, companyId],
    queryFn:  () => api.getGrowthPlanDetails({ action: 'MyAssignedGoals', entityId, companyId }),
    select:   r  => { const d = r.data || {}; return d.plans || d.growthPlan || []; },
    enabled:  !!entityId && !planId,
  });

  const planQuery = useQuery({
    queryKey:       ['planDetail', planId, entityId, refreshKey],
    queryFn:        () => api.getGrowthPlanDetails({ action: 'GetPlanDetail', growthPlanId: planId, entityId, companyId }),
    select:         r  => r.data,
    enabled:        !!planId && !!entityId,
    staleTime:      0,
    refetchOnMount: true,
  });

  /* ── mutations ── */
  const addGoalMutation = useMutation({
    mutationFn: (form) => api.goalActionCreate({
      entityId,
      companyId,
      growthPlanId: Number(planId),
      goalName: form.goalName,
      categoryId: null,   // category lookup not needed for basic add
      teamId: String(planId), // childPlanId = growthPlanId for owned plans
    }),
    onSuccess: () => {
      toast.success('Goal added!');
      queryClient.invalidateQueries(['planDetail', planId]);
      setShowGoalModal(false);
    },
    onError: () => toast.error('Failed to add goal'),
  });

  const doRefresh = () => {
    setRefreshKey(k => k + 1);
    queryClient.invalidateQueries(['planDetail', planId]);
  };

  /* ── Mark Complete / Restore mutation ── */
  const markCompleteMutation = useMutation({
    mutationFn: (newStatusId) => api.updateGrowthPlan({
      action: 'UpdateGrowthPlan',
      entityId,
      companyId,
      growthPlanId: Number(planId),
      statusId: newStatusId,
    }),
    onSuccess: () => {
      toast.success('Plan updated');
      queryClient.invalidateQueries(['planDetail', planId]);
    },
    onError: () => toast.error('Failed to update plan'),
  });

  /* ── Create Template mutation ── */
  const createTemplateMutation = useMutation({
    mutationFn: () => api.moveTemplates({
      action: 'FROMGROWTHPLAN',
      growthPlanId: Number(planId),
      entityId,
      companyId,
    }),
    onSuccess: () => toast.success('Template created'),
    onError:   () => toast.error('Failed to create template'),
  });

  /* ── No planId: plan selector ── */
  if (!planId) {
    return (
      <div style={{ padding: '24px 32px', background: C.bg, minHeight: '100vh' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>Work Plan</h2>
        <p style={{ color: C.text2, marginBottom: 24, fontSize: 14 }}>Select a plan to view details</p>
        {plansQuery.isLoading && <Spinner />}
        {(plansQuery.data || []).map((plan, i) => {
          const id  = plan.growthPlanId || plan.planId;
          const pct = Number(plan.growthPlanPercentAchieved || 0);
          return (
            <div key={id || i} onClick={() => navigate(`/work-plan?planId=${id}`)}
              style={{ background: C.white, borderRadius: 8, padding: '14px 20px', marginBottom: 10, cursor: 'pointer', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 16 }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{plan.name || plan.growthPlanName}</div>
                {plan.ownerName && <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>Owner: {plan.ownerName}</div>}
              </div>
              <div style={{ flex: '0 0 200px' }}>
                <div style={{ background: '#e4e7ea', borderRadius: 4, height: 6 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: C.teal, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>{pct.toFixed(1)}%</div>
              </div>
            </div>
          );
        })}
        {!plansQuery.isLoading && (plansQuery.data || []).length === 0 && (
          <div style={{ color: C.text2, fontSize: 14 }}>No plans available.</div>
        )}
      </div>
    );
  }

  /* ── Parse plan data ── */
  const rawData    = planQuery.data || {};
  const plan       = Array.isArray(rawData.growthPlan) ? (rawData.growthPlan[0] || {}) : (rawData.growthPlan || {});
  const rawGoals   = rawData.goals   || [];
  const actions    = rawData.actions || [];
  // isChild: true when viewing a child/nested plan (growthPlanId !== childPlanId)
  // Vembu: isChild = String(growthPlanId) !== childPlanId
  // For simplicity: a plan is a child if ownerEntityId !== entityId
  const isChild = plan.ownerEntityId && plan.ownerEntityId !== entityId;
  // Apply sort based on filter selection
  const goals = sortBy === 'Goal'
    ? [...rawGoals].sort((a, b) => (a.goalName || '').localeCompare(b.goalName || ''))
    : sortBy === 'DueDate'
    ? [...rawGoals].sort((a, b) => new Date(a.milestoneDate||0) - new Date(b.milestoneDate||0))
    : sortBy === 'Status'
    ? [...rawGoals].sort((a, b) => (a.goalStatus||'').localeCompare(b.goalStatus||''))
    : rawGoals;
  const percent    = Number(plan.growthPlanPercentAchieved || 0);
  const themeColor = plan.colorCodeHex
    ? (plan.colorCodeHex.startsWith('#') ? plan.colorCodeHex : `#${plan.colorCodeHex}`)
    : C.teal;

  if (planQuery.isLoading) return <div style={{ padding: 32 }}><Spinner /></div>;
  if (planQuery.isError)   return (
    <div style={{ padding: 32, color: '#ef4444', display: 'flex', gap: 8, alignItems: 'center' }}>
      <AlertCircle size={16} /> Failed to load plan.
      <button onClick={() => navigate('/work-plan')} style={{ marginLeft: 8, color: C.teal, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Go back</button>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: '100vh', position: 'relative' }}>

      {/* ── Left edge vertical tabs (Invite + Rate Meeting) — vembu style ── */}
      <div style={{ position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 0, pointerEvents: 'none' }}>
        <div onClick={() => setShowContribModal(true)} style={{
          writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)',
          background: C.teal, color: '#fff', fontSize: 12, fontWeight: 600,
          padding: '10px 6px', cursor: 'pointer', letterSpacing: 1,
          borderRadius: '0 4px 4px 0', pointerEvents: 'auto',
        }}>
          Invite
        </div>
        <div onClick={() => setShowRateModal(true)} style={{
          writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)',
          background: C.purple, color: '#fff', fontSize: 12, fontWeight: 600,
          padding: '10px 6px', cursor: 'pointer', letterSpacing: 1,
          borderRadius: '0 4px 4px 0', marginTop: 2, pointerEvents: 'auto',
        }}>
          Rate Meeting
        </div>
      </div>

      {/* ── Main content (left-padded to clear left tabs) ── */}
      <div style={{ paddingLeft: 28 }}>

        {/* ── Plan header ── */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '14px 18px 10px 16px', position: 'relative' }}>
          {/* Row 1: Title + inline icons (left), green refresh (absolute top-right) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingRight: 44 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text, flexShrink: 0 }}>
              {plan.name || plan.growthPlanName || 'Plan'}
            </h1>
            {/* Inline toolbar icons right after title — matches vembu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 6 }}>
              {[
                { title: 'Notes',   svg: TOOLBAR_ICONS[0].svg,  onClick: () => setShowPlanNotes(true) },
                { title: 'Link',    svg: TOOLBAR_ICONS[1].svg,  onClick: () => setShowLinkModal(true) },
                { title: 'Chart',   svg: TOOLBAR_ICONS[2].svg,  onClick: () => setShowBarReport(true) },
                { title: 'Palette', svg: TOOLBAR_ICONS[3].svg,  onClick: () => setShowPickerModal(true) },
                { title: 'Print',   svg: TOOLBAR_ICONS[4].svg,  onClick: async () => {
                    try { await api.updateEntityActivity({ activity:'PRINT', entityId, growthPlanId: Number(planId), auditMessage: 'You took print of the growth plan' }); } catch(e){}
                    window.print();
                  }
                },
                { title: 'Stack',   svg: TOOLBAR_ICONS[5].svg,  onClick: () => setShowStackReport(true) },
                { title: 'Fire',    svg: TOOLBAR_ICONS[6].svg,  onClick: () => setShowFireReport(true) },
                { title: 'Users',   svg: TOOLBAR_ICONS[7].svg,  onClick: () => setShowContribModal(true) },
              ].map(({ title, svg, onClick }) => (
                <button key={title} title={title} onClick={onClick}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px', borderRadius: 4, color: C.text2, display: 'flex' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f4f8'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >{svg}</button>
              ))}
            </div>
          </div>
          {/* Green refresh — absolute top-right of header, matching vembu */}
          <button onClick={doRefresh}
            style={{ position: 'absolute', top: 12, right: 14, background: '#27ae60', border: 'none', borderRadius: '50%', cursor: 'pointer', padding: '6px', color: '#fff', display: 'flex', alignItems: 'center', width: 30, height: 30, justifyContent: 'center' }}
            title="Refresh"
          ><RefreshCw size={14} /></button>

          {/* Row 2: Due date + Owner (left) | Gauge (center) | wide progress bar (right) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {/* Left meta */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: C.text2 }}>Due Date</span>
                {(plan.growthPlanMilestoneDate || plan.milestoneDate)
                  ? <span style={{ background: C.purple, color: '#fff', borderRadius: 4, padding: '2px 10px', fontSize: 13, fontWeight: 600 }}>
                      {new Date(plan.growthPlanMilestoneDate || plan.milestoneDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                    </span>
                  : <span style={{ color: C.text2 }}>—</span>
                }
              </div>
              {(plan.ownerName || plan.firstName) && (
                <div style={{ fontSize: 13, color: C.text2 }}>
                  Owner: <span style={{ color: C.text, fontWeight: 500 }}>
                    {plan.ownerName || `${plan.firstName || ''} ${plan.lastName || ''}`.trim()}
                  </span>
                </div>
              )}
            </div>
            {/* Gauge + progress bar — fills remaining space */}
            <Speedometer percent={percent} />

            {/* Right action buttons — removed to match Vembu original (these are commented out in Vembu's GrowthHeader.js) */}
          </div>
        </div>

        {/* ── Toolbar row: up-arrow + toggle + Add Goal + filter ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', background: C.white, borderBottom: `1px solid ${C.border}`,
        }}>
          {/* Up arrow */}
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text2, display: 'flex', padding: '4px 4px' }}>
            <ArrowUp size={15} />
          </button>
          {/* Toggle switch */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: C.text2 }}>
            <div
              onClick={() => setHideComplete(v => !v)}
              style={{
                width: 34, height: 18, borderRadius: 9, background: hideComplete ? C.teal : '#ccc',
                position: 'relative', cursor: 'pointer', transition: 'background .2s',
              }}
            >
              <div style={{
                position: 'absolute', top: 2, left: hideComplete ? 16 : 2,
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                transition: 'left .2s', boxShadow: '0 1px 2px rgba(0,0,0,.2)',
              }} />
            </div>
          </label>

          {/* Add New Goal — only for plan owner/editor */}
          {plan.allowAccess === 'EDIT' && <button
            onClick={() => setShowGoalModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: C.purple, color: '#fff', border: 'none',
              borderRadius: 5, padding: '6px 14px', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
            }}
          >
            <Plus size={13} /> Add New Goal
          </button>}

          <div style={{ flex: 1 }} />

          {/* Filter + column headers — sort popover matching vembu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setFilterOpen(v => !v)}
              title="Sort / Filter"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: filterOpen ? C.teal : C.text2, display: 'flex', alignItems: 'center' }}
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2}>
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
            </button>
            {filterOpen && (
              <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,.15)', zIndex: 200, minWidth: 150 }}>
                {[{ key: 'Goal', label: 'Goal' }, { key: 'DueDate', label: 'Goal Due Date' }, { key: 'Status', label: 'Goal Status' }].map(({ key, label }) => (
                  <button key={key} onClick={() => { setSortBy(sortBy === key ? '' : key); setFilterOpen(false); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', background: sortBy === key ? C.primaryLight || '#e6f7fd' : 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: sortBy === key ? C.teal : C.text, fontWeight: sortBy === key ? 600 : 400 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f4f8'}
                    onMouseLeave={e => e.currentTarget.style.background = sortBy === key ? '#e6f7fd' : 'none'}
                  >{label}</button>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: C.text2, fontWeight: 600, gap: 8, marginLeft: 8 }}>
            <span style={{ minWidth: 80, textAlign: 'center' }}>Progress</span>
            <span style={{ minWidth: 100, textAlign: 'right' }}>Due Date</span>
          </div>
        </div>

        {/* ── Goals + actions table ── */}
        {planQuery.isLoading && <Spinner />}
        {!planQuery.isLoading && goals.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: C.text2, fontSize: 14 }}>No goals yet. Click "+ Add New Goal" to get started.</div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 4 }} />
            <col style={{ width: 301 }} />
            <col style={{ width: 64 }} />
            <col />
            <col style={{ width: 66 }} />
            <col style={{ width: 120 }} />
          </colgroup>
          <tbody>
            {goals.map((goal, gi) => {
              const goalActions = actions.filter(a => String(a.goalId) === String(goal.goalId));
              const visibleActions = hideComplete
                ? goalActions.filter(a => Number(a.actionGoalPercentAchieve || 0) < 100)
                : goalActions;
              return [
                <GoalRow
                  key={`g-${goal.goalId || gi}`}
                  goal={goal}
                  goalActions={goalActions}
                  onChartClick={(g, ga) => setChartGoal({ goal: g, goalActions: ga, initialTab: 'chart' })}
                  onDecisionClick={(g, ga) => setChartGoal({ goal: g, goalActions: ga, initialTab: 'decision' })}
                  onNoteClick={() => setNotesCtx({ growthPlanId: Number(planId), goalTagId: goal.goalTagId, actionTagId: null, planColor: themeColor })}
                  onNotePopoverClick={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setNotePopover({
                      x: rect.right + 4,
                      y: rect.top + window.scrollY,
                      growthPlanId: Number(planId),
                      goalTagId: goal.goalTagId,
                      actionTagId: null,
                      title: goal.goalName,
                      planColor: themeColor,
                      isAction: false,
                    });
                  }}
                  onFileClick={() => setFilesCtx({ growthPlanId: Number(planId), goalTagId: goal.goalTagId, actionTagId: null, planColor: themeColor })}
                />,
                ...visibleActions.map((action, ai) => (
                  <ActionRow
                    key={`a-${action.actionId || ai}`}
                    action={action}
                    themeColor={themeColor}
                    isChild={!!isChild}
                    onPublishToggle={(a) => {
                      api.updateActionFeedback({
                        action: 'PUBLISHTOMASTERACTION',
                        teamId: String(planId),
                        goalTagId: goal.goalTagId,
                        actionTagId: a.actionTagId,
                        entityId,
                        publish: a.publishToMaster === 2 ? 1 : 2,
                      }).then(doRefresh).catch(() => toast.error('Failed to update sync'));
                    }}
                    onChartClick={() => setChartGoal({ goal, goalActions, initialTab: 'chart' })}
                    onDecisionClick={() => setChartGoal({ goal, goalActions, initialTab: 'decision' })}
                    onNoteClick={() => setNotesCtx({ growthPlanId: Number(planId), goalTagId: action.goalId, actionTagId: action.actionTagId, planColor: themeColor })}
                    onNotePopoverClick={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setNotePopover({
                        x: rect.right + 4,
                        y: rect.top + window.scrollY,
                        growthPlanId: Number(planId),
                        goalTagId: action.goalId,
                        actionTagId: action.actionTagId,
                        title: action.actionName,
                        planColor: themeColor,
                        isAction: true,
                      });
                    }}
                    onFileClick={() => setFilesCtx({ growthPlanId: Number(planId), goalTagId: action.goalId, actionTagId: action.actionTagId, planColor: themeColor })}
                    onNameSave={(newName) => {
                      api.updateAction({
                        action: 'UPDATE',
                        actionId: action.actionTagId,
                        goalId: action.goalId,
                        entityId,
                        name: newName,
                        companyId,
                        teamId: String(planId),
                      })
                        .then(() => queryClient.invalidateQueries(['planDetail', planId]))
                        .catch(() => toast.error('Failed to rename action'));
                    }}
                    onSliderCommit={(progress) => {
                      api.updateActionProgress({
                        updateDelete: 'PROGRESS',
                        goalTagId: goal.goalTagId || goal.goalId,
                        action: {
                          actionTagId: action.actionTagId || action.actionId,
                          growthPlanId: Number(planId),
                          tagId: action.tagId,
                          progress,
                          ownerId: entityId,
                          teamId: null,
                        },
                      })
                        .then(() => queryClient.invalidateQueries(['planDetail', planId]))
                        .catch(() => toast.error('Failed to save progress'));
                    }}
                  />
                )),
              ];
            })}
          </tbody>
        </table>
      </div>

      {/* ── Modals ── */}
      {showGoalModal && (
        <AddGoalModal
          onClose={() => setShowGoalModal(false)}
          onAdd={(form) => addGoalMutation.mutate(form)}
          isPending={addGoalMutation.isPending}
        />
      )}
      {chartGoal && (
        <GoalChartModal
          goal={chartGoal.goal}
          goalActions={chartGoal.goalActions}
          initialTab={chartGoal.initialTab || 'chart'}
          onClose={() => setChartGoal(null)}
          growthPlanId={Number(planId)}
          entityId={entityId}
        />
      )}
      {notesCtx && (
        <NotesModal
          {...notesCtx}
          onClose={() => setNotesCtx(null)}
        />
      )}
      {filesCtx && (
        <FilesModal
          {...filesCtx}
          onClose={() => setFilesCtx(null)}
        />
      )}

      {/* ─── Plan-level Notes Modal (toolbar Notes btn) ─── */}
      {showPlanNotes && (
        <NotesModal
          growthPlanId={Number(planId)}
          goalTagId={null}
          actionTagId={null}
          planColor={themeColor}
          onClose={() => setShowPlanNotes(false)}
        />
      )}

      {/* ─── Link Endpoint Modal ─── */}
      {showLinkModal && (
        <LinkEndpointModal
          planId={Number(planId)}
          entityId={entityId}
          companyId={companyId}
          onClose={() => setShowLinkModal(false)}
        />
      )}

      {/* ─── Bar Chart / Goal Plan Report Modal ─── */}
      {showBarReport && (
        <PlanReportModal
          planId={Number(planId)}
          entityId={entityId}
          companyId={companyId}
          themeColor={themeColor}
          onClose={() => setShowBarReport(false)}
        />
      )}

      {/* ─── Color Picker Modal (Palette toolbar btn) ─── */}
      {showPickerModal && (
        <ColorPickerModal
          planId={Number(planId)}
          entityId={entityId}
          companyId={companyId}
          currentColor={themeColor}
          onClose={() => setShowPickerModal(false)}
          onChanged={() => { setShowPickerModal(false); doRefresh(); }}
        />
      )}

      {/* ─── Stack / All-User Productivity Modal ─── */}
      {showStackReport && (
        <OverallReportModal
          planId={Number(planId)}
          entityId={entityId}
          companyId={companyId}
          onClose={() => setShowStackReport(false)}
        />
      )}

      {/* ─── Fire / Trending Report Modal ─── */}
      {showFireReport && (
        <TrendingReportModal
          planId={Number(planId)}
          entityId={entityId}
          companyId={companyId}
          onClose={() => setShowFireReport(false)}
        />
      )}

      {/* ─── Invite Contributors Modal ─── */}
      {showContribModal && (
        <InviteContributorsModal
          planId={Number(planId)}
          entityId={entityId}
          companyId={companyId}
          onClose={() => setShowContribModal(false)}
        />
      )}

      {showRateModal && (
        <RateMeetingModal
          growthPlanId={planId}
          entityId={entityId}
          planColor={plan?.colorCode || 'teal'}
          onClose={() => setShowRateModal(false)}
          onSubmit={() => { setShowRateModal(false); setRefreshKey(k => k + 1); }}
        />
      )}

      {/* ─── Note icon popover: Notes | History | Activity Log ─── */}
      {notePopover && (
        <NotePopover
          x={notePopover.x}
          y={notePopover.y}
          planColor={notePopover.planColor || C.teal}
          onNotes={() => {
            setNotesCtx({
              growthPlanId: notePopover.growthPlanId,
              goalTagId:    notePopover.goalTagId,
              actionTagId:  notePopover.actionTagId,
              planColor:    notePopover.planColor,
            });
            setNotePopover(null);
          }}
          onHistory={() => {
            setHistoryCtx({
              growthPlanId: notePopover.growthPlanId,
              goalTagId:    notePopover.goalTagId,
              actionTagId:  notePopover.actionTagId,
              title:        notePopover.title,
              planColor:    notePopover.planColor,
            });
            setNotePopover(null);
          }}
          onActivityLog={() => {
            setActivityCtx({
              growthPlanId: notePopover.growthPlanId,
              goalTagId:    notePopover.goalTagId,
              actionTagId:  notePopover.actionTagId,
              title:        notePopover.title,
            });
            setNotePopover(null);
          }}
          onClose={() => setNotePopover(null)}
        />
      )}

      {/* ─── History Modal ─── */}
      {historyCtx && (
        <HistoryModal
          {...historyCtx}
          entityId={entityId}
          onClose={() => setHistoryCtx(null)}
        />
      )}

      {/* ─── Activity Log Modal ─── */}
      {activityCtx && (
        <ActivityLogModal
          {...activityCtx}
          entityId={entityId}
          onClose={() => setActivityCtx(null)}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * NOTE ICON POPOVER + HISTORY + ACTIVITY LOG
 * ──────────────────────────────────────────────────────────────────────────── */

/* ─── NotePopover — 3-button dropdown matching Vembu popover ───────────────── */
function NotePopover({ x, y, planColor, onNotes, onHistory, onActivityLog, onClose }) {
  const color = planColor || '#0197cc';
  const ref   = useRef(null);

  // Close on click-outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const btnStyle = {
    display: 'block', width: '100%', textAlign: 'left',
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '6px 14px', fontSize: 13, color: '#23282c',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 9999,
        background: '#fff',
        border: `1px solid ${color}`,
        borderRadius: 4,
        boxShadow: '0 3px 10px rgba(0,0,0,0.18)',
        minWidth: 130,
        padding: '4px 0',
      }}
    >
      <button
        style={btnStyle}
        onMouseEnter={e => { e.currentTarget.style.background = '#f0f8ff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        onClick={onNotes}
      >Notes</button>
      <button
        style={btnStyle}
        onMouseEnter={e => { e.currentTarget.style.background = '#f0f8ff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        onClick={onHistory}
      >History</button>
      <button
        style={btnStyle}
        onMouseEnter={e => { e.currentTarget.style.background = '#f0f8ff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        onClick={onActivityLog}
      >Activity Log</button>
    </div>
  );
}

/* ─── HistoryModal — shows past notes for a goal/action (matching Vembu FloatingNotesHistory) */
function HistoryModal({ growthPlanId, goalTagId, actionTagId, title, planColor, entityId, onClose }) {
  const [notes, setNotes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const color = planColor || '#0197cc';

  useEffect(() => {
    api.updateGoalActionNotes({ action: 'GET', growthPlanId, goalTagId: goalTagId || null, actionTagId: actionTagId || null })
      .then(r => { setNotes(r.data?.result || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [growthPlanId, goalTagId, actionTagId]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 8, width: 620, maxWidth: '95vw',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        border: `3px solid ${color}`, boxShadow: '0 6px 28px rgba(0,0,0,0.22)',
      }}>
        {/* Header */}
        <div style={{
          background: color, color: '#fff', padding: '10px 16px',
          borderRadius: '5px 5px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>History — {title || 'Notes'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#888' }}>Loading…</div>
          ) : notes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#888' }}>No notes found.</div>
          ) : (
            notes.map((n, i) => (
              <div key={n.notesId || i} style={{
                borderBottom: '1px solid #e4e7ea', padding: '10px 0',
                fontSize: 13, color: '#23282c',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color }}>
                    {n.firstName ? `${n.firstName} ${n.lastName || ''}`.trim() : 'User'}
                  </span>
                  <span style={{ fontSize: 11, color: '#888' }}>
                    {n.created ? new Date(n.created).toLocaleString() : ''}
                  </span>
                </div>
                <div
                  style={{ lineHeight: 1.5 }}
                  dangerouslySetInnerHTML={{ __html: n.notes || '' }}
                />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid #e4e7ea', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              background: color, color: '#fff', border: 'none', borderRadius: 4,
              padding: '6px 18px', fontSize: 13, cursor: 'pointer', fontWeight: 600,
            }}
          >Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── ActivityLogModal — matches Vembu ViewActivityLog ─────────────────────── */
function ActivityLogModal({ growthPlanId, goalTagId, actionTagId, title, entityId, onClose }) {
  const [calendar, setCalendar] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [orderBy,  setOrderBy]  = useState('desc');

  useEffect(() => {
    api.getEntityActivity({ growthPlanId, goalTagId: goalTagId || null, actionTagId: actionTagId || null })
      .then(r => { setCalendar(r.data?.calendar || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [growthPlanId, goalTagId, actionTagId]);

  const list = orderBy === 'desc' ? [...calendar].reverse() : calendar;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 8, width: 760, maxWidth: '96vw',
        maxHeight: '82vh', display: 'flex', flexDirection: 'column',
        border: '3px solid #20a8d8', boxShadow: '0 6px 28px rgba(0,0,0,0.22)',
      }}>
        {/* Header */}
        <div style={{
          background: '#20a8d8', color: '#fff', padding: '10px 16px',
          borderRadius: '5px 5px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>View Activity Log{title ? ` — ${title}` : ''}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        {/* Sort control */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #e4e7ea', display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, color: '#73818f' }}>Sort by:</label>
          <select
            value={orderBy}
            onChange={e => setOrderBy(e.target.value)}
            style={{ fontSize: 12, padding: '2px 6px', borderRadius: 3, border: '1px solid #ccc' }}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading…</div>
          ) : list.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>No Activity Log Found</div>
          ) : (
            list.map((day, di) => {
              const audits = orderBy === 'desc'
                ? [...(day.auditList || [])].reverse()
                : (day.auditList || []);
              return (
                <div key={di} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, color: '#0197cc', fontSize: 13, marginBottom: 4 }}>
                    {day.calendarDisplay}
                  </div>
                  {audits.map((item, mi) => {
                    if (!item.auditMessage) return null;
                    const name = `${item.firstName || ''} ${item.lastName || ''}`.trim();
                    const msg = item.auditMessage
                      .replace('You ', name + ' ')
                      .replace(/growth/g, 'goal')
                      .replace(/Growth/g, 'Goal');
                    return (
                      <div key={mi} style={{
                        padding: '4px 8px',
                        fontSize: 12.5, color: '#23282c',
                        borderBottom: '1px solid #f0f0f0',
                        lineHeight: 1.5,
                      }}>
                        {msg}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid #e4e7ea', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              background: '#20a8d8', color: '#fff', border: 'none', borderRadius: 4,
              padding: '6px 18px', fontSize: 13, cursor: 'pointer', fontWeight: 600,
            }}
          >Close</button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * TOOLBAR MODAL COMPONENTS
 * ──────────────────────────────────────────────────────────────────────────── */

/* ─── Color Picker Modal (Palette btn) ─── */
function ColorPickerModal({ planId, entityId, companyId, currentColor, onClose, onChanged }) {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    api.getPicklist({ picklistType: 'COLOR', entityId })
      .then(r => setColors(r.data?.picklist || []))
      .catch(() => setColors([])) 
      .finally(() => setLoading(false));
  }, []);

  async function selectColor(colorHex) {
    setSaving(colorHex);
    try {
      await api.updateGrowthPlan({
        action: 'UpdateGrowthPlan',
        entityId, companyId,
        growthPlanId: planId,
        colorCodeHex: colorHex.replace('#',''),
      });
      toast.success('Color updated');
      onChanged();
    } catch(e) {
      toast.error('Failed to update color');
      setSaving(null);
    }
  }

  // Fallback colors if getPicklist returns nothing
  const FALLBACK_COLORS = ['0197cc','6B3FA0','e74c3c','e67e22','f1c40f','2ecc71','1abc9c','3498db','9b59b6','34495e','95a5a6','27ae60'];
  const displayed = colors.length > 0 ? colors : FALLBACK_COLORS.map(c => ({ colorCodeHex: c }));

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ background:'#fff',borderRadius:8,padding:24,width:360,boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
          <h3 style={{ margin:0,fontSize:16,fontWeight:700 }}>Choose Plan Color</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer' }}><X size={18}/></button>
        </div>
        {loading ? <Spinner /> : (
          <div style={{ display:'flex',flexWrap:'wrap',gap:10 }}>
            {displayed.map((c,i) => {
              const hex = c.colorCodeHex ? (c.colorCodeHex.startsWith('#') ? c.colorCodeHex : `#${c.colorCodeHex}`) : `#${c}`;
              const isActive = hex.toLowerCase() === (currentColor || '').toLowerCase();
              return (
                <button key={i} onClick={() => selectColor(hex)}
                  disabled={saving !== null}
                  style={{
                    width:40,height:40,borderRadius:6,background:hex,border:isActive?'3px solid #222':'2px solid transparent',
                    cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'transform .1s',
                    transform: saving===hex ? 'scale(0.9)':'scale(1)',
                  }}
                  title={hex}
                >
                  {isActive && <span style={{color:'#fff',fontSize:14,fontWeight:700}}>✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Link Endpoint Modal ─── */
function LinkEndpointModal({ planId, entityId, companyId, onClose }) {
  const [tab, setTab] = useState('measures');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getGrowthPlanDetails({ action: 'GetEndpoints', growthPlanId: planId, entityId, companyId })
      .then(r => setItems(r.data?.endpoints || r.data?.result || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ background:'#fff',borderRadius:8,width:560,maxHeight:'80vh',display:'flex',flexDirection:'column',boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ padding:'16px 20px',borderBottom:'1px solid #e4e7ea',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <h3 style={{ margin:0,fontSize:16,fontWeight:700 }}>Link Endpoint</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer' }}><X size={18}/></button>
        </div>
        <div style={{ display:'flex',borderBottom:'1px solid #e4e7ea' }}>
          {['measures','endpoints'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:'10px 20px',border:'none',background:'transparent',cursor:'pointer',fontWeight:tab===t?700:400,
                color:tab===t?'#0197cc':'#73818f',borderBottom:tab===t?'2px solid #0197cc':'2px solid transparent',marginBottom:-1 }}
            >{t.charAt(0).toUpperCase()+t.slice(1)}</button>
          ))}
        </div>
        <div style={{ flex:1,overflowY:'auto',padding:16 }}>
          {loading ? <Spinner /> : items.length === 0 ? (
            <p style={{ color:'#73818f',textAlign:'center',padding:20 }}>No {tab} found for this plan.</p>
          ) : (
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
              <thead><tr style={{ background:'#f4f5fa' }}>
                <th style={{ padding:'8px 12px',textAlign:'left',fontWeight:600 }}>Name</th>
                <th style={{ padding:'8px 12px',textAlign:'left',fontWeight:600 }}>Value</th>
                <th style={{ padding:'8px 12px',textAlign:'left',fontWeight:600 }}>Status</th>
              </tr></thead>
              <tbody>
                {items.map((item,i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #e4e7ea' }}>
                    <td style={{ padding:'8px 12px' }}>{item.name||item.endpointName||item.measureName||'—'}</td>
                    <td style={{ padding:'8px 12px' }}>{item.value||item.endpointValue||'—'}</td>
                    <td style={{ padding:'8px 12px' }}>{item.status||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ padding:'12px 20px',borderTop:'1px solid #e4e7ea',display:'flex',justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 20px',background:'#0197cc',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600 }}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Plan Report Modal (Chart / bar icon) ─── */
function PlanReportModal({ planId, entityId, companyId, themeColor, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['planReport', planId, entityId],
    queryFn: () => api.getReport({ _reportType: 'GOALPLAN', companyId, _entityId: entityId, _filter1: planId }),
    select: r => r.data?.data || r.data?.result || r.data?.reports?.[0]?.details || [],
  });

  const rows = data || [];
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ background:'#fff',borderRadius:8,width:640,maxHeight:'80vh',display:'flex',flexDirection:'column',boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ padding:'16px 20px',borderBottom:'1px solid #e4e7ea',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <h3 style={{ margin:0,fontSize:16,fontWeight:700,color:themeColor }}>Goal Plan Report</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer' }}><X size={18}/></button>
        </div>
        <div style={{ flex:1,overflowY:'auto',padding:16 }}>
          {isLoading ? <Spinner /> : rows.length === 0 ? (
            <p style={{ color:'#73818f',textAlign:'center',padding:32 }}>No report data available.</p>
          ) : (
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
              <thead><tr style={{ background:'#f4f5fa' }}>
                {Object.keys(rows[0]).map(k => <th key={k} style={{ padding:'8px 10px',textAlign:'left',fontWeight:600,borderBottom:'2px solid #e4e7ea' }}>{k}</th>)}
              </tr></thead>
              <tbody>
                {rows.map((row,i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #e4e7ea' }}>
                    {Object.values(row).map((v,j) => <td key={j} style={{ padding:'8px 10px' }}>{String(v??'—')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ padding:'12px 20px',borderTop:'1px solid #e4e7ea',display:'flex',justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 20px',background:'#0197cc',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600 }}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Overall All-Users Report Modal (Stack icon) ─── */
function OverallReportModal({ planId, entityId, companyId, onClose }) {
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now()-30*24*60*60*1000).toISOString().split('T')[0];
  const { data, isLoading } = useQuery({
    queryKey: ['overallReport', companyId],
    queryFn: () => api.getReport({ _reportType: 'LOGIN', companyId, _startDate: monthAgo, _endDate: today, _filterType:'DAY' }),
    select: r => r.data?.data || r.data?.result || r.data?.reports?.[0]?.details || [],
  });
  const rows = data || [];
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ background:'#fff',borderRadius:8,width:640,maxHeight:'80vh',display:'flex',flexDirection:'column',boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ padding:'16px 20px',borderBottom:'1px solid #e4e7ea',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <h3 style={{ margin:0,fontSize:16,fontWeight:700 }}>Overall Productivity Report</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer' }}><X size={18}/></button>
        </div>
        <div style={{ flex:1,overflowY:'auto',padding:16 }}>
          {isLoading ? <Spinner /> : rows.length === 0 ? (
            <p style={{ color:'#73818f',textAlign:'center',padding:32 }}>No report data for the last 30 days.</p>
          ) : (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:16 }}>
              {rows.slice(0,8).map((r,i) => (
                <div key={i} style={{ background:'#f4f5fa',borderRadius:8,padding:'12px 16px' }}>
                  <div style={{ fontSize:18,fontWeight:700,color:'#0197cc' }}>{r.count || r.value || '—'}</div>
                  <div style={{ fontSize:12,color:'#73818f',marginTop:2 }}>{r.reportDate || r.label || `Entry ${i+1}`}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding:'12px 20px',borderTop:'1px solid #e4e7ea',display:'flex',justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 20px',background:'#0197cc',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600 }}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Trending / Fire Report Modal ─── */
function TrendingReportModal({ planId, entityId, companyId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['trendingReport', companyId, entityId],
    queryFn: () => api.getReport({ _reportType: 'PARTICIPATION', companyId, _entityId: entityId }),
    select: r => r.data?.data || r.data?.result || r.data?.reports?.[0]?.details || [],
  });
  const rows = data || [];
  const total = rows.reduce((s,r)=>s+(Number(r.count)||0),0);
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ background:'#fff',borderRadius:8,width:560,maxHeight:'80vh',display:'flex',flexDirection:'column',boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ padding:'16px 20px',borderBottom:'1px solid #e4e7ea',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <h3 style={{ margin:0,fontSize:16,fontWeight:700,color:'#e74c3c' }}>Trending / Growth Activity</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer' }}><X size={18}/></button>
        </div>
        <div style={{ flex:1,overflowY:'auto',padding:16 }}>
          {isLoading ? <Spinner /> : (
            <>
              <div style={{ background:'#fff9e6',border:'1px solid #ffc107',borderRadius:8,padding:'12px 16px',marginBottom:16 }}>
                <div style={{ fontSize:22,fontWeight:700,color:'#e67e22' }}>{total}</div>
                <div style={{ fontSize:13,color:'#73818f' }}>Total Participation Events</div>
              </div>
              {rows.length === 0 ? (
                <p style={{ color:'#73818f',textAlign:'center',padding:20 }}>No trending data available.</p>
              ) : (
                rows.slice(0,10).map((r,i) => (
                  <div key={i} style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f0f0f0' }}>
                    <span style={{ fontSize:13,color:'#333' }}>{r.reportDate||r.label||`Entry ${i+1}`}</span>
                    <span style={{ fontSize:13,fontWeight:700,color:'#e67e22' }}>{r.count||r.value||0}</span>
                  </div>
                ))
              )}
            </>
          )}
        </div>
        <div style={{ padding:'12px 20px',borderTop:'1px solid #e4e7ea',display:'flex',justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 20px',background:'#0197cc',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600 }}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Rate Meeting Modal ─── */
function RateMeetingModal({ growthPlanId, entityId, planColor, onClose, onSubmit }) {
  const { token } = useAuthStore();
  const tok = typeof token === 'function' ? token() : token;
  const [range,    setRange]    = useState(3);
  const [comments, setComments] = useState('');
  const [saving,   setSaving]   = useState(false);

  const EMOJIS = { 1: '\u{1F621}', 2: '\u{1F626}', 3: '\u{1F610}', 4: '\u{1F600}', 5: '\u{1F917}' };

  const handleSubmit = async () => {
    if (!comments.trim()) { alert('Please enter comments'); return; }
    setSaving(true);
    try {
      await api.updateGoalActionNotes({
        action: 'UPDATEMEETINGHISTORY',
        growthPlanId, entityId,
        notesType: 'RateMyMeeting',
        notes: comments,
        teamId: String(growthPlanId),
        rating: range,
      }, tok);
      onSubmit();
    } catch(e) { alert('Error saving rating'); }
    finally { setSaving(false); }
  };

  const overlay = { position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center' };
  const modal   = { background:'#fff',borderRadius:8,width:380,overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,0.22)' };
  const hdr     = { background: C.teal, color:'#fff', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' };
  const body    = { padding:24, display:'flex', flexDirection:'column', alignItems:'center', gap:12 };

  return (
    <div style={overlay} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <div style={hdr}>
          <span style={{ fontWeight:700, fontSize:15 }}>Rate This Meeting</span>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'#fff',fontSize:20,cursor:'pointer',lineHeight:1 }}>×</button>
        </div>
        <div style={body}>
          <div style={{ fontSize:72, lineHeight:1 }}>{EMOJIS[range]}</div>
          <input
            type="range" min={1} max={5} value={range}
            onChange={e => setRange(Number(e.target.value))}
            style={{ width:'100%', accentColor: C.teal }}
          />
          <div style={{ display:'flex', justifyContent:'space-between', width:'100%', fontSize:12, color:'#888' }}>
            <span>Poor</span><span>Excellent</span>
          </div>
          <textarea
            rows={4}
            placeholder="Please tell me how we might make this plan and/or our meetings better."
            value={comments}
            onChange={e => setComments(e.target.value)}
            style={{ width:'100%', border:`1px solid ${C.border}`, borderRadius:4, padding:'8px 10px', fontSize:13, resize:'vertical', fontFamily:'inherit' }}
          />
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', width:'100%' }}>
            <button onClick={onClose} style={{ padding:'7px 18px', borderRadius:4, border:`1px solid ${C.border}`, background:'#fff', cursor:'pointer', fontSize:13 }}>Cancel</button>
            <button onClick={handleSubmit} disabled={saving} style={{ padding:'7px 18px', borderRadius:4, border:'none', background: C.teal, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>
              {saving ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Invite Contributors Modal (Users icon) ─── */
function InviteContributorsModal({ planId, entityId, companyId, onClose }) {
  const [search, setSearch] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [allRes, contribRes] = await Promise.all([
          api.getAllContributors({ action: 'All', companyId, entityId, growthPlanId: planId }),
          api.getAllContributors({ action: 'Contributors', companyId, entityId, growthPlanId: planId }),
        ]);
        const all = allRes.data?.EntityUser || allRes.data?.result || [];
        const contrib = contribRes.data?.EntityUser || contribRes.data?.result || [];
        setAllUsers(all);
        setContributors(contrib.map(c => c.entityId));
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function toggleContributor(user) {
    const isContrib = contributors.includes(user.entityId);
    setSaving(user.entityId);
    try {
      await api.addCGPContributor({
        action: isContrib ? 'REMOVE' : 'ADD',
        entityId,
        companyId,
        growthPlanId: planId,
        contributorEntityId: user.entityId,
      });
      setContributors(prev =>
        isContrib ? prev.filter(id => id !== user.entityId) : [...prev, user.entityId]
      );
      toast.success(isContrib ? 'Contributor removed' : 'Contributor added');
    } catch(e) {
      toast.error('Failed to update contributor');
    } finally {
      setSaving(null);
    }
  }

  const filtered = allUsers.filter(u => {
    const name = ((u.firstName||'') + ' ' + (u.lastName||'')).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ background:'#fff',borderRadius:8,width:500,maxHeight:'80vh',display:'flex',flexDirection:'column',boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ padding:'16px 20px',borderBottom:'1px solid #e4e7ea',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <h3 style={{ margin:0,fontSize:16,fontWeight:700 }}>Invite Contributors</h3>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer' }}><X size={18}/></button>
        </div>
        <div style={{ padding:'12px 16px',borderBottom:'1px solid #e4e7ea' }}>
          <input
            type="text" value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search users..."
            style={{ width:'100%',padding:'8px 12px',border:'1px solid #ced4da',borderRadius:6,fontSize:14,outline:'none',boxSizing:'border-box' }}
          />
        </div>
        <div style={{ flex:1,overflowY:'auto',padding:'8px 0' }}>
          {loading ? <Spinner /> : filtered.length===0 ? (
            <p style={{ color:'#73818f',textAlign:'center',padding:20 }}>No users found.</p>
          ) : filtered.map(u => {
            const isContrib = contributors.includes(u.entityId);
            return (
              <div key={u.entityId} style={{ display:'flex',alignItems:'center',padding:'10px 16px',borderBottom:'1px solid #f0f0f0' }}>
                <div style={{ width:36,height:36,borderRadius:'50%',background:'#6B3FA0',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,flexShrink:0 }}>
                  {(u.firstName||'?')[0].toUpperCase()}
                </div>
                <div style={{ flex:1,marginLeft:12 }}>
                  <div style={{ fontSize:14,fontWeight:600,color:'#23282c' }}>{u.firstName} {u.lastName}</div>
                  <div style={{ fontSize:12,color:'#73818f' }}>{u.email||u.companyName||''}</div>
                </div>
                <button
                  onClick={() => toggleContributor(u)}
                  disabled={saving===u.entityId}
                  style={{
                    padding:'6px 14px',border:'none',borderRadius:5,cursor:'pointer',fontSize:13,fontWeight:600,
                    background: isContrib ? '#dc3545' : '#0197cc',
                    color:'#fff',opacity:saving===u.entityId?0.7:1,
                  }}
                >{saving===u.entityId ? '...' : isContrib ? 'Remove' : 'Add'}</button>
              </div>
            );
          })}
        </div>
        <div style={{ padding:'12px 20px',borderTop:'1px solid #e4e7ea',display:'flex',justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 20px',background:'#6c757d',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600 }}>Done</button>
        </div>
      </div>
    </div>
  );
}
