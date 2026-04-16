import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FileText, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import * as api from '../../../api/client';
import useAuthStore from '../../../store/authStore';

const C = {
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  success: '#10B981',
  warning: '#F59E0B',
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

export default function TemplateManagement() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const queryClient = useQueryClient();
  const [movingId, setMovingId] = useState(null);

  const { data: templates = [], isLoading, isError } = useQuery({
    queryKey: ['templates', companyId],
    queryFn: () => api.getTemplates({ action: 'GETGOALPLANTEMPLATE', companyId }),
    select: (res) => res.data?.templates || res.data?.result || [],
    enabled: !!companyId,
  });

  const moveMutation = useMutation({
    mutationFn: (templateId) => api.moveTemplates({ templateId, companyId, action: 'MOVE' }),
    onSuccess: () => {
      toast.success('Template moved!');
      queryClient.invalidateQueries(['templates']);
      setMovingId(null);
    },
    onError: () => toast.error('Failed to move template'),
  });

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <FileText size={28} color={C.primary} />
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.text }}>Template Management</h1>
          <p style={{ margin: '2px 0 0', color: C.text2, fontSize: 14 }}>{templates.length} templates</p>
        </div>
      </div>

      {isLoading && <Spinner />}
      {isError && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#EF4444', padding: 16, background: '#FEF2F2', borderRadius: 8 }}>
          <AlertCircle size={16} /> Failed to load templates.
        </div>
      )}

      {!isLoading && !isError && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {templates.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: C.text2 }}>
              <FileText size={40} style={{ color: '#CBD5E1', marginBottom: 12 }} />
              <p style={{ margin: 0 }}>No templates found.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {['Template Name', 'Category', 'Type', 'Company', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templates.map((t, i) => {
                  const id = t.templateId || t.id;
                  return (
                    <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={15} color={C.primary} />
                          </div>
                          <span style={{ fontWeight: 500, fontSize: 14, color: C.text }}>{t.templateName || t.name || `Template ${i + 1}`}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: C.text2 }}>
                        {t.category || t.templateCategory || '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {(t.templateType || t.type) && (
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.primary, background: C.primaryLight, padding: '2px 8px', borderRadius: 10 }}>
                            {t.templateType || t.type}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: C.text2 }}>
                        {t.companyId || t.company || '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => {
                            setMovingId(id);
                            moveMutation.mutate(id);
                          }}
                          disabled={moveMutation.isPending && movingId === id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 14px',
                            background: C.primaryLight,
                            border: `1px solid ${C.primary}`,
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                            color: C.primary,
                            opacity: moveMutation.isPending && movingId === id ? 0.7 : 1,
                          }}
                        >
                          <ArrowRight size={13} />
                          {moveMutation.isPending && movingId === id ? 'Moving…' : 'Move'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
