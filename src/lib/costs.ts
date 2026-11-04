// Source: Supabase tolky-to-v2 (cost_control, request_control, conversations), USD, America/Sao_Paulo.
// Generated 2026-11-04; Nov/26 is partial (01/11 to 04/11, até ~12h BRT).
export interface MonthCost {
  label: string;
  cost: number;
  requests: number;
  conv: number;
  ctSum: number; // sum of completion_time (ms)
  ctCount: number;
  partial: boolean;
  voice: number; // USD, public.voice_call_sessions.total_usd (STT/TTS/realtime/live/infra de voz); existe desde 04/09/26
  monthShare: number; // fração do mês coberta (1 = mês fechado); proporcionaliza a infra
}

export const MONTH_COSTS: MonthCost[] = [
  { label: 'Jan/26', cost: 13171.394429, requests: 1305390, conv: 198394, ctSum: 18286045744, ctCount: 1260852, partial: false, voice: 0, monthShare: 1 },
  { label: 'Fev/26', cost: 10812.447605, requests: 1007062, conv: 250483, ctSum: 14614676100, ctCount: 959272, partial: false, voice: 0, monthShare: 1 },
  { label: 'Mar/26', cost: 9294.12697, requests: 1010752, conv: 298867, ctSum: 13937745156, ctCount: 975081, partial: false, voice: 0, monthShare: 1 },
  { label: 'Abr/26', cost: 11615.506415, requests: 1049414, conv: 157080, ctSum: 17582103995, ctCount: 1009517, partial: false, voice: 0, monthShare: 1 },
  { label: 'Mai/26', cost: 13012.749828, requests: 1501055, conv: 293990, ctSum: 24426790606, ctCount: 1431107, partial: false, voice: 0, monthShare: 1 },
  { label: 'Jun/26', cost: 5052.7222585172, requests: 779386, conv: 251945, ctSum: 15047819930, ctCount: 743018, partial: false, voice: 0, monthShare: 1 },
  { label: 'Jul/26', cost: 7188.144, requests: 1373999, conv: 335243, ctSum: 29503886657, ctCount: 1300005, partial: false, voice: 0, monthShare: 1 },
  { label: 'Ago/26', cost: 10322.692004, requests: 1667804, conv: 358520, ctSum: 37099657034, ctCount: 1615071, partial: false, voice: 0, monthShare: 1 },
  { label: 'Set/26', cost: 6722.060403, requests: 1431180, conv: 286917, ctSum: 15954751559, ctCount: 1396142, partial: false, voice: 17.78, monthShare: 1 },
  { label: 'Out/26', cost: 4390.440651, requests: 1300357, conv: 345558, ctSum: 14422901161, ctCount: 1276956, partial: false, voice: 29.28, monthShare: 1 },
  { label: 'Nov/26*', cost: 352.276586, requests: 101672, conv: 31464, ctSum: 1218677879, ctCount: 100966, partial: true, voice: 2.12, monthShare: 0.1533 },
];

// Average amount billed per conversation, USD (estimate: billing = conv × BILLING_PER_CONVERSATION).
export const BILLING_PER_CONVERSATION = 0.2;

// Infra fora do cost_control (GCP via revenda + Supabase banco/Storage), USD/mês. ESTIMATIVA constante:
// preço de tabela de 08/10/26 (GCP 753,30 + Supabase 726,51 + Storage 8,96 = 1.488,77; doc 15 do custoPreco).
// Referência jul/26: 762,24 + 685,59 = 1.447,83 (doc 09). Fatura de out/26 informada é ~R$ 12.000 (~US$ 2.108): ver doc 15 §5.1.
// Meses anteriores a jul/26 usam o mesmo valor por falta de dado (banco era menor): tratar como aproximação.
export const INFRA_MONTHLY_USD = 1488.77;
