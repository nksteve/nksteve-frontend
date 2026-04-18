/**
 * ThoughtPad — matches Vembu's ThoughtPadMenu / ThoughtPadList / ThoughtPadEditor
 * Left panel: list of thoughts with delete confirm modal
 * Right panel: title input + rich text editor (ReactQuill) + Save button
 */
import { useState, useEffect, useRef } from 'react';
import { Loader2, Plus, Trash2, BookOpen, Save, Search } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import axios from 'axios';
import useAuthStore from '../../store/authStore';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const C = {
  primary:  '#0197cc',
  purple:   '#6B3FA0',
  surface:  '#FFFFFF',
  bg:       '#f4f5fa',
  border:   '#dde1e9',
  text:     '#212529',
  text2:    '#6c757d',
  danger:   '#dc3545',
};

function http(method, url, data, token) {
  return axios({ method, url: BASE + url, data,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
}

function Spinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
      <Loader2 size={28} color={C.primary} style={{ animation:'spin 1s linear infinite' }}/>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function ThoughtPad() {
  const { user, token } = useAuthStore();
  const entityId = user?.entityId;
  const tok = typeof token === 'function' ? token() : token;

  const [thoughts,      setThoughts]    = useState([]);
  const [loading,       setLoading]     = useState(true);
  const [selectedIdx,   setSelectedIdx] = useState(null);  // index into thoughts[]
  const [title,         setTitle]       = useState('');
  const [content,       setContent]     = useState('');
  const [saving,        setSaving]      = useState(false);
  const [delConfirm,    setDelConfirm]  = useState(null);  // thoughtId to delete
  const [validMsg,      setValidMsg]    = useState('');
  const [search,        setSearch]      = useState('');
  const [isAdding,      setIsAdding]    = useState(false); // true = new thought mode
  const contentRef = useRef(content);
  contentRef.current = content;

  // ── Load ───────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const r = await http('POST', '/getThoughtpads', { entityId }, tok);
      const list = r.data?.thoughtPad || r.data?.thoughtpads || [];
      setThoughts(Array.isArray(list) ? list : []);
    } catch { setThoughts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (entityId) load(); }, [entityId]);

  // ── Select a thought ───────────────────────────────────────────────────
  const select = (idx) => {
    setSelectedIdx(idx);
    setIsAdding(false);
    setValidMsg('');
    const t = thoughts[idx];
    setTitle(t?.title || '');
    setContent(t?.thought || '');
  };

  // ── New thought ────────────────────────────────────────────────────────
  const startNew = () => {
    setIsAdding(true);
    setSelectedIdx(null);
    setTitle('');
    setContent('');
    setValidMsg('');
  };

  // ── Save (insert or update) ────────────────────────────────────────────
  const save = async () => {
    if (!title.trim()) { setValidMsg('Please provide title'); return; }
    const contentStr = contentRef.current;
    if (contentStr && contentStr.replace(/<[^>]*>/g, '').trim().length > 4999) {
      alert('Value should not exceed 5000 characters'); return;
    }
    setSaving(true);
    setValidMsg('');
    try {
      let r;
      if (isAdding) {
        // INSERT — Vembu calls /insertThoughtpad
        r = await http('POST', '/insertThoughtpad', { entityId, title, thought: contentStr }, tok);
      } else {
        // UPDATE — Vembu calls /insertThoughtpad with thoughtId set
        const thoughtId = thoughts[selectedIdx]?.thoughtId;
        r = await http('POST', '/insertThoughtpad', { entityId, title, thought: contentStr, thoughtId }, tok);
      }
      const updated = r.data?.thoughtPad || r.data?.thoughtpads || [];
      setThoughts(Array.isArray(updated) ? updated : []);
      setIsAdding(false);
      // Re-select the just-saved item (first match by title)
      const newList = Array.isArray(updated) ? updated : [];
      const newIdx  = newList.findIndex(t => t.title === title);
      if (newIdx >= 0) { setSelectedIdx(newIdx); setContent(newList[newIdx]?.thought || ''); }
    } catch { alert('Failed to save'); }
    finally { setSaving(false); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const confirmDelete = (thoughtId) => setDelConfirm(thoughtId);
  const doDelete = async () => {
    try {
      const r = await http('POST', '/deleteThoughtpad', { entityId, thoughtId: delConfirm }, tok);
      const updated = r.data?.thoughtPad || r.data?.thoughtpads || [];
      setThoughts(Array.isArray(updated) ? updated : []);
      setDelConfirm(null);
      setSelectedIdx(null);
      setTitle('');
      setContent('');
    } catch { alert('Failed to delete'); }
  };

  // ── Filtered list ──────────────────────────────────────────────────────
  const filtered = thoughts.filter(t =>
    !search || (t.title || '').toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US') : '';

  // Decode HTML entities for plain-text preview
  const stripHtml = (html) => {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  };

  return (
    <div style={{ display:'flex', height:'calc(100vh - 56px)', background:C.bg }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        width:300, minWidth:300, background:C.surface,
        borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column',
      }}>
        {/* Header */}
        <div style={{ padding:'16px 16px 12px', borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <BookOpen size={17} color={C.primary}/>
              <span style={{ fontWeight:700, fontSize:16, color:C.text }}>Thought Pad</span>
            </div>
            <button onClick={startNew}
              style={{ background:C.primary, border:'none', borderRadius:6,
                       padding:'5px 10px', cursor:'pointer', color:'#fff',
                       display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:600 }}>
              <Plus size={13}/> Add
            </button>
          </div>
          {/* Search */}
          <div style={{ position:'relative' }}>
            <Search size={13} color={C.text2}
              style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)' }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search..."
              style={{ width:'100%', padding:'6px 8px 6px 28px', border:`1px solid ${C.border}`,
                       borderRadius:6, fontSize:13, outline:'none', boxSizing:'border-box' }}/>
          </div>
        </div>

        {/* List */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading && <Spinner/>}
          {!loading && filtered.length === 0 && (
            <div style={{ padding:'32px 16px', textAlign:'center', color:C.text2, fontSize:13 }}>
              No thoughts yet. Click Add to create one.
            </div>
          )}
          {filtered.map((t, i) => {
            const isSelected = !isAdding && thoughts[selectedIdx]?.thoughtId === t.thoughtId;
            return (
              <div key={t.thoughtId || i} onClick={() => select(thoughts.indexOf(t))}
                style={{
                  padding:'12px 16px', cursor:'pointer', borderBottom:`1px solid ${C.border}`,
                  background: isSelected ? '#e8f4fd' : 'transparent',
                  borderLeft: isSelected ? `3px solid ${C.primary}` : '3px solid transparent',
                  transition:'background .1s',
                }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <h5 style={{ margin:'0 0 4px', fontSize:14, fontWeight:isSelected?700:500,
                               color: isSelected ? C.primary : C.text, flex:1,
                               whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {t.title || 'Untitled'}
                  </h5>
                  <span onClick={e => { e.stopPropagation(); confirmDelete(t.thoughtId); }}
                    style={{ color:C.danger, cursor:'pointer', marginLeft:8, flexShrink:0 }}>
                    <Trash2 size={14}/>
                  </span>
                </div>
                {/* Preview (strip HTML) */}
                <div style={{ fontSize:12, color:C.text2, marginBottom:4,
                              overflow:'hidden', maxHeight:36,
                              display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                  {stripHtml(t.thought || '').substring(0, 80)}
                </div>
                <small style={{ color:C.text2, fontSize:11 }}>{fmt(t.created || t.lastUpdated)}</small>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT PANEL (Editor) ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:C.surface }}>
        {(!isAdding && selectedIdx === null) ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:C.text2 }}>
            <div style={{ textAlign:'center' }}>
              <BookOpen size={52} style={{ color:'#CBD5E1', marginBottom:16 }}/>
              <p style={{ margin:0, fontSize:15 }}>Select a thought to edit, or click Add to create one.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Title bar */}
            <div style={{ padding:'16px 24px', borderBottom:`1px solid ${C.border}` }}>
              <input type="text" value={title} onChange={e=>{ setTitle(e.target.value); setValidMsg(''); }}
                placeholder="Title"
                style={{
                  width:'75%', padding:'8px 12px', fontSize:15, fontWeight:600,
                  border:`1px solid ${C.border}`, borderRadius:6, outline:'none',
                  boxSizing:'border-box',
                }}/>
            </div>

            {/* Rich text editor */}
            <div style={{ flex:1, overflow:'auto', padding:'0' }}>
              <ReactQuill
                value={content}
                onChange={val => setContent(val)}
                placeholder="Start writing your thoughts here…"
                style={{ height:'calc(100% - 42px)' }}
                modules={{
                  toolbar: [
                    [{ header:[1,2,3,false] }],
                    ['bold','italic','underline','strike'],
                    [{ list:'ordered' }, { list:'bullet' }],
                    ['blockquote','code-block'],
                    ['link'],
                    ['clean'],
                  ],
                }}
              />
            </div>

            {/* Footer: save button + validation msg */}
            <div style={{ padding:'12px 24px', borderTop:`1px solid ${C.border}`,
                          display:'flex', alignItems:'center', gap:12, background:C.bg }}>
              <button onClick={save} disabled={saving}
                style={{
                  padding:'8px 22px', background:C.primary, color:'#fff',
                  border:'none', borderRadius:6, cursor:'pointer',
                  fontWeight:600, fontSize:14, opacity: saving ? 0.7 : 1,
                }}>
                {saving ? 'Saving…' : (isAdding ? 'Add' : 'Save')}
              </button>
              {validMsg && (
                <span style={{ color:C.primary, fontSize:13, fontWeight:600 }}>
                  {validMsg}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Delete Confirm Modal ── */}
      {delConfirm && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
          zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{ background:C.surface, borderRadius:10, padding:28, width:380, maxWidth:'90vw', boxShadow:'0 8px 32px rgba(0,0,0,0.18)' }}>
            <h5 style={{ margin:'0 0 12px', fontSize:16, fontWeight:700 }}>Info</h5>
            <p style={{ textAlign:'center', margin:'0 0 20px', color:C.text }}>
              Are you sure you want to delete this thought?
            </p>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <span onClick={() => setDelConfirm(null)}
                style={{ cursor:'pointer', color:C.text2, padding:'7px 14px', fontSize:14 }}>
                Cancel
              </span>
              <button onClick={doDelete}
                style={{ padding:'7px 18px', background:C.primary, color:'#fff',
                         border:'none', borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:14 }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
