import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { GraduationCap, Plus, Trash2, X, Play, Loader2 } from 'lucide-react';
import * as api from '../../../api/client';
import useAuthStore from '../../../store/authStore';

const C = {
  primary: '#0197cc',
  primaryLight: '#e6f7fd',
  danger: '#EF4444',
  surface: '#FFFFFF',
  bg: '#F8FAFC',
  border: '#E2E8F0',
  text: '#0F172A',
  text2: '#64748B',
};

function getVideoEmbedUrl(url) {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function Training() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ trainingName: '', category: '', videoUrl: '', thumbnailUrl: '' });

  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ['training', companyId],
    queryFn: () => api.getTraining({ action: 'GET', companyId }),
    select: (res) => res.data?.training || res.data?.result || [],
    enabled: !!companyId,
  });

  const addMutation = useMutation({
    mutationFn: () => api.getTraining({ action: 'ADD', companyId, ...form }),
    onSuccess: () => {
      toast.success('Training added!');
      queryClient.invalidateQueries(['training']);
      setShowModal(false);
      setForm({ trainingName: '', category: '', videoUrl: '', thumbnailUrl: '' });
    },
    onError: () => toast.error('Failed to add training'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteTraining({ trainingId: id, companyId }),
    onSuccess: () => {
      toast.success('Training deleted');
      queryClient.invalidateQueries(['training']);
    },
    onError: () => toast.error('Failed to delete training'),
  });

  // Get categories
  const categories = ['ALL', ...Array.from(new Set(trainings.map(t => t.category || t.trainingCategory).filter(Boolean)))];
  const displayed = activeCategory === 'ALL' ? trainings : trainings.filter(t => (t.category || t.trainingCategory) === activeCategory);

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <GraduationCap size={28} color={C.primary} />
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.text }}>Training</h1>
            <p style={{ margin: '2px 0 0', color: C.text2, fontSize: 14 }}>{trainings.length} training resources</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus size={16} /> Add Training
        </button>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, marginBottom: 24 }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '8px 16px',
              background: activeCategory === cat ? C.primary : C.surface,
              color: activeCategory === cat ? '#fff' : C.text2,
              border: `1px solid ${activeCategory === cat ? C.primary : C.border}`,
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeCategory === cat ? 600 : 400,
              whiteSpace: 'nowrap',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading && <Spinner />}

      {!isLoading && (
        displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: C.text2 }}>
            <GraduationCap size={40} style={{ color: '#CBD5E1', marginBottom: 12 }} />
            <p style={{ margin: 0 }}>No training resources found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {displayed.map((t, i) => {
              const embedUrl = getVideoEmbedUrl(t.videoUrl || t.videoLink);
              const id = t.trainingId || t.id;
              return (
                <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  {/* Video/Thumbnail area */}
                  {embedUrl ? (
                    <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
                      <iframe
                        src={embedUrl}
                        title={t.trainingName || t.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                      />
                    </div>
                  ) : t.thumbnailUrl || t.thumbnail ? (
                    <div style={{ height: 160, background: '#111', position: 'relative', overflow: 'hidden' }}>
                      <img src={t.thumbnailUrl || t.thumbnail} alt={t.trainingName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Play size={20} color={C.primary} style={{ marginLeft: 3 }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: 140, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GraduationCap size={40} color={C.primary} />
                    </div>
                  )}
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 4 }}>{t.trainingName || t.name}</div>
                        {(t.category || t.trainingCategory) && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: C.primary, background: C.primaryLight, padding: '2px 8px', borderRadius: 10 }}>
                            {t.category || t.trainingCategory}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this training?')) deleteMutation.mutate(id);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 4, display: 'flex' }}
                        onMouseEnter={e => e.currentTarget.style.color = C.danger}
                        onMouseLeave={e => e.currentTarget.style.color = '#CBD5E1'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Add Training Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: C.surface, borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>Add Training</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text2 }}><X size={20} /></button>
            </div>
            {[
              { key: 'trainingName', label: 'Training Name *', placeholder: 'e.g. Leadership Foundations' },
              { key: 'category', label: 'Category', placeholder: 'e.g. Leadership' },
              { key: 'videoUrl', label: 'Video URL', placeholder: 'https://youtube.com/watch?v=…' },
              { key: 'thumbnailUrl', label: 'Thumbnail URL', placeholder: 'https://example.com/image.jpg' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 10, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Cancel</button>
              <button
                onClick={() => addMutation.mutate()}
                disabled={addMutation.isPending || !form.trainingName}
                style={{ flex: 1, padding: 10, background: C.primary, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#fff', opacity: addMutation.isPending ? 0.7 : 1 }}
              >
                {addMutation.isPending ? 'Adding…' : 'Add Training'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
