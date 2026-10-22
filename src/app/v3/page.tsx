'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Plus, Trash2, X } from 'lucide-react';
import V3TopicChart from '@/components/V3TopicChart';
import V3Select from '@/components/V3Select';
import { V3_STATUSES, type V3Milestone, type V3Status, type V3Test } from '@/lib/v3-tests';

const card = { background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: '10px', padding: '24px' } as const;
const inputStyle = {
  width: '100%', background: 'transparent', border: '1px solid transparent', borderRadius: '6px',
  color: '#e5e5e5', fontSize: '13px', padding: '6px 8px', fontFamily: 'inherit', resize: 'none' as const,
};
const th = { textAlign: 'left' as const, fontSize: '11px', fontWeight: 600, color: '#666', textTransform: 'uppercase' as const, letterSpacing: '0.05em', padding: '8px', borderBottom: '1px solid #2a2a2a' };

type Draft = { milestone: string; feature: string; test: string; status: V3Status };
const EMPTY_DRAFT: Draft = { milestone: '', feature: '', test: '', status: 'validacao_pendente' };
const labelStyle = { display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' } as const;
const fieldStyle = { ...inputStyle, background: '#111', border: '1px solid #3a3a3a', padding: '8px 10px' };

export default function V3Page() {
  const [tests, setTests] = useState<V3Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<V3Milestone[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/v3-tests', { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setTests(j.tests);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetch('/api/v3-milestones', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setMilestones(j.milestones ?? []))
      .catch(() => setError('Falha ao carregar milestones do Linear'));
  }, [load]);

  const save = (id: number, patch: Partial<V3Test>, debounce = 0) => {
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const key = `${id}:${Object.keys(patch)[0]}`;
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v3-tests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
        if (!res.ok) throw new Error();
      } catch {
        setError('Falha ao salvar alteração');
      }
    }, debounce);
  };

  const openModal = () => { setDraft(EMPTY_DRAFT); setFormError(null); setModalOpen(true); };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.milestone) return setFormError('Selecione uma milestone');
    setFormError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/v3-tests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setTests((prev) => [...prev, j.test]);
      setModalOpen(false);
      setError(null);
    } catch (err) {
      setFormError(`Falha ao criar teste: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Excluir este teste?')) return;
    try {
      const res = await fetch(`/api/v3-tests/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setTests((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('Falha ao excluir teste. Verifique a conexão com o servidor e tente novamente.');
    }
  };

  const projectUrl = milestones[0]?.url;

  const statusColor = (s: V3Status) => V3_STATUSES.find((x) => x.value === s)!.color;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#e5e5e5', letterSpacing: '-0.02em' }}>V3</h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#555' }}>
          Testes de tela das funcionalidades do projeto V3 · garantir ausência de bugs e facilidade de uso
        </p>
      </div>

      {error && <div style={{ ...card, padding: '12px 16px', marginBottom: '16px', color: '#f87171', fontSize: '13px' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <V3TopicChart tests={tests} />

        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#e5e5e5' }}>Lista de testes ({tests.length})</h2>
            <button
              onClick={openModal}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1a2a4a', border: '1px solid #4f8ef7', color: '#4f8ef7', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Plus size={14} /> Novo teste
            </button>
          </div>
          {loading ? (
            <div style={{ color: '#555', fontSize: '13px', padding: '24px 0' }}>Carregando…</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                <thead>
                  <tr>
                    <th style={{ ...th, width: '20%' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        Milestone
                        {projectUrl && (
                          <a href={projectUrl} target="_blank" rel="noopener noreferrer" title="Abrir projeto V3 no Linear" style={{ color: '#4f8ef7', display: 'flex' }}>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </span>
                    </th>
                    <th style={{ ...th, width: '18%' }}>Funcionalidade</th>
                    <th style={th}>Teste</th>
                    <th style={{ ...th, width: '190px' }}>Status</th>
                    <th style={{ ...th, width: '40px' }} />
                  </tr>
                </thead>
                <tbody>
                  {tests.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #242424' }}>
                      <td style={{ padding: '4px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <V3Select
                            value={t.milestone}
                            placeholder="Selecione…"
                            options={[
                              ...(t.milestone && !milestones.some((m) => m.name === t.milestone) ? [{ value: t.milestone, label: t.milestone }] : []),
                              ...milestones.map((m) => ({ value: m.name, label: m.name })),
                            ]}
                            onChange={(v) => save(t.id, { milestone: v })}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '4px', verticalAlign: 'top' }}>
                        <textarea style={inputStyle} rows={2} value={t.feature} placeholder="Funcionalidade" onChange={(e) => save(t.id, { feature: e.target.value }, 500)} />
                      </td>
                      <td style={{ padding: '4px', verticalAlign: 'top' }}>
                        <textarea
                          style={inputStyle}
                          rows={2}
                          value={t.test}
                          placeholder="O que deve ser testado"
                          onChange={(e) => save(t.id, { test: e.target.value }, 500)}
                        />
                      </td>
                      <td style={{ padding: '4px', verticalAlign: 'top' }}>
                        <V3Select
                          value={t.status}
                          color={statusColor(t.status)}
                          bold
                          options={V3_STATUSES.map((st) => ({ value: st.value, label: st.label, color: st.color }))}
                          onChange={(v) => save(t.id, { status: v as V3Status })}
                        />
                      </td>
                      <td style={{ padding: '4px', verticalAlign: 'top' }}>
                        <button onClick={() => remove(t.id)} title="Excluir" style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', padding: '8px' }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tests.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#555', fontSize: '13px' }}>Nenhum teste. Clique em “Novo teste”.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {modalOpen && (
        <div
          onClick={() => !saving && setModalOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}
        >
          <form
            onSubmit={create}
            onClick={(e) => e.stopPropagation()}
            style={{ ...card, width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#e5e5e5' }}>Novo teste</h2>
              <button type="button" onClick={() => setModalOpen(false)} title="Fechar" style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>
            <div>
              <label style={labelStyle}>Milestone</label>
              <V3Select
                value={draft.milestone}
                background="#111"
                padding="8px 10px"
                options={milestones.map((m) => ({ value: m.name, label: m.name }))}
                onChange={(v) => setDraft({ ...draft, milestone: v })}
              />
            </div>
            <div>
              <label style={labelStyle}>Funcionalidade</label>
              <input required autoFocus style={fieldStyle} value={draft.feature} placeholder="Ex.: Botão Ligar do operador" onChange={(e) => setDraft({ ...draft, feature: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Teste</label>
              <textarea required rows={4} style={fieldStyle} value={draft.test} placeholder="Descreva o que deve ser testado" onChange={(e) => setDraft({ ...draft, test: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <V3Select
                value={draft.status}
                background="#111"
                padding="8px 10px"
                options={V3_STATUSES.map((st) => ({ value: st.value, label: st.label, color: st.color }))}
                onChange={(v) => setDraft({ ...draft, status: v as V3Status })}
              />
            </div>
            {formError && <div style={{ color: '#f87171', fontSize: '12px' }}>{formError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setModalOpen(false)} style={{ background: 'transparent', border: '1px solid #3a3a3a', color: '#888', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving} style={{ background: '#1a2a4a', border: '1px solid #4f8ef7', color: '#4f8ef7', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Salvando…' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
