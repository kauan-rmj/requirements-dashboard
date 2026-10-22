import { neon } from '@neondatabase/serverless';

export const V3_STATUSES = [
  { value: 'especificacao_pendente', label: 'Especificação pendente', color: '#a78bfa' },
  { value: 'correcao_pendente', label: 'Correção pendente', color: '#f87171' },
  { value: 'validacao_pendente', label: 'Validação pendente', color: '#f59e0b' },
  { value: 'validado_nao_qa', label: 'Validado por não QA', color: '#4f8ef7' },
  { value: 'validado_qa', label: 'Validado por QA', color: '#22c55e' },
] as const;

export type V3Status = (typeof V3_STATUSES)[number]['value'];

export interface V3Test {
  id: number;
  milestone: string;
  feature: string;
  assigneeId: string | null;
  validatorId: string | null;
  priority: V3Priority;
  test: string;
  status: V3Status;
}

export const V3_PRIORITIES = [
  { value: 'urgente', label: 'Urgente', color: '#f87171' },
  { value: 'alta', label: 'Alta', color: '#fb923c' },
  { value: 'media', label: 'Média', color: '#fbbf24' },
  { value: 'baixa', label: 'Baixa', color: '#60a5fa' },
  { value: 'sem_prioridade', label: 'Sem prioridade', color: '#777' },
] as const;

export type V3Priority = (typeof V3_PRIORITIES)[number]['value'];

export const isV3Priority = (v: unknown): v is V3Priority => V3_PRIORITIES.some((p) => p.value === v);

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

export interface V3User {
  id: string;
  name: string;
  avatarUrl: string | null;
}

// Only these Linear users can be picked as responsável (Gabriel, Ana, André, Athos, Robert, Marlos, Patrick).
export const ASSIGNEE_USER_IDS = [
  'a951136f-ffcd-4925-92e0-affbbf7ff120',
  'e5fbc004-ac52-49fc-9a6b-6f3c07c40b7e',
  'a3e9b6dd-5407-4ebc-8515-ebc601bbbf06',
  '15bce7b4-bf16-4bd0-a74e-6a8212745082',
  '74dc4a51-4c8f-4d39-8fbf-70f5c8282a92',
  '26469042-c560-4706-9be2-8d7df0f271ad',
  'b763fcdc-97b8-4853-90b9-ca698afa84d8',
];
