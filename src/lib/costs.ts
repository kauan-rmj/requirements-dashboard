// Source: Supabase tolky-to-v2 (cost_control, request_control, conversations), USD, America/Sao_Paulo.
// Generated 2026-10-22; Out/26 is partial (01/10 to 21/10).
export interface MonthCost {
  label: string;
  cost: number;
  requests: number;
  conv: number;
  ctSum: number; // sum of completion_time (ms)
  ctCount: number;
  partial: boolean;
}

export const MONTH_COSTS: MonthCost[] = [
  { label: 'Jan/26', cost: 13171.394429, requests: 1305390, conv: 198394, ctSum: 18286045744, ctCount: 1260852, partial: false },
  { label: 'Fev/26', cost: 10812.447605, requests: 1007062, conv: 250483, ctSum: 14614676100, ctCount: 959272, partial: false },
  { label: 'Mar/26', cost: 9294.12697, requests: 1010752, conv: 298867, ctSum: 13937745156, ctCount: 975081, partial: false },
  { label: 'Abr/26', cost: 11615.506415, requests: 1049414, conv: 157080, ctSum: 17582103995, ctCount: 1009517, partial: false },
  { label: 'Mai/26', cost: 13012.749828, requests: 1501055, conv: 293990, ctSum: 24426790606, ctCount: 1431107, partial: false },
  { label: 'Jun/26', cost: 5052.7222585172, requests: 779386, conv: 251945, ctSum: 15047819930, ctCount: 743018, partial: false },
  { label: 'Jul/26', cost: 7188.144, requests: 1373999, conv: 335243, ctSum: 29503886657, ctCount: 1300005, partial: false },
  { label: 'Ago/26', cost: 10322.692004, requests: 1667804, conv: 358520, ctSum: 37099657034, ctCount: 1615071, partial: false },
  { label: 'Set/26', cost: 6722.060403, requests: 1431180, conv: 286917, ctSum: 15954751559, ctCount: 1396142, partial: false },
  { label: 'Out/26*', cost: 3000.563527, requests: 934420, conv: 253237, ctSum: 9968278411, ctCount: 912266, partial: true },
];

// Average amount billed per conversation, USD (estimate: billing = conv × BILLING_PER_CONVERSATION).
export const BILLING_PER_CONVERSATION = 0.2;
