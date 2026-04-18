/**
 * Analytics — matches Vembu AnalyticsReport.js + CommonGraph.js
 * Primary company selector, optional comparison company, multi-year period selector
 * 20 financial metric charts with BAR / LINE / MULTIBAR types and formula evaluation
 */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import { Loader2, Info } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const C = {
  primary: '#0197cc',
  purple:  '#6B3FA0',
  teal:    '#0086c0',
  surface: '#FFFFFF',
  bg:      '#f4f5fa',
  border:  '#dde1e9',
  text:    '#212529',
  text2:   '#6c757d',
};

const BAR_COLORS = ['#0197cc','#6B3FA0','#00b0a0','#e67e22','#e74c3c','#2ecc71','#9b59b6'];

// ── Graph metric definitions (from Vembu AnalyticsReport.js) ─────────────────
const GRAPH_DETAILS = [
  { metric:'Total Capital',               type:'USD',     chartType:'BAR',      pattern:'940 + 668 + RB0005 + 658 + 658A + 661A' },
  { metric:'Total Income',                type:'USD',     chartType:'BAR',      pattern:'115 + 117' },
  { metric:'Interest Income',             type:'USD',     chartType:'BAR',      pattern:'115' },
  { metric:'Non-Interest Income',         type:'USD',     chartType:'BAR',      pattern:'117' },
  { metric:'Net Income',                  type:'USD',     chartType:'BAR',      pattern:'661A' },
  { metric:'Total Expenses',              type:'USD',     chartType:'BAR',      pattern:'671 + 350 + IS0017' },
  { metric:'Operating Expenses',          type:'USD',     chartType:'BAR',      pattern:'671' },
  { metric:'Total Interest Expenses',     type:'USD',     chartType:'BAR',      pattern:'350' },
  { metric:'Total Members',               type:'COUNT',   chartType:'BAR',      pattern:'083' },
  { metric:'Total Deposits',              type:'USD',     chartType:'BAR',      pattern:'SH0018' },
  { metric:'Checking/Total Deposits',     type:'PERCENT', chartType:'LINE',     pattern:'902/SH0018' },
  { metric:'Total Delinquency',           type:'USD',     chartType:'BAR',      pattern:'041B' },
  { metric:'Efficiency Ratio',            type:'PERCENT', chartType:'LINE',     pattern:'(671/(115 + 117 - 350)) * 100' },
  { metric:'Deposit Trends to Certificates', type:'PERCENT', chartType:'LINE',  pattern:'(908C/SH0018)' },
  { metric:'Loan Growth',                 type:'PERCENT', chartType:'BAR',      annualize:'AVG', pattern:'(025B1(Current) - 025B1(Prior))/025B1(Prior)*100' },
  { metric:'Yield on Loans',              type:'PERCENT', chartType:'LINE',     annualize:'AVG', pattern:'(110/025B1)*100' },
  { metric:'Loan Type by Percentage',     type:'PERCENT', chartType:'MULTIBAR', annualize:'AVG',
    pattern:['(703A/025B1)*100','((386B + 386A)/025B1)*100','(370/025B1)*100','(385/025B1)*100','(396/025B1)*100','(698C/025B1)*100','((397 + 397A)/025B1)*100'] },
  { metric:'Total Assets',                type:'USD',     chartType:'BAR',      pattern:'010' },
  { metric:'Net Worth Ratio',             type:'PERCENT', chartType:'BAR',      pattern:'(997/NW0010)*100' },
  { metric:'Net Interest Margin',         type:'PERCENT', chartType:'BAR',      annualize:'AVG', pattern:'((115-350)/010)*100' },
];

// ── Value formatter (matches Vembu's valueConvter) ────────────────────────────
function fmtValue(unit, val) {
  const v = isFinite(val) && val ? val : 0;
  if (unit === 2) { // USD
    if (Math.abs(v) >= 1e9) return `$${(v/1e9).toFixed(1)}B`;
    if (Math.abs(v) >= 1e6) return `$${(v/1e6).toFixed(1)}M`;
    if (Math.abs(v) >= 1e3) return `$${(v/1e3).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
  }
  if (unit === 0) return `${Number(v).toFixed(1)}%`; // PERCENT
  return Number.isInteger(v) ? String(v) : v.toFixed(0);               // COUNT
}

const typeUnit = (t) => t==='USD' ? 2 : t==='PERCENT' ? 0 : 1;

// ── Transform raw API rows → periodData ──────────────────────────────────────
// periodData = [{ periodDate, periodName, data:[{configAccount,configCategory,value,valueType}] }]
function buildPeriodData(rawRows) {
  const byPeriod = {};
  for (const r of rawRows) {
    const key = r.rp_peroidDate || r.rp_name || String(r.rp_peroidYear);
    if (!byPeriod[key]) byPeriod[key] = { periodDate: key, periodName: r.rp_name, data: [] };
    byPeriod[key].data.push({
      configAccount:  r.rd_rconfig_account,
      configCategory: r.rd_rconfig_category,
      value:          r.rd_value || 0,
      valueType:      r.rd_valueType,
    });
  }
  return Object.values(byPeriod).sort((a,b) => new Date(a.periodDate) - new Date(b.periodDate));
}

// ── Annualise periodData ───────────────────────────────────────────────────────
function annualise(periodData, type) {
  const yearGroups = {};
  for (const p of periodData) {
    const y = p.periodName ? p.periodName.split('-')[1] || p.periodName : String(p.periodDate).substring(0,4);
    (yearGroups[y] = yearGroups[y] || []).push(...p.data);
  }
  return Object.entries(yearGroups).map(([year, allData]) => {
    const accMap = {};
    for (const item of allData) {
      if (!accMap[item.configAccount]) accMap[item.configAccount] = { ...item, count:0, value:0 };
      accMap[item.configAccount].value += item.value;
      accMap[item.configAccount].count++;
    }
    const result = Object.values(accMap);
    if (type === 'AVG') result.forEach(r => { r.value = (r.value / r.count) * 4; });
    return { periodDate: year, periodName: year, data: result };
  });
}

// ── Safe eval formula (no real eval — uses regex substitution) ────────────────
function evalFormula(pattern, dataMap) {
  // Replace each account code with its value
  let expr = pattern.replace(/[A-Z0-9]+/gi, (match) => {
    const val = dataMap[match];
    return val !== undefined ? val : match;
  });
  try {
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + expr + ')')();
    return isFinite(result) ? result : 0;
  } catch { return 0; }
}

// ── Generate chart data points from periodData + pattern ─────────────────────
function generateData(periodData, pattern, annualizeType) {
  let pd = annualizeType ? annualise(periodData, annualizeType) : periodData;

  if (typeof pattern === 'string') {
    if (pattern.includes('Prior') || pattern.includes('Current')) {
      return pd.map((p, i) => {
        if (i === 0) return { date: p.periodDate, value: 0 };
        const cur   = pd[i].data.find(d => d.configAccount === '025B1')?.value || 0;
        const prior = pd[i-1].data.find(d => d.configAccount === '025B1')?.value || 1;
        return { date: p.periodDate, value: parseFloat((((cur - prior) / prior) * 100).toFixed(2)) };
      });
    }
    return pd.map(p => {
      const dm = {};
      p.data.forEach(d => { dm[d.configAccount] = d.value; });
      const val = evalFormula(pattern, dm);
      return { date: p.periodDate, value: parseFloat(Number(val).toFixed(2)) };
    });
  } else if (Array.isArray(pattern)) {
    return pd.map(p => {
      const dm = {};
      p.data.forEach(d => { dm[d.configAccount] = d.value; });
      const point = { date: p.periodDate };
      pattern.forEach(pat => {
        const result = evalFormula(pat, dm);
        // Extract a readable label from the pattern
        const acc = pat.match(/[A-Z0-9]+/)?.[0] || pat;
        const found = p.data.find(d => d.configAccount === acc);
        const label = found?.configCategory || acc;
        point[label] = parseFloat(Number(result).toFixed(2));
      });
      return point;
    });
  }
  return [];
}

// ── Format x-axis label ───────────────────────────────────────────────────────
function fmtDate(d, annualize) {
  if (!d) return '';
  if (annualize) return String(d).substring(0,4);
  // d is a date string like "2025-03-01T00:00:00.000Z" or "March-2025"
  if (String(d).includes('T')) {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { month:'short', year:'2-digit' });
  }
  return String(d);
}

// ── Chart components ──────────────────────────────────────────────────────────
function GraphCard({ config, rawRows, companyName }) {
  const { metric, type, chartType, annualize, pattern } = config;
  if (!rawRows || rawRows.length === 0) return null;

  const unit     = typeUnit(type);
  const periodData = buildPeriodData(rawRows);
  const chartData  = generateData(periodData, pattern, annualize);
  if (!chartData || chartData.length === 0) return null;

  const isMulti  = chartType === 'MULTIBAR';
  const multiKeys = isMulti && chartData.length > 0
    ? Object.keys(chartData[0]).filter(k => k !== 'date')
    : [];

  const CustomTick = (props) => {
    const { x, y, payload } = props;
    return (
      <text x={x} y={y} textAnchor="end" fill="#8B8B8B" fontSize={11}>
        <tspan x={x} dy="0.355em">{fmtValue(unit, payload.value)}</tspan>
      </text>
    );
  };
  const CustomXTick = (props) => {
    const { x, y, payload, index } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="end" fill="#8B8B8B" transform="rotate(-35)" fontSize={11}>
          {fmtDate(chartData[index]?.date, annualize)}
        </text>
      </g>
    );
  };
  const TT = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background:'#fff', border:'1px solid #dde', borderRadius:6, padding:'8px 12px', fontSize:12 }}>
        <div style={{ fontWeight:700, marginBottom:4 }}>
          {fmtDate(payload[0]?.payload?.date, annualize)}
        </div>
        {payload.map((p,i) => (
          <div key={i} style={{ color: p.color || C.primary }}>
            {isMulti ? `${p.name}: ${fmtValue(unit, p.value)}` : fmtValue(unit, p.value)}
          </div>
        ))}
      </div>
    );
  };

  const margin = { top:8, right:20, left:20, bottom:55 };
  const W = 440, H = 260;

  return (
    <div style={{ background:'#F8FCFF', borderRadius:10, margin:12, padding:'12px 8px',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.07)', width:'calc(50% - 24px)', boxSizing:'border-box' }}>
      <div style={{ fontSize:15, fontWeight:600, color:'#68B9DE', marginBottom:8, paddingLeft:16 }}>
        {companyName} — {metric}
      </div>
      <ResponsiveContainer width="100%" height={H}>
        {chartType === 'LINE' ? (
          <LineChart data={chartData} margin={margin}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date" tick={<CustomXTick/>} interval={0}/>
            <YAxis tick={<CustomTick/>}/>
            <Tooltip content={<TT/>}/>
            <Line type="monotone" dataKey="value" stroke={C.primary} strokeWidth={2} dot={{ r:3 }} isAnimationActive={false}/>
          </LineChart>
        ) : isMulti ? (
          <BarChart data={chartData} margin={margin}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date" tick={<CustomXTick/>} interval={0}/>
            <YAxis tick={<CustomTick/>}/>
            <Tooltip content={<TT/>}/>
            <Legend wrapperStyle={{ fontSize:11 }}/>
            {multiKeys.map((k,i) => (
              <Bar key={k} dataKey={k} fill={BAR_COLORS[i % BAR_COLORS.length]} isAnimationActive={false}/>
            ))}
          </BarChart>
        ) : (
          <BarChart data={chartData} margin={margin}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date" tick={<CustomXTick/>} interval={0}/>
            <YAxis tick={<CustomTick/>}/>
            <Tooltip content={<TT/>}/>
            <Bar dataKey="value" fill={C.primary} radius={[3,3,0,0]} isAnimationActive={false}/>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Analytics() {
  const { user, token } = useAuthStore();
  const companyId = user?.companyId;
  const tok = typeof token === 'function' ? token() : token;

  const [companies,         setCompanies]         = useState([]);
  const [primaryCompanies,  setPrimaryCompanies]  = useState([]);
  const [comparisonCompanies, setComparisonCompanies] = useState([]);
  const [periods,           setPeriods]           = useState([]);
  const [years,             setYears]             = useState([]);
  const [pCompany,          setpCompany]          = useState(null);
  const [cCompany,          setcCompany]          = useState(null);
  const [pName,             setpName]             = useState('');
  const [cName,             setcName]             = useState('');
  const [graphData,         setGraphData]         = useState(null);
  const [compGraphData,     setCompGraphData]     = useState(null);
  const [loading,           setLoading]           = useState(true);

  function http(url, data) {
    return axios.post(BASE + url, data,
      { headers: { Authorization: `Bearer ${tok}` } });
  }

  // Load companies on mount
  useEffect(() => {
    if (!companyId) return;
    (async () => {
      try {
        const r = await http('/analyticsCompany', { action:'GET', companyId });
        const list = r.data?.results || [];
        if (list.length === 0) { setLoading(false); return; }

        // Split into primary (mapped to this companyId) vs comparison
        const idx = list.findIndex(c => c.rc_primaryCompanyId === Number(companyId));
        let pri, comp;
        if (idx !== -1) {
          pri  = [list[idx]];
          comp = list.filter((_,i) => i !== idx);
        } else {
          pri  = list;
          comp = list.slice(1);
        }
        setPrimaryCompanies(pri);
        setComparisonCompanies(comp);

        const firstPri = pri[0];
        setpCompany(firstPri.rc_companyId);
        setpName(firstPri.rc_name);
        await loadPeriods(firstPri.rc_companyId);
      } catch(e) {
        console.error('Analytics load error:', e);
        setLoading(false);
      }
    })();
  }, [companyId]);

  const loadPeriods = async (rcCompanyId) => {
    const r = await http('/analyticsCompany', { action:'GETPERIOD', reportCompanyId: rcCompanyId });
    const list = r.data?.results || [];
    setPeriods(list);
    if (list.length > 0) {
      const defaultYears = list.slice(0,3).map(p => String(p.rp_peroidYear));
      setYears(defaultYears);
      // years state triggers data load via effect below
      return defaultYears;
    }
    setLoading(false);
    return [];
  };

  // Load data whenever pCompany + years change
  useEffect(() => {
    if (!pCompany || years.length === 0) return;
    (async () => {
      setLoading(true);
      try {
        const r = await http('/analyticsData', { action:'GET', companyId: pCompany, years: years.join(',') });
        const raw = r.data?.results?.[0] || [];
        setGraphData(raw);
      } catch { setGraphData(null); }
      finally { setLoading(false); }
    })();
  }, [pCompany, years]);

  const handlecCompany = async (e) => {
    const val = e.target.value ? Number(e.target.value) : null;
    const found = comparisonCompanies.find(c => c.rc_companyId === val);
    setcCompany(val);
    setcName(found?.rc_name || '');
    if (!val) { setCompGraphData(null); return; }
    try {
      const r = await http('/analyticsData', { action:'GET', companyId: val, years: years.join(',') });
      setCompGraphData(r.data?.results?.[0] || null);
    } catch { setCompGraphData(null); }
  };

  const handlePeriod = (e) => {
    const selected = [];
    for (const opt of e.target.selectedOptions) selected.push(opt.value);
    if (selected.length > 0) setYears(selected);
  };

  const handlePrimaryChange = async (e) => {
    const val = Number(e.target.value);
    const found = primaryCompanies.find(c => c.rc_companyId === val);
    setpCompany(val);
    setpName(found?.rc_name || '');
    setCompGraphData(null);
    setcCompany(null);
    const newYears = await loadPeriods(val);
    if (newYears.length > 0) setYears(newYears);
  };

  const isAdmin = Number(companyId) === 2;

  return (
    <div style={{ background:C.bg, minHeight:'100vh', padding:'0 0 40px' }}>
      {/* Header bar */}
      <div style={{ padding:'16px 24px', background:C.surface, borderBottom:`1px solid ${C.border}`,
                    display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
          {isAdmin && primaryCompanies.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <label style={{ fontSize:13, fontWeight:600, color:C.text2, marginBottom:0 }}>Primary Company:</label>
              <select value={pCompany || ''} onChange={handlePrimaryChange}
                style={{ padding:'5px 10px', border:`1px solid ${C.border}`, borderRadius:6, fontSize:13 }}>
                {primaryCompanies.map((c,i) => (
                  <option key={i} value={c.rc_companyId}>{c.rc_name}</option>
                ))}
              </select>
            </div>
          )}

          {isAdmin && comparisonCompanies.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <label style={{ fontSize:13, fontWeight:600, color:C.text2, marginBottom:0 }}>Compare With:</label>
              <select value={cCompany || ''} onChange={handlecCompany}
                style={{ padding:'5px 10px', border:`1px solid ${C.border}`, borderRadius:6, fontSize:13 }}>
                <option value="">— None —</option>
                {comparisonCompanies.map((c,i) => (
                  <option key={i} value={c.rc_companyId}>{c.rc_name}</option>
                ))}
              </select>
            </div>
          )}

          {periods.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <label style={{ fontSize:13, fontWeight:600, color:C.text2, marginBottom:0 }}>Year:</label>
              <select multiple value={years} onChange={handlePeriod}
                size={Math.min(periods.length, 5)}
                style={{ padding:'5px 8px', border:`1px solid ${C.border}`, borderRadius:6, fontSize:13,
                         minWidth:80 }}>
                {periods.map((p,i) => (
                  <option key={i} value={p.rp_peroidYear}>{p.rp_peroidYear}</option>
                ))}
              </select>
            </div>
          )}

          <a href="https://docs.google.com/document/d/15_9eL_pYlEh2ZHhq-1kLm_eNlvIj01ZrYUrMy8bhK_w/edit?usp=sharing"
            target="_blank" rel="noreferrer"
            style={{ color:C.primary, display:'flex', alignItems:'center', gap:4, fontSize:13 }}>
            <Info size={16}/> Metrics Guide
          </a>
        </div>

        <div style={{ fontSize:22, color:C.text2, fontWeight:300 }}>Analytics</div>
      </div>

      {/* Charts grid */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
          <Loader2 size={36} color={C.primary} style={{ animation:'spin 1s linear infinite' }}/>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : !graphData || graphData.length === 0 ? (
        <div style={{ textAlign:'center', padding:80 }}>
          <h2 style={{ color:C.text2 }}>No Records Found</h2>
          <p style={{ color:C.text2, fontSize:14 }}>
            Select a primary company and at least one year to view analytics.
          </p>
        </div>
      ) : (
        <div style={{ display:'flex', flexWrap:'wrap', padding:'16px 12px' }}>
          {GRAPH_DETAILS.map((cfg, i) => (
            <GraphCard key={i} config={cfg} rawRows={graphData} companyName={pName}/>
          ))}
          {compGraphData && compGraphData.length > 0 && GRAPH_DETAILS.map((cfg, i) => (
            <GraphCard key={`c${i}`} config={cfg} rawRows={compGraphData} companyName={cName}/>
          ))}
        </div>
      )}
    </div>
  );
}
