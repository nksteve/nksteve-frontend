import { useState } from 'react';
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

/* ─── Speedometer — matches vembu: gauge centered, progress bar wide right ── */
function Speedometer({ percent = 0 }) {
  const p = Math.min(100, Math.max(0, Number(percent) || 0));
  // SVG coords: Y-axis is DOWN. Angles measured CW from east (standard SVG).
  // Gauge arc: from 225° to 315° (bottom-left to bottom-right) sweeping CW = 270° total
  // In SVG: 225° CW from east = bottom-left, 315° CW from east = bottom-right
  const cx = 85, cy = 80, r = 60;

  function ptOnCircle(deg) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(startDeg, endDeg, stroke, strokeW = 8) {
    const s = ptOnCircle(startDeg);
    const e = ptOnCircle(endDeg);
    const sweep = ((endDeg - startDeg) + 360) % 360;
    const large = sweep > 180 ? 1 : 0;
    return (
      <path
        d={`M${s.x.toFixed(2)} ${s.y.toFixed(2)} A${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`}
        fill="none" stroke={stroke} strokeWidth={strokeW} strokeLinecap="round"
      />
    );
  }

  // Gauge arc: 225° to 315° CW (through 270° at bottom = 0, then up to top = 4, then down to bottom-right = 8)
  // Segments matching vembu colors: red (225-255), yellow (255-285), green (285-315)
  // Needle: maps 0% to 225°, 100% to 315° CW
  const needleDeg = 225 + (p / 100) * 270;
  const npt = ptOnCircle(needleDeg);
  // shorten needle slightly
  const needleLen = r * 0.78;
  const needleRad = (needleDeg * Math.PI) / 180;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy + needleLen * Math.sin(needleRad);

  const barColor = p < 50 ? C.orange : p < 80 ? '#e6a817' : '#0B6623';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1 }}>
      {/* Gauge SVG — 150x110 viewBox to give room for labels below */}
      <svg width={175} height={120} viewBox="0 0 170 115" style={{ flexShrink: 0 }}>
        {/* grey full track */}
        {arcPath(225, 315, '#e0e0e0')}
        {/* colored segments: vembu red/yellow/green */}
        {arcPath(225, 255, '#ef4444')}
        {arcPath(255, 285, '#e6a817')}
        {arcPath(285, 315, '#0B6623')}
        {/* needle */}
        <line x1={cx} y1={cy} x2={nx.toFixed(2)} y2={ny.toFixed(2)} stroke="#444" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4.5} fill="#444" />
        {/* tick labels */}
        <text x={4}   y={108} fontSize={10} fill={C.text2} fontFamily="sans-serif">0</text>
        <text x={78}  y={18}  fontSize={10} fill={C.text2} fontFamily="sans-serif">4</text>
        <text x={152} y={108} fontSize={10} fill={C.text2} fontFamily="sans-serif">8</text>
        <text x={66}  y={108} fontSize={10} fill={C.text2} fontFamily="sans-serif">{p.toFixed(0)}%</text>
      </svg>
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

/* ─── Header toolbar icons (vembu: clipboard, link, bar-chart, palette, print, stack, fire, person) ── */
const TOOLBAR_ICONS = [
  { title: 'Notes',   svg: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2}><rect x={5} y={2} width={14} height={20} rx={2}/><line x1={9} y1={7} x2={15} y2={7}/><line x1={9} y1={11} x2={15} y2={11}/><line x1={9} y1={15} x2={12} y2={15}/></svg> },
  { title: 'Link',    svg: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
  { title: 'Chart',   svg: <BarChart2 size={15} /> },
  { title: 'Palette', svg: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2}><circle cx={12} cy={12} r={10}/><circle cx={8} cy={14} r={1} fill="currentColor"/><circle cx={12} cy={8} r={1} fill="currentColor"/><circle cx={16} cy={14} r={1} fill="currentColor"/></svg> },
  { title: 'Print',   svg: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x={6} y={14} width={12} height={8}/></svg> },
  { title: 'Stack',   svg: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={3}  width={20} height={4} rx={1}/><rect x={2} y={10} width={20} height={4} rx={1}/><rect x={2} y={17} width={20} height={4} rx={1}/></svg> },
  { title: 'Fire',    svg: <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> },
  { title: 'Users',   svg: <Users size={15} /> },
];

/* ─── Goal progress bar — matches vembu: colored fill + 3 tick marks ────────── */
function GoalProgressBar({ pct, goalMin, goalStretch, themeColor }) {
  const p   = Math.min(100, Math.max(0, Number(pct) || 0));
  // vembu color logic for goal
  const fill = p < 50 ? '#ffa500' : p < 80 ? '#008ECC' : '#0B6623';
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
  return 'orange';
}

function ActionSlider({ pct, onCommit }) {
  const p = Math.min(100, Math.max(0, Number(pct) || 0));
  const [localVal, setLocalVal] = useState(p);
  const color = sliderColor(localVal);

  // Rebuild styled slider whenever color changes
  const PrettoSlider = styled(Slider)({
    color,
    height: 6,
    padding: '10px 0',
    '& .MuiSlider-thumb': {
      height: 20,
      width: 20,
      backgroundColor: '#fff',
      border: '2px solid currentColor',
      '&:focus,&:hover,&.Mui-active': { boxShadow: 'inherit' },
    },
    '& .MuiSlider-track': { height: 6, borderRadius: 3 },
    '& .MuiSlider-rail': { height: 6, borderRadius: 3, opacity: 0.3 },
    '& .MuiSlider-valueLabel': {
      fontSize: 11, background: color,
    },
  });

  return (
    <div style={{ flex: 1, padding: '0 8px', display: 'flex', alignItems: 'center' }}>
      <PrettoSlider
        value={localVal}
        valueLabelDisplay="auto"
        onChange={(_, val) => {
          setLocalVal(val);
        }}
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

/* ─── Folder icon (vembu uses fa-folder after checkbox) ─────────────────────── */
function FolderIcon({ color = '#adb5bd' }) {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill={color} style={{ flexShrink: 0 }}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/* ─── Decision icon (vembu uses a wrench/asterisk looking icon) ──────────────── */
function DecisionIcon({ color }) {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke={color || '#adb5bd'} strokeWidth={2} style={{ flexShrink: 0 }}>
      <circle cx={12} cy={12} r={3}/>
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
    </svg>
  );
}

/* ─── Yellow square dot (vembu uses a yellow square, not circle) ─────────────── */
function YellowDot() {
  return <div style={{ width: 12, height: 12, background: '#ffc107', borderRadius: 2, flexShrink: 0 }} />;
}

/* ─── Goal header row — purple band matching vembu ─────────────────────────── */
function GoalRow({ goal, goalActions, onChartClick }) {
  // Aggregate % from actions (average of actionGoalPercentAchieve)
  const actionPcts = goalActions.map(a => Number(a.actionGoalPercentAchieve || 0));
  const aggPct     = actionPcts.length > 0
    ? actionPcts.reduce((s, v) => s + v, 0) / actionPcts.length
    : Number(goal.goalPercentAchieved || 0);
  const pct = Math.min(100, aggPct);
  const milestoneDate = goal.goalMilestoneDate || goal.milestoneDate;
  const bgcolor = C.purple; // vembu always uses purple for goal rows

  return (
    <tr style={{ background: bgcolor, height: 34 }}>
      {/* Left color stripe */}
      <td style={{ width: 4, background: bgcolor, padding: 0 }} />

      {/* Checkbox + folder */}
      <td style={{ padding: '0 4px', width: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Checkbox />
          <FolderIcon color="rgba(255,255,255,0.7)" />
        </div>
      </td>

      {/* Goal name — vembu: white input-box style on the purple band */}
      <td style={{ padding: '0 6px', width: 249 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: C.text,
          background: '#fff',
          border: '1px solid rgba(255,255,255,0.5)',
          borderRadius: 3,
          padding: '2px 6px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          width: 237,
          boxSizing: 'border-box',
        }}>
          {goal.goalName || '—'}
        </div>
      </td>

      {/* Yellow dot */}
      <td style={{ padding: '0 4px', width: 20 }}>
        <YellowDot />
      </td>

      {/* Bar chart + decision icons */}
      <td style={{ padding: '0 4px', width: 44 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => onChartClick && onChartClick(goal, goalActions)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.85)', display: 'flex' }}
            title="View Chart"
          >
            <BarChart2 size={14} />
          </button>
          <DecisionIcon color="rgba(255,255,255,0.75)" />
        </div>
      </td>

      {/* Goal progress bar (wide, colored, with ticks) */}
      <td style={{ padding: '0 4px' }}>
        <GoalProgressBar
          pct={pct}
          goalMin={goal.goalMin}
          goalStretch={goal.goalStretch}
        />
      </td>

      {/* % */}
      <td style={{ padding: '0 6px', width: 60, textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
        {pct.toFixed(1)}%
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
function ActionRow({ action, themeColor, onSliderCommit }) {
  const pct        = Math.min(100, Number(action.actionGoalPercentAchieve || 0));
  const [localPct, setLocalPct] = useState(pct);
  const endDate    = action.endDate || action.milestoneDate;
  const planColor  = themeColor || C.teal;

  return (
    <tr style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, height: 32 }}>
      {/* Left color stripe — thin colored border matching plan color */}
      <td style={{ width: 4, background: planColor, padding: 0 }} />

      {/* Checkbox + folder */}
      <td style={{ padding: '0 4px', width: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Checkbox />
          <FolderIcon color="#adb5bd" />
        </div>
      </td>

      {/* Action name — vembu: white input box, plain black text */}
      <td style={{ padding: '0 6px', width: 249 }}>
        <div style={{
          fontSize: 12.5, color: C.text,
          background: '#fff',
          border: '1px solid #c8ced3',
          borderRadius: 3,
          padding: '2px 6px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          width: 237,
        }}>
          {action.actionName || '—'}
        </div>
      </td>

      {/* Yellow dot */}
      <td style={{ padding: '0 4px', width: 20 }}>
        <YellowDot />
      </td>

      {/* Bar chart + decision icons */}
      <td style={{ padding: '0 4px', width: 44 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <BarChart2 size={13} color={C.text2} />
          <DecisionIcon color={C.text2} />
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

      {/* % — tracks local slider position */}
      <td style={{ padding: '0 6px', width: 60, textAlign: 'right', fontSize: 12.5, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>
        {localPct.toFixed(1)}%
      </td>

      {/* Due date / calendar icon */}
      <td style={{ padding: '0 8px', width: 110, textAlign: 'right' }}>
        {endDate
          ? <span style={{ fontSize: 11.5, color: C.teal, fontWeight: 600 }}>
              {new Date(endDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
            </span>
          : <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke={C.text2} strokeWidth={2} style={{ display: 'inline-block' }}>
              <rect x={3} y={4} width={18} height={18} rx={2}/><line x1={16} y1={2} x2={16} y2={6}/><line x1={8} y1={2} x2={8} y2={6}/><line x1={3} y1={10} x2={21} y2={10}/>
            </svg>
        }
      </td>
    </tr>
  );
}

/* ─── Goal Chart Modal ────────────────────────────────────────────────────────── */
const MODAL_TABS = [
  { id: 'chart',    Icon: BarChart2,      label: 'Chart' },
  { id: 'decision', Icon: DecisionIcon,   label: 'Decision' },
  { id: 'headsup',  Icon: MessageCircle,  label: 'HeadsUp' },
];

function GoalChartModal({ goal, goalActions, onClose }) {
  const [modalTab, setModalTab] = useState('chart');

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
                    <tr><td colSpan={4} style={{ padding: 16, textAlign: 'center', color: C.text2, fontSize: 13 }}>No actions yet.</td></tr>
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
            <div style={{ textAlign: 'center', padding: 30, color: C.text2 }}>
              <DecisionIcon color={C.teal} />
              <div style={{ marginTop: 10, fontSize: 15, fontWeight: 600, color: C.text }}>Decision ({goal.goalName})</div>
              <div style={{ marginTop: 6, fontSize: 13 }}>No Decision</div>
              <button style={{ marginTop: 14, padding: '7px 18px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                + Add Decision
              </button>
            </div>
          )}
          {modalTab === 'headsup' && (
            <div style={{ padding: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>HeadsUP</div>
              <textarea
                placeholder="Maximum 120 characters"
                maxLength={120}
                style={{ width: '100%', padding: 10, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, resize: 'vertical', minHeight: 80, boxSizing: 'border-box' }}
              />
              <button style={{ marginTop: 8, padding: '7px 18px', background: C.teal, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                Save
              </button>
            </div>
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
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [chartGoal,     setChartGoal]     = useState(null); // { goal, goalActions }
  const [refreshKey,    setRefreshKey]    = useState(0);
  const [hideComplete,  setHideComplete]  = useState(false);

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
      entityId, companyId, growthPlanId: planId,
      action: 'ADDGOAL', goalName: form.goalName,
      category: form.category, targetValue: Number(form.targetValue), endDate: form.endDate,
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
  const goals      = rawData.goals   || [];
  const actions    = rawData.actions || [];
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
      <div style={{ position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 50, display: 'flex', flexDirection: 'column', gap: 0, pointerEvents: 'none' }}>
        <div style={{
          writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)',
          background: C.teal, color: '#fff', fontSize: 12, fontWeight: 600,
          padding: '10px 6px', cursor: 'pointer', letterSpacing: 1,
          borderRadius: '0 4px 4px 0', pointerEvents: 'auto',
        }}>
          Invite
        </div>
        <div style={{
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
              {TOOLBAR_ICONS.map(({ title, svg }) => (
                <button key={title} title={title}
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

          {/* Add New Goal */}
          <button
            onClick={() => setShowGoalModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: C.purple, color: '#fff', border: 'none',
              borderRadius: 5, padding: '6px 14px', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
            }}
          >
            <Plus size={13} /> Add New Goal
          </button>

          <div style={{ flex: 1 }} />

          {/* Filter + column headers */}
          <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke={C.text2} strokeWidth={2} style={{ cursor: 'pointer' }}>
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
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
            <col style={{ width: 44 }} />
            <col style={{ width: 261 }} />
            <col style={{ width: 20 }} />
            <col style={{ width: 48 }} />
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
                  onChartClick={(g, ga) => setChartGoal({ goal: g, goalActions: ga })}
                />,
                ...visibleActions.map((action, ai) => (
                  <ActionRow
                    key={`a-${action.actionId || ai}`}
                    action={action}
                    themeColor={themeColor}
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
          onClose={() => setChartGoal(null)}
        />
      )}
    </div>
  );
}
