import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, BookOpen, Clock, Save, Loader2 } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import * as api from '../../api/client';
import useAuthStore from '../../store/authStore';

const C = {
  primary: '#0197cc',
  primaryLight: '#e6f7fd',
  surface: '#FFFFFF',
  bg: '#F8FAFC',
  border: '#E2E8F0',
  text: '#0F172A',
  text2: '#64748B',
};

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function ThoughtPad() {
  const { user } = useAuthStore();
  const entityId = user?.entityId;
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { data: thoughts = [], isLoading } = useQuery({
    queryKey: ['thoughtpad', entityId],
    queryFn: () => api.getThoughtpad({ entityId }),
    select: (res) => res.data?.thoughts || res.data?.result || [],
    enabled: !!entityId,
  });

  const selectedThought = thoughts.find(t => t.thoughtId === selectedId || t.id === selectedId);

  const updateMutation = useMutation({
    mutationFn: (data) => api.updateThoughtpad(data),
    onSuccess: () => {
      toast.success('Saved!', { autoClose: 1500 });
      queryClient.invalidateQueries(['thoughtpad']);
      setIsDirty(false);
    },
    onError: () => toast.error('Failed to save'),
  });

  const addThoughtMutation = useMutation({
    mutationFn: () => api.updateThoughtpad({
      entityId,
      action: 'ADD',
      thoughtTitle: newTitle,
      thoughtContent: '',
    }),
    onSuccess: (res) => {
      toast.success('Thought added!');
      queryClient.invalidateQueries(['thoughtpad']);
      setIsAdding(false);
      setNewTitle('');
      const newId = res.data?.thoughtId || res.data?.id;
      if (newId) setSelectedId(newId);
    },
    onError: () => toast.error('Failed to create thought'),
  });

  const handleSelect = (thought) => {
    if (isDirty && selectedThought) {
      handleSave();
    }
    const id = thought.thoughtId || thought.id;
    setSelectedId(id);
    setEditorContent(thought.thoughtContent || thought.content || '');
    setIsDirty(false);
  };

  const handleEditorChange = (val) => {
    setEditorContent(val);
    setIsDirty(true);
  };

  const handleSave = useCallback(() => {
    if (!selectedThought) return;
    updateMutation.mutate({
      entityId,
      action: 'UPDATE',
      thoughtId: selectedThought.thoughtId || selectedThought.id,
      thoughtContent: editorContent,
    });
  }, [selectedThought, editorContent, entityId]);

  const handleBlur = () => {
    if (isDirty && selectedThought) {
      handleSave();
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: C.bg }}>
      {/* Left sidebar */}
      <div style={{
        width: 280,
        minWidth: 280,
        background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={18} color={C.primary} />
            <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>ThoughtPad</span>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            style={{ background: C.primary, border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#fff' }}
          >
            <Plus size={16} />
          </button>
        </div>

        {isAdding && (
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: C.primaryLight }}>
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Thought title…"
              onKeyDown={e => {
                if (e.key === 'Enter' && newTitle.trim()) addThoughtMutation.mutate();
                if (e.key === 'Escape') setIsAdding(false);
              }}
              style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.primary}`, borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => newTitle.trim() && addThoughtMutation.mutate()}
                disabled={addThoughtMutation.isPending}
                style={{ flex: 1, padding: '6px', background: C.primary, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                {addThoughtMutation.isPending ? '…' : 'Add'}
              </button>
              <button onClick={() => { setIsAdding(false); setNewTitle(''); }} style={{ flex: 1, padding: '6px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
              <Loader2 size={20} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}
          {!isLoading && thoughts.length === 0 && (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: C.text2, fontSize: 13 }}>
              No thoughts yet. Click + to add one.
            </div>
          )}
          {thoughts.map((t, i) => {
            const id = t.thoughtId || t.id;
            const isSelected = id === selectedId;
            return (
              <div
                key={i}
                onClick={() => handleSelect(t)}
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  background: isSelected ? C.primaryLight : 'transparent',
                  borderLeft: isSelected ? `3px solid ${C.primary}` : '3px solid transparent',
                  borderBottom: `1px solid ${C.border}`,
                  transition: 'all 0.1s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ fontWeight: isSelected ? 600 : 500, fontSize: 14, color: isSelected ? C.primary : C.text, marginBottom: 4 }}>
                  {t.thoughtTitle || t.title || 'Untitled'}
                </div>
                {t.createdOn && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.text2 }}>
                    <Clock size={10} />
                    {new Date(t.createdOn).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selectedThought ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text2 }}>
            <div style={{ textAlign: 'center' }}>
              <BookOpen size={48} style={{ color: '#CBD5E1', marginBottom: 16 }} />
              <p style={{ margin: 0, fontSize: 15 }}>Select a thought to edit, or click + to create one.</p>
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>
                  {selectedThought.thoughtTitle || selectedThought.title || 'Untitled'}
                </h2>
                {selectedThought.createdOn && (
                  <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>
                    {new Date(selectedThought.createdOn).toLocaleString()}
                  </div>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending || !isDirty}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  background: isDirty ? C.primary : '#E2E8F0',
                  color: isDirty ? '#fff' : C.text2,
                  border: 'none',
                  borderRadius: 8,
                  cursor: isDirty ? 'pointer' : 'default',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.15s',
                }}
              >
                <Save size={14} />
                {updateMutation.isPending ? 'Saving…' : isDirty ? 'Save' : 'Saved'}
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
              <ReactQuill
                value={editorContent}
                onChange={handleEditorChange}
                onBlur={handleBlur}
                placeholder="Start writing your thoughts here…"
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['blockquote', 'code-block'],
                    ['link'],
                    ['clean'],
                  ],
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
