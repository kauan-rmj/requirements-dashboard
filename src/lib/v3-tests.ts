import { neon } from '@neondatabase/serverless';

export const V3_STATUSES = [
  { value: 'validado_nao_qa', label: 'Validado por não QA', color: '#4f8ef7' },
  { value: 'validado_qa', label: 'Validado por QA', color: '#22c55e' },
  { value: 'correcao_pendente', label: 'Correção pendente', color: '#f87171' },
  { value: 'validacao_pendente', label: 'Validação pendente', color: '#f59e0b' },
] as const;

export type V3Status = (typeof V3_STATUSES)[number]['value'];

export interface V3Test {
  id: number;
  milestone: string;
  feature: string;
  test: string;
  status: V3Status;
}

export const isV3Status = (v: unknown): v is V3Status => V3_STATUSES.some((s) => s.value === v);

export function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

export interface V3Milestone {
  id: string;
  name: string;
  url: string;
}
