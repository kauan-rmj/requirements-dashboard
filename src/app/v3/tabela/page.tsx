'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, Plus, Trash2, X } from 'lucide-react';
import V3Select from '@/components/V3Select';
import V3MultiSelect from '@/components/V3MultiSelect';
import { ASSIGNEE_USER_IDS, V3_PRIORITIES, V3_STATUSES, type V3Priority, type V3Status } from '@/lib/v3-tests';
import { EMPTY_DRAFT, useV3, type Draft } from '../V3Provider';

const card = { background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: '10px', padding: '24px' } as const;
const inputStyle = {
  width: '100%', background: 'transparent', border: '1px solid transparent', borderRadius: '6px',
  color: '#e5e5e5', fontSize: '13px', padding: '6px 8px', fontFamily: 'inherit', resize: 'none' as const,
};
const th = { textAlign: 'left' as const, fontSize: '11px', fontWeight: 600, color: '#666', textTransform: 'uppercase' as const, letterSpacing: '0.05em', padding: '8px', borderBottom: '1px solid #2a2a2a' };
const labelStyle = { display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' } as const;
const fieldStyle = { ...inputStyle, background: '#111', border: '1px solid #3a3a3a', padding: '8px 10px' };
const NONE = '__none';

interface Filters { q: string; milestone: string; assignee: string; validator: string; priority: string; status: string }
const EMPTY_FILTERS: Filters = { q: '', milestone: '', assignee: '', validator: '', priority: '', status: '' };

export default function V3TablePage() {
  const { tests, loading, milestones, users, save, create, remove, userOptions } = useV3();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const projectUrl = milestones[0]?.url;
  const statusColor = (s: V3Status) => V3_STATUSES.find((x) => x.value === s)?.color;
  const priorityColor = (p: V3Priority) => V3_PRIORITIES.find((x) => x.value === p)?.color;
  const setFilter = (k: keyof Filters, v: string) => setFilters((f) => ({ ...f, [k]: v }));
  const hasFilters = Object.values(filters).some(Boolean);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const match = (value: string | null, f: string) => !f || (f === NONE ? !value : value === f);
    return tests.filter(
      (t) =>
        (!q || t.feature.toLowerCase().includes(q) || t.test.toLowerCase().includes(q)) &&
        match(t.milestone, filters.milestone) &&
        match(t.assigneeId, filters.assignee) &&
        (!filters.validator || (filters.validator === NONE ? t.validatorIds.length === 0 : t.validatorIds.includes(filters.validator))) &&
        match(t.priority, filters.priority) &&
        match(t.status, filters.status),
    );
  }, [tests, filters]);

  const openModal = () => { setDraft(EMPTY_DRAFT); setFormError(null); setModalOpen(true); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.milestone) return setFormError('Selecione uma milestone');
    setFormError(null);
    setSaving(true);
    try {
      await create(draft);
      setModalOpen(false);
    } catch (err) {
      setFormError(`Falha ao criar teste: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const onRemove = (id: number) => {
    if (confirm('Excluir este teste?')) remove(id);
  };

  const milestoneOptions = [{ value: '', label: 'Todas' }, { value: NONE, label: 'Sem milestone' }, ...milestones.map((m) => ({ value: m.name, label: m.name }))];
  const statusOptions = V3_STATUSES.map((st) => ({ value: st.value, label: st.label, color: st.color }));
  const priorityOptions = V3_PRIORITIES.map((p) => ({ value: p.value, label: p.label, color: p.color }));
  const withNone = (opts: { value: string; label: string }[], none: string) => [opts[0], { value: NONE, label: none }, ...opts.slice(1)];

  const filterField = (label: string, node: React.ReactNode, width = '170px') => (
    <div style={{ width, flexShrink: 0 }}>
      <label style={{ ...labelStyle, marginBottom: '4px', fontSize: '11px' }}>{label}</label>
      {node}
    </div>
  );

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#e5e5e5' }}>
          Lista de testes ({hasFilters ? `${filtered.length} de ${tests.length}` : tests.length})
        </h2>
        <button
          onClick={openModal}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1a2a4a', border: '1px solid #4f8ef7', color: '#4f8ef7', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus size={14} /> Novo teste
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '16px' }}>
        {filterField('Buscar', (
          <input style={{ ...fieldStyle, padding: '6px 10px' }} value={filters.q} placeholder="Funcionalidade ou teste" onChange={(e) => setFilter('q', e.target.value)} />
        ), '240px')}
        {filterField('Milestone', <V3Select value={filters.milestone} placeholder="Todas" background="#111" options={milestoneOptions} onChange={(v) => setFilter('milestone', v)} />)}
        {filterField('Responsável', <V3Select value={filters.assignee} placeholder="Todos" background="#111" options={withNone(userOptions('Todos', ASSIGNEE_USER_IDS), 'Sem responsável')} onChange={(v) => setFilter('assignee', v)} />)}
        {filterField('Validador', <V3Select value={filters.validator} placeholder="Todos" background="#111" options={withNone(userOptions('Todos'), 'Sem validador')} onChange={(v) => setFilter('validator', v)} />)}
        {filterField('Prioridade', <V3Select value={filters.priority} placeholder="Todas" background="#111" options={[{ value: '', label: 'Todas' }, ...priorityOptions]} onChange={(v) => setFilter('priority', v)} />)}
        {filterField('Status', <V3Select value={filters.status} placeholder="Todos" background="#111" options={[{ value: '', label: 'Todos' }, ...statusOptions]} onChange={(v) => setFilter('status', v)} />, '200px')}
        {hasFilters && (
          <button onClick={() => setFilters(EMPTY_FILTERS)} style={{ background: 'transparent', border: '1px solid #3a3a3a', color: '#888', borderRadius: '6px', padding: '7px 12px', fontSize: '12px', cursor: 'pointer' }}>
            Limpar filtros
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ color: '#555', fontSize: '13px', padding: '24px 0' }}>Carregando…</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: '170px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Milestone
                    {projectUrl && (
                      <a href={projectUrl} target="_blank" rel="noopener noreferrer" title="Abrir projeto V3 no Linear" style={{ color: '#4f8ef7', display: 'flex' }}>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </span>
                </th>
                <th style={{ ...th, width: '140px' }}>Prioridade</th>
                <th style={{ ...th, width: '22%' }}>Funcionalidade</th>
                <th style={{ ...th, width: '100px' }}>Responsável</th>
                <th style={{ ...th, width: '130px' }}>Validadores</th>
                <th style={{ ...th, width: '200px' }}>Status</th>
                <th style={th}>Teste</th>
                <th style={{ ...th, width: '76px' }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #242424' }}>
                  <td style={{ padding: '4px', verticalAlign: 'top' }}>
                    <V3Select
                      value={t.milestone}
                      placeholder="Selecione…"
                      options={[
                        ...(t.milestone && !milestones.some((m) => m.name === t.milestone) ? [{ value: t.milestone, label: t.milestone }] : []),
                        ...milestones.map((m) => ({ value: m.name, label: m.name })),
                      ]}
                      onChange={(v) => save(t.id, { milestone: v })}
                    />
                  </td>
                  <td style={{ padding: '4px', verticalAlign: 'top' }}>
                    <V3Select value={t.priority} color={priorityColor(t.priority)} bold options={priorityOptions} onChange={(v) => save(t.id, { priority: v as V3Priority })} />
                  </td>
                  <td style={{ padding: '4px', verticalAlign: 'top' }}>
                    <textarea style={inputStyle} rows={2} value={t.feature} placeholder="Funcionalidade" onChange={(e) => save(t.id, { feature: e.target.value }, 500)} />
                  </td>
                  <td style={{ padding: '4px', verticalAlign: 'top' }}>
                    <div title={users.find((u) => u.id === t.assigneeId)?.name}>
                      <V3Select
                        value={t.assigneeId ?? ''}
                        bare
                        options={userOptions('Sem responsável', ASSIGNEE_USER_IDS, t.assigneeId, 28)}
                        onChange={(v) => save(t.id, { assigneeId: v || null })}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '4px', verticalAlign: 'top' }}>
                    <V3MultiSelect
                      bare
                      values={t.validatorIds}
                      options={userOptions('', undefined, null, 28).slice(1)}
                      onChange={(v) => save(t.id, { validatorIds: v })}
                    />
                  </td>
                  <td style={{ padding: '4px', verticalAlign: 'top' }}>
                    <V3Select value={t.status} color={statusColor(t.status)} bold options={statusOptions} onChange={(v) => save(t.id, { status: v as V3Status })} />
                  </td>
                  <td style={{ padding: '4px', verticalAlign: 'top' }}>
                    <textarea style={inputStyle} rows={2} value={t.test} placeholder="O que deve ser testado" onChange={(e) => save(t.id, { test: e.target.value }, 500)} />
                  </td>
                  <td style={{ padding: '4px', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {t.linearId && (
                        <a href={`https://linear.app/tolky/issue/${t.linearId}`} target="_blank" rel="noopener noreferrer" title={`Abrir ${t.linearId} no Linear`} style={{ color: '#4f8ef7', padding: '8px', display: 'flex' }}>
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button onClick={() => onRemove(t.id)} title="Excluir" style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', padding: '8px' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#555', fontSize: '13px' }}>
                    {tests.length === 0 ? 'Nenhum teste. Clique em “Novo teste”.' : 'Nenhum teste corresponde aos filtros.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div
          onClick={() => !saving && setModalOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}
        >
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} style={{ ...card, width: '100%', maxWidth: '520px', maxHeight: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#e5e5e5' }}>Novo teste</h2>
              <button type="button" onClick={() => setModalOpen(false)} title="Fechar" style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>
            <div>
              <label style={labelStyle}>Milestone</label>
              <V3Select value={draft.milestone} background="#111" padding="8px 10px" options={milestones.map((m) => ({ value: m.name, label: m.name }))} onChange={(v) => setDraft({ ...draft, milestone: v })} />
            </div>
            <div>
              <label style={labelStyle}>Prioridade</label>
              <V3Select value={draft.priority} background="#111" padding="8px 10px" options={priorityOptions} onChange={(v) => setDraft({ ...draft, priority: v as V3Priority })} />
            </div>
            <div>
              <label style={labelStyle}>Funcionalidade</label>
              <input required autoFocus style={fieldStyle} value={draft.feature} placeholder="Ex.: Botão Ligar do operador" onChange={(e) => setDraft({ ...draft, feature: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Responsável</label>
              <V3Select value={draft.assigneeId} background="#111" padding="8px 10px" placeholder="Sem responsável" options={userOptions('Sem responsável', ASSIGNEE_USER_IDS)} onChange={(v) => setDraft({ ...draft, assigneeId: v })} />
            </div>
            <div>
              <label style={labelStyle}>Validador</label>
              <V3MultiSelect values={draft.validatorIds} background="#111" padding="8px 10px" emptyLabel="Sem validador" options={userOptions('').slice(1)} onChange={(v) => setDraft({ ...draft, validatorIds: v })} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <V3Select value={draft.status} background="#111" padding="8px 10px" options={statusOptions} onChange={(v) => setDraft({ ...draft, status: v as V3Status })} />
            </div>
            <div>
              <label style={labelStyle}>Teste</label>
              <textarea required rows={4} style={fieldStyle} value={draft.test} placeholder="Descreva o que deve ser testado" onChange={(e) => setDraft({ ...draft, test: e.target.value })} />
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
