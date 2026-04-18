import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, Line, LabelList, Label,
  LineChart,
} from 'recharts';
import { Loader2, TrendingUp, Target, GitBranch, Users, Filter, ChevronRight, ChevronDown } from 'lucide-react';
import http from '../../api/client';
import useAuthStore from '../../store/authStore';

/* ── design tokens ───────────────────────────────────────────────────── */
const C = {
  primary: '#0197cc', primaryLight: '#e6f7fd',
  purple:  '#6B3FA0', success: '#00e15a', warning: '#ffa500',
  surface: '#FFFFFF', bg: '#f4f5fa', border: '#e4e7ea',
  text: '#23282c',    text2: '#73818f',
};

const token = () => localStorage.getItem('onup_token');

/* ── shared helpers ──────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{ display:'flex',justifyContent:'center',padding:60 }}>
      <Loader2 size={32} color={C.primary}
        style={{ animation:'spin 1s linear infinite' }}/>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
 *  TAB 1 — Login / Participation  (matches Vembu Reporting/index.js)
 * ════════════════════════════════════════════════════════════════════════ */
function LoginParticipationTab({ companyId }) {
  const [loginData,       setLoginData]       = useState([]);
  const [participData,    setParticipData]    = useState([]);
  const [loadingLogin,    setLoadingLogin]    = useState(true);
  const [loadingParticip, setLoadingParticip] = useState(true);

  /* filter modal state */
  const [filterOpen,  setFilterOpen]  = useState(false);
  const [filterType,  setFilterType]  = useState('login');   // 'login' | 'participation'
  const [filterBy,    setFilterBy]    = useState('DAY');
  const [entityId,    setEntityId]    = useState('');
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');

  const fetchReport = async (type, params = {}) => {
    const body = {
      _reportType: type, _entityId: params.entityId || null,
      _companyId: companyId, _startDate: params.startDate || null,
      _endDate: params.endDate || null,
      _filter1: params.filter || 'DAY', _filter2: null, _filter3: null,
    };
    try {
      const r = await http.post('/getReport', body, { headers:{ Authorization:`Bearer ${token()}` }});
      const details = r.data?.reports?.[0]?.details || [];
      return details.slice(0,30).map(v => ({
        date: new Date(v.reportDate).toLocaleDateString('en-US',{month:'short',day:'numeric'}),
        count: v.count, totalUsers: v.totalUsers,
      }));
    } catch { return []; }
  };

  useEffect(() => {
    fetchReport('LOGIN').then(d => { setLoginData(d); setLoadingLogin(false); });
    fetchReport('PARTICIPATION').then(d => { setParticipData(d); setLoadingParticip(false); });
  }, [companyId]);

  const handleSearch = () => {
    const params = { filter: filterBy, entityId, startDate, endDate };
    if (filterType === 'login') {
      setLoadingLogin(true);
      fetchReport('LOGIN', params).then(d => { setLoginData(d); setLoadingLogin(false); });
    } else {
      setLoadingParticip(true);
      fetchReport('PARTICIPATION', params).then(d => { setParticipData(d); setLoadingParticip(false); });
    }
    setFilterOpen(false);
  };

  const handleReset = () => {
    setFilterBy('DAY'); setEntityId(''); setStartDate(''); setEndDate('');
    if (filterType === 'login') {
      setLoadingLogin(true);
      fetchReport('LOGIN').then(d => { setLoginData(d); setLoadingLogin(false); });
    } else {
      setLoadingParticip(true);
      fetchReport('PARTICIPATION').then(d => { setParticipData(d); setLoadingParticip(false); });
    }
    setFilterOpen(false);
  };

  const ReportCard = ({ title, data, loading, onFilter }) => (
    <div style={{ background:C.surface, borderRadius:10, border:`1px solid ${C.border}`, marginBottom:24 }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontWeight:700, fontSize:15, color:C.text }}>{title}</span>
        <button onClick={onFilter} style={{ background:'none',border:'none',cursor:'pointer',color:C.primary }}>
          <Filter size={16}/>
        </button>
      </div>
      <div style={{ padding:'16px 8px' }}>
        {loading ? <Spinner/> : data.length === 0 ? (
          <div style={{ textAlign:'center',padding:40,color:C.text2 }}>No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top:8,right:20,left:0,bottom:20 }}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="date" tick={{ fontSize:11 }} angle={-30} textAnchor="end"/>
              <YAxis tick={{ fontSize:11 }}/>
              <Tooltip/>
              <Legend/>
              <Bar dataKey="count" name="Count" fill={C.primary} radius={[3,3,0,0]} isAnimationActive={false}/>
              <Bar dataKey="totalUsers" name="Total Users" fill={C.purple} radius={[3,3,0,0]} isAnimationActive={false}/>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <ReportCard title="Login Report"         data={loginData}    loading={loadingLogin}    onFilter={() => { setFilterType('login');         setFilterOpen(true); }}/>
      <ReportCard title="Participation Report" data={participData} loading={loadingParticip} onFilter={() => { setFilterType('participation'); setFilterOpen(true); }}/>

      {/* Filter Modal */}
      {filterOpen && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center' }}>
          <div style={{ background:C.surface,borderRadius:12,padding:28,width:500,maxWidth:'90vw' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
              <h3 style={{ margin:0,fontSize:17,fontWeight:700 }}>Filter Report</h3>
              <button onClick={() => setFilterOpen(false)} style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:C.text2 }}>×</button>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16 }}>
              <div>
                <label style={{ fontSize:13,color:C.text2,display:'block',marginBottom:4 }}>Filter By</label>
                <select value={filterBy} onChange={e=>setFilterBy(e.target.value)}
                  style={{ width:'100%',padding:'8px 10px',border:`1px solid ${C.border}`,borderRadius:6,fontSize:13 }}>
                  <option value="DAY">Day</option>
                  <option value="WEEK">Week</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:13,color:C.text2,display:'block',marginBottom:4 }}>Search By EntityId</label>
                <input type="number" value={entityId} onChange={e=>setEntityId(e.target.value)}
                  style={{ width:'100%',padding:'8px 10px',border:`1px solid ${C.border}`,borderRadius:6,fontSize:13 }}/>
              </div>
              <div>
                <label style={{ fontSize:13,color:C.text2,display:'block',marginBottom:4 }}>Start Date</label>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}
                  style={{ width:'100%',padding:'8px 10px',border:`1px solid ${C.border}`,borderRadius:6,fontSize:13 }}/>
              </div>
              <div>
                <label style={{ fontSize:13,color:C.text2,display:'block',marginBottom:4 }}>End Date</label>
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}
                  style={{ width:'100%',padding:'8px 10px',border:`1px solid ${C.border}`,borderRadius:6,fontSize:13 }}/>
              </div>
            </div>
            <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
              <button onClick={handleReset}
                style={{ padding:'8px 20px',background:'#f8f9fa',border:`1px solid ${C.border}`,borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:13 }}>Reset</button>
              <button onClick={handleSearch}
                style={{ padding:'8px 20px',background:C.primary,border:'none',borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:13,color:'#fff' }}>Search</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
 *  TAB 2 — Goal Plan Report  (matches Vembu GoalplanReport.js)
 * ════════════════════════════════════════════════════════════════════════ */
function GoalPlanReportTab({ companyId, entityId }) {
  const [plans,    setPlans]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [progress, setProgress] = useState({}); // { [growthPlanId]: { type, data } }
  const [types,    setTypes]    = useState({});  // { [growthPlanId]: 'WEEK'|'MONTH' }

  useEffect(() => {
    http.post('/getGrowthPlansByEntity', { entityId, companyId, securityToken:2 },
      { headers:{ Authorization:`Bearer ${token()}` }})
      .then(r => {
        const list = r.data?.growthPlans || r.data?.plans || r.data || [];
        const raw = Array.isArray(list) ? list : [];
        // Show active (Open) plans, or if none, show all — limit to 20 to avoid overloading
        const active = raw.filter(p => p.statusId === 1 || p.status === 'Open');
        const arr = (active.length > 0 ? active : raw).slice(0, 20);
        setPlans(arr);
        arr.forEach(p => {
          const id = p.growthPlanId;
          setTypes(t => ({ ...t, [id]:'WEEK' }));
          // teamId = growthPlanId as string (matches how goalPlanReport SP uses it)
          fetchGoalReport(id, String(id), 'WEEK');
        });
      })
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, [entityId, companyId]);

  const fetchGoalReport = async (planId, teamId, type) => {
    try {
      const r = await http.post('/goalPlanReport',
        { action: type, teamId },
        { headers:{ Authorization:`Bearer ${token()}` }});
      const rows = r.data?.results || [];
      const grouped = rows.reduce((acc, item) => {
        (acc[item.goalTagId] = acc[item.goalTagId] || []).push(item);
        return acc;
      }, {});
      setProgress(p => ({ ...p, [planId]: grouped }));
    } catch {}
  };

  if (loading) return <Spinner/>;
  if (!plans.length) return <div style={{ textAlign:'center',padding:40,color:C.text2 }}>No plans found</div>;

  return (
    <div>
      {plans.map(plan => {
        const pid = plan.growthPlanId;
        const color = plan.colorCodeHex ? `#${plan.colorCodeHex.replace('#','')}` : C.primary;
        const type  = types[pid] || 'WEEK';
        const prog  = progress[pid] || {};
        const goals = plan.goalList || [];
        const dueDate = plan.milestoneDate && plan.milestoneDate !== '0000-00-00'
          ? new Date(plan.milestoneDate).toLocaleDateString('en-US') : '';

        return (
          <div key={pid} style={{ background:C.surface,borderRadius:10,border:`1px solid ${C.border}`,marginBottom:20,overflow:'hidden' }}>
            {/* Plan header */}
            <div style={{ padding:'14px 20px',borderBottom:`1px solid ${C.border}` }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                <h3 style={{ margin:0,fontSize:18,fontWeight:700,color }}>{plan.name || plan.growthPlanName}</h3>
                <select value={type} onChange={e => {
                    const t = e.target.value;
                    setTypes(prev => ({ ...prev, [pid]:t }));
                    fetchGoalReport(pid, String(pid), t);
                  }}
                  style={{ padding:'5px 10px',border:`1px solid ${C.border}`,borderRadius:6,fontSize:13 }}>
                  <option value="WEEK">WEEK</option>
                  <option value="MONTH">MONTH</option>
                </select>
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:24 }}>
                {dueDate && (
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <span style={{ fontSize:13,color:C.text2 }}>Due Date</span>
                    <span style={{ background:color,color:'#fff',borderRadius:4,padding:'2px 10px',fontSize:12,fontWeight:600 }}>{dueDate}</span>
                  </div>
                )}
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <span style={{ fontSize:13,color:C.text2 }}>Owner:</span>
                  <span style={{ fontSize:13,fontWeight:600 }}>{plan.firstName} {plan.lastName}</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <div style={{ flex:1,height:12,background:'#eee',borderRadius:6,overflow:'hidden' }}>
                      <div style={{ width:`${plan.growthPlanPercentAchieved||0}%`,height:'100%',background:color,borderRadius:6 }}/>
                    </div>
                    <span style={{ fontSize:13,fontWeight:700,color }}>{plan.growthPlanPercentAchieved||0}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Goals table */}
            {goals.length > 0 && (
              <table style={{ width:'100%',borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f8f9fa' }}>
                    <th style={{ width:6,padding:0 }}/>
                    <th style={{ padding:'10px 16px',textAlign:'left',fontSize:13,fontWeight:700,color:C.text2 }}>Goal</th>
                    <th style={{ padding:'10px 16px',textAlign:'left',fontSize:13,fontWeight:700,color:C.text2 }}>Goal Due Date</th>
                    <th style={{ padding:'10px 16px',textAlign:'left',fontSize:13,fontWeight:700,color:C.text2,width:'40%' }}>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map((goal, gi) => {
                    const goalProg = prog[goal.goalTagId];
                    const goalDue  = goal.goalMilestoneDate && goal.goalMilestoneDate !== '0000-00-00'
                      ? new Date(goal.goalMilestoneDate).toLocaleDateString('en-US') : '';
                    return (
                      <tr key={gi} style={{ borderTop:`1px solid ${C.border}` }}>
                        <td style={{ background:color, width:6, padding:0 }}/>
                        <td style={{ padding:'10px 16px',fontSize:13 }}>
                          <span style={{ background:color,color:'#fff',padding:'2px 8px',borderRadius:3,fontSize:12 }}>
                            {goal.goalName}
                          </span>
                        </td>
                        <td style={{ padding:'10px 16px',fontSize:13,color:C.text2 }}>{goalDue}</td>
                        <td style={{ padding:'10px 16px' }}>
                          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                            <div style={{ flex:1,height:16,background:'#eee',borderRadius:3,overflow:'hidden',display:'flex' }}>
                              {goalProg ? goalProg.map((seg,si) => (
                                <div key={si} title={`${type==='WEEK'?'Week':'Month'} ${si+1}: ${seg.percentage?.toFixed?.(0)||0}%`}
                                  style={{ width:`${seg.percentage||0}%`,background:si%2===0?color:'#27ae60',height:'100%' }}/>
                              )) : (
                                <div style={{ width:`${goal.goalPercentAchieved||0}%`,background:color,height:'100%' }}/>
                              )}
                            </div>
                            <span style={{ fontSize:13,fontWeight:700,minWidth:36 }}>{goal.goalPercentAchieved||0}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
 *  TAB 3 — Plan Tree  (matches Vembu goalTree.js — collapsible nested)
 * ════════════════════════════════════════════════════════════════════════ */
function TreeNode({ node, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2);
  const color = node.bgColor ? `#${node.bgColor.replace('#','')}` : C.primary;
  const hasChildren = node.children && node.children.length > 0;

  const nodeStyle = {
    display:'inline-flex', alignItems:'center', gap:6,
    padding:'5px 12px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer',
    ...(node.type === 'plan'   ? { background:'#f0f0f0', border:`1px solid ${color}`, color:C.text } : {}),
    ...(node.type === 'goal'   ? { background:color, color:'#fff' } : {}),
    ...(node.type === 'action' ? { background:'#fff', border:`1px solid ${color}`, color } : {}),
  };

  return (
    <div style={{ marginLeft: depth * 24, marginBottom:6 }}>
      <div style={{ display:'flex',alignItems:'center',gap:6 }}>
        {hasChildren ? (
          <button onClick={() => setOpen(o => !o)}
            style={{ background:'none',border:'none',cursor:'pointer',padding:0,color:C.text2,display:'flex' }}>
            {open ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
          </button>
        ) : <span style={{ width:14 }}/>}
        <div style={nodeStyle}>{node.name}</div>
      </div>
      {open && hasChildren && (
        <div style={{ marginTop:4 }}>
          {node.children.map((child, i) => (
            <TreeNode key={i} node={child} depth={depth+1}/>
          ))}
        </div>
      )}
    </div>
  );
}

function buildTree(rows, growthPlanId) {
  if (!rows || rows.length === 0) return null;

  // Group by teamId
  const byTeam = rows.reduce((acc, r) => {
    (acc[r.teamId] = acc[r.teamId] || []).push(r);
    return acc;
  }, {});

  const buildGoals = (teamRows) => {
    const seen = {};
    return (teamRows || []).reduce((acc, r) => {
      if (r.goalTagId && !seen[r.goalTagId]) {
        seen[r.goalTagId] = true;
        const goalNode = {
          name: r.goalName, type: 'goal', bgColor: r.bgColor,
          children: buildActions(teamRows, r.goalTagId),
        };
        acc.push(goalNode);
      }
      return acc;
    }, []);
  };

  const buildActions = (teamRows, goalTagId) => {
    const seen = {};
    return (teamRows || []).filter(r => r.goalTagId === goalTagId && r.actionTagId).reduce((acc, r) => {
      if (!seen[r.actionTagId]) {
        seen[r.actionTagId] = true;
        const contributor = (r.firstName || r.lastName) ? ` (${r.firstName} ${r.lastName})` : '';
        const actionNode = {
          name: `${r.actionName}${contributor}`, type:'action', bgColor: r.bgColor,
          children: r.childTeamId ? buildGoals(byTeam[r.childTeamId] || []) : [],
        };
        acc.push(actionNode);
      }
      return acc;
    }, []);
  };

  const planRow = rows.find(r => r.growthPlanId === growthPlanId) || rows[0];
  const owner = (planRow.ownerFirstName || planRow.ownerLastName)
    ? ` (${planRow.ownerFirstName} ${planRow.ownerLastName})` : '';

  return {
    name: `${planRow.name}${owner}`, type:'plan', bgColor: planRow.bgColor,
    children: buildGoals(byTeam[planRow.teamId] || []),
  };
}

function PlanTreeTab({ companyId, entityId }) {
  const [plans,       setPlans]       = useState([]);
  const [selectedPlan,setSelectedPlan]= useState('');
  const [treeData,    setTreeData]    = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [loadingPlans,setLoadingPlans]= useState(true);
  const [zoom,        setZoom]        = useState(1);

  useEffect(() => {
    http.post('/getGrowthPlansByEntity', { entityId, companyId, securityToken:2 },
      { headers:{ Authorization:`Bearer ${token()}` }})
      .then(r => {
        const list = r.data?.growthPlans || r.data?.plans || r.data || [];
        const raw = Array.isArray(list) ? list : [];
        const active = raw.filter(p => p.statusId === 1 || p.status === 'Open');
        setPlans(active.length > 0 ? active : raw);
      })
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
  }, [entityId, companyId]);

  const loadTree = async (growthPlanId) => {
    setSelectedPlan(growthPlanId);
    setLoading(true);
    try {
      const r = await http.post('/goaltreeStructure', { growthPlanId },
        { headers:{ Authorization:`Bearer ${token()}` }});
      const rows = r.data?.results || [];
      setTreeData(buildTree(rows, Number(growthPlanId)));
    } catch { setTreeData(null); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ background:C.surface, borderRadius:10, border:`1px solid ${C.border}`, padding:20 }}>
      <div style={{ display:'flex',alignItems:'center',gap:16,marginBottom:20 }}>
        <select value={selectedPlan} onChange={e => loadTree(e.target.value)}
          style={{ padding:'8px 14px',border:`1px solid ${C.border}`,borderRadius:6,fontSize:13,minWidth:260 }}>
          <option value="">— Select a Plan —</option>
          {plans.map(p => (
            <option key={p.growthPlanId} value={p.growthPlanId}>{p.name || p.growthPlanName}</option>
          ))}
        </select>
        {treeData && (
          <div style={{ display:'flex',gap:8 }}>
            <button onClick={() => setZoom(z => Math.min(z+0.25, 2))}
              style={{ padding:'6px 12px',background:C.primaryLight,border:'none',borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:16 }}>+</button>
            <button onClick={() => setZoom(z => Math.max(z-0.25, 0.5))}
              style={{ padding:'6px 12px',background:C.primaryLight,border:'none',borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:16 }}>−</button>
            <span style={{ alignSelf:'center',fontSize:13,color:C.text2 }}>{Math.round(zoom*100)}%</span>
          </div>
        )}
      </div>
      {loadingPlans ? <Spinner/> : loading ? <Spinner/> : !treeData ? (
        <div style={{ textAlign:'center',padding:40,color:C.text2 }}>Select a plan to view its tree</div>
      ) : (
        <div style={{ overflowX:'auto', padding:16 }}>
          <div style={{ transform:`scale(${zoom})`, transformOrigin:'top left', transition:'transform .2s' }}>
            <TreeNode node={treeData} depth={0}/>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
 *  TAB 4 — All Users  (matches Vembu AllUsersReport.js)
 * ════════════════════════════════════════════════════════════════════════ */
function AllUsersTab({ companyId, entityId }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Get entity users
        const r = await http.post('/getEntityUsers', { companyId },
          { headers:{ Authorization:`Bearer ${token()}` }});
        const users = r.data?.EntityUser || [];

        // Get productivity data
        const r2 = await http.post('/overallReport',
          { action:'GETALLUSER', entityId },
          { headers:{ Authorization:`Bearer ${token()}` }});
        const overallRows = r2.data?.results || [];

        // Group by entityId
        const grouped = overallRows.reduce((acc, item) => {
          const d = new Date(item.weekEndDate);
          const label = d.toLocaleDateString('en-US');
          (acc[item.entityId] = acc[item.entityId] || []).push({ ...item, weekEndDate: label });
          return acc;
        }, {});

        // Merge
        const merged = users.map(u => ({
          ...u,
          productivity: grouped[u.entityId] || null,
        })).sort((a, b) => {
          const sum = arr => (arr||[]).reduce((s,v) => s + (v.activityCount||0), 0);
          return sum(b.productivity) - sum(a.productivity);
        });
        setData(merged);
      } catch { setData([]); }
      finally { setLoading(false); }
    };
    load();
  }, [companyId, entityId]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background:'#fff',border:`1px solid ${C.border}`,borderRadius:6,padding:'8px 14px',fontSize:12 }}>
          <div style={{ fontWeight:700,marginBottom:4 }}>{label}</div>
          <div>Contribution: {payload[0]?.value}%</div>
          <div>Activity: {payload[1]?.value}</div>
        </div>
      );
    }
    return null;
  };

  const renderLabel = (props) => {
    const { x, y, width, value } = props;
    return (
      <text x={x+width/2} y={y-8} fill="#000" textAnchor="middle" fontSize={11}>
        {value}%
      </text>
    );
  };

  if (loading) return <Spinner/>;
  if (!data.length) return <div style={{ textAlign:'center',padding:40,color:C.text2 }}>No users found</div>;

  return (
    <div style={{ background:'#dae3f0', borderRadius:10, padding:12 }}>
      {data.map((user, i) => (
        <div key={i} style={{ background:C.surface, borderRadius:8, marginBottom:12, padding:16, borderBottom:`2px solid ${C.primary}` }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:'blue' }}>
              {user.firstName} {user.lastName}
            </h3>
            {user.productivity ? (
              <ResponsiveContainer width="70%" height={200}>
                <ComposedChart data={user.productivity} margin={{ top:42,right:30,left:20,bottom:20 }}>
                  <XAxis dataKey="weekEndDate" tick={{ fontSize:10 }}
                    label={{ value:'Week Ending', position:'bottom', offset:0, fontSize:11 }}/>
                  <YAxis yAxisId="left" domain={[0,100]} tick={{ fontSize:10 }}>
                    <Label value="% Contribution" angle={-90} position="insideBottomLeft" fontSize={11}/>
                  </YAxis>
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10 }}>
                    <Label value="Activity Count" angle={-90} position="insideTopRight" fontSize={11}/>
                  </YAxis>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar yAxisId="left" dataKey="percentage" fill={C.primary} radius={[4,4,0,0]} isAnimationActive={false}>
                    <LabelList dataKey="percentage" content={renderLabel}/>
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="activityCount" stroke="red" strokeWidth={3} isAnimationActive={false}/>
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <span style={{ fontSize:13,color:C.text2 }}>No productivity data</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
 *  Main Reporting component
 * ════════════════════════════════════════════════════════════════════════ */
export default function Reporting() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const entityId  = user?.entityId;
  const [tab, setTab] = useState('login');

  const tabs = [
    { id:'login',    label:'Login / Participation', icon:TrendingUp },
    { id:'goalplan', label:'Goal Plan Report',       icon:Target },
    { id:'tree',     label:'Plan Tree',              icon:GitBranch },
    { id:'allusers', label:'All Users',              icon:Users },
  ];

  return (
    <div style={{ padding:28, maxWidth:1200, margin:'0 auto', background:C.bg, minHeight:'100vh' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ margin:0,fontSize:22,fontWeight:700,color:C.text }}>Reporting</h1>
        <p style={{ margin:'4px 0 0',color:C.text2,fontSize:14 }}>Platform usage and growth plan reports</p>
      </div>

      {/* Tab nav */}
      <div style={{ display:'flex',borderBottom:`2px solid ${C.border}`,marginBottom:24,background:C.surface,borderRadius:'10px 10px 0 0',overflow:'hidden' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              display:'flex',alignItems:'center',gap:7,
              padding:'12px 20px',border:'none',background:'transparent',cursor:'pointer',
              fontSize:13,fontWeight:tab===id?700:400,
              color:tab===id?C.primary:C.text2,
              borderBottom:tab===id?`2px solid ${C.primary}`:'2px solid transparent',
              marginBottom:-2,transition:'color .15s',
            }}>
            <Icon size={14}/>{label}
          </button>
        ))}
      </div>

      {tab==='login'    && <LoginParticipationTab companyId={companyId}/>}
      {tab==='goalplan' && <GoalPlanReportTab companyId={companyId} entityId={entityId}/>}
      {tab==='tree'     && <PlanTreeTab companyId={companyId} entityId={entityId}/>}
      {tab==='allusers' && <AllUsersTab companyId={companyId} entityId={entityId}/>}
    </div>
  );
}
