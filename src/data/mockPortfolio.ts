// Mock portfolio data for the "(Soon)" demo dashboard / ongoing-project pages.
// Mirrors the design's seeded data from primepm/project/data.jsx.

export type RAG = 'green' | 'amber' | 'red' | 'blue';

export interface MockProject {
  id: string;
  code: string;
  name: string;
  program: string;
  sponsor: string;
  pm: string;
  health: RAG;
  schedule: RAG;
  budget: RAG;
  scope: RAG;
  progress: number; // 0..1
  budgetUsed: number; // $M
  budgetTotal: number; // $M
  eac: number;
  startedAt: string;
  targetAt: string;
  risksOpen: number;
  issuesOpen: number;
  deps: number;
  blockingDeps: number;
  okrAlign: string[];
  benefits: { plan: number; forecast: number; realized: number; unit: string };
  team: string[];
  phase: string;
  nextMilestone: { name: string; date: string; status: 'now' | 'late' | 'done' };
  domain: string;
}

export interface MockRisk {
  id: string;
  project: string;
  title: string;
  sev: 'high' | 'med' | 'low';
  prob: number;
  impact: number;
  owner: string;
  due: string;
  mitigation: string;
  aging: number;
}

export interface MockDep {
  from: string;
  to: string;
  label: string;
  status: RAG;
  neededBy: string;
}

export interface MockOKR {
  id: string;
  title: string;
  owner: string;
  quarter: string;
  progress: number;
  krs: Array<{ name: string; progress: number; link: string | null }>;
}

export const MOCK_PORTFOLIO: MockProject[] = [
  { id: 'atlas', code: 'ATL', name: 'Atlas — Customer Data Platform',
    program: 'Digital Foundation', sponsor: 'K. Marsh', pm: 'Priya Shah',
    health: 'green', schedule: 'green', budget: 'amber', scope: 'green',
    progress: 0.62, budgetUsed: 1.42, budgetTotal: 2.20, eac: 2.34,
    startedAt: '2025-09-04', targetAt: '2026-08-30',
    risksOpen: 4, issuesOpen: 2, deps: 3, blockingDeps: 0,
    okrAlign: ['Activate first-party data', 'Improve LTV'],
    benefits: { plan: 4.8, forecast: 5.2, realized: 1.1, unit: 'M ARR' },
    team: ['PS','JL','RC','MT','BO'], phase: 'Build',
    nextMilestone: { name: 'Data ingestion GA', date: '2026-05-21', status: 'now' },
    domain: 'Software' },
  { id: 'northstar', code: 'NST', name: 'Northstar — Revenue Cloud Migration',
    program: 'Commercial Excellence', sponsor: 'D. Reyes', pm: 'Jonas Liang',
    health: 'amber', schedule: 'amber', budget: 'green', scope: 'amber',
    progress: 0.48, budgetUsed: 3.10, budgetTotal: 6.50, eac: 6.85,
    startedAt: '2025-06-12', targetAt: '2026-09-15',
    risksOpen: 7, issuesOpen: 3, deps: 5, blockingDeps: 2,
    okrAlign: ['Lift quote-to-cash velocity', 'Unify pricing'],
    benefits: { plan: 12.0, forecast: 11.2, realized: 2.4, unit: 'M Saved' },
    team: ['JL','AK','RM','TF'], phase: 'Build',
    nextMilestone: { name: 'Pricing engine cutover', date: '2026-05-12', status: 'late' },
    domain: 'Software' },
  { id: 'harbor', code: 'HBR', name: 'Harbor — SOC 2 + ISO 27001',
    program: 'Trust & Compliance', sponsor: 'L. Chen', pm: 'Maya Okafor',
    health: 'green', schedule: 'green', budget: 'green', scope: 'green',
    progress: 0.81, budgetUsed: 0.62, budgetTotal: 0.80, eac: 0.78,
    startedAt: '2025-04-01', targetAt: '2026-06-30',
    risksOpen: 2, issuesOpen: 0, deps: 1, blockingDeps: 0,
    okrAlign: ['Win enterprise tier'],
    benefits: { plan: 2.0, forecast: 2.0, realized: 0.5, unit: 'M Pipeline' },
    team: ['MO','RC','DK'], phase: 'Validate',
    nextMilestone: { name: 'Auditor field test', date: '2026-05-08', status: 'now' },
    domain: 'Compliance' },
  { id: 'kepler', code: 'KPL', name: 'Kepler — Warehouse Automation',
    program: 'Operations 2.0', sponsor: 'T. Banerjee', pm: 'Ravi Coopersmith',
    health: 'red', schedule: 'red', budget: 'amber', scope: 'red',
    progress: 0.34, budgetUsed: 4.10, budgetTotal: 5.50, eac: 6.90,
    startedAt: '2025-02-18', targetAt: '2026-07-10',
    risksOpen: 11, issuesOpen: 5, deps: 6, blockingDeps: 3,
    okrAlign: ['Cut fulfillment cost / order'],
    benefits: { plan: 8.0, forecast: 5.4, realized: 0.0, unit: 'M Saved' },
    team: ['RC','BO','TF','SK','MT','DK'], phase: 'Build',
    nextMilestone: { name: 'Robotics integration', date: '2026-05-04', status: 'late' },
    domain: 'Operations' },
  { id: 'lyra', code: 'LYR', name: 'Lyra — Mobile App Refresh',
    program: 'Digital Foundation', sponsor: 'K. Marsh', pm: 'Sasha Kemper',
    health: 'amber', schedule: 'green', budget: 'amber', scope: 'amber',
    progress: 0.56, budgetUsed: 0.95, budgetTotal: 1.60, eac: 1.72,
    startedAt: '2025-10-20', targetAt: '2026-08-12',
    risksOpen: 3, issuesOpen: 1, deps: 2, blockingDeps: 1,
    okrAlign: ['Improve LTV', 'Lift activation'],
    benefits: { plan: 3.4, forecast: 3.0, realized: 0.4, unit: 'M ARR' },
    team: ['SK','JL','AK'], phase: 'Build',
    nextMilestone: { name: 'Beta rollout 25%', date: '2026-05-19', status: 'now' },
    domain: 'Software' },
  { id: 'monarch', code: 'MON', name: 'Monarch — Treasury & Payments',
    program: 'Finance Modernization', sponsor: 'P. Adler', pm: 'Dani Kobayashi',
    health: 'green', schedule: 'green', budget: 'green', scope: 'green',
    progress: 0.71, budgetUsed: 1.85, budgetTotal: 2.60, eac: 2.55,
    startedAt: '2025-07-15', targetAt: '2026-06-10',
    risksOpen: 2, issuesOpen: 1, deps: 2, blockingDeps: 0,
    okrAlign: ['Reduce DSO', 'Cut FX cost'],
    benefits: { plan: 6.2, forecast: 6.6, realized: 2.1, unit: 'M Saved' },
    team: ['DK','TF','MT'], phase: 'Validate',
    nextMilestone: { name: 'First production run', date: '2026-05-29', status: 'now' },
    domain: 'Finance' },
  { id: 'vega', code: 'VEG', name: 'Vega — Marketing Automation',
    program: 'Commercial Excellence', sponsor: 'D. Reyes', pm: 'Aiko Klein',
    health: 'amber', schedule: 'amber', budget: 'green', scope: 'green',
    progress: 0.42, budgetUsed: 0.55, budgetTotal: 1.40, eac: 1.42,
    startedAt: '2025-11-04', targetAt: '2026-09-22',
    risksOpen: 3, issuesOpen: 2, deps: 3, blockingDeps: 1,
    okrAlign: ['Lift MQL→SQL conversion'],
    benefits: { plan: 4.0, forecast: 3.6, realized: 0.2, unit: 'M Pipeline' },
    team: ['AK','JL','SK'], phase: 'Build',
    nextMilestone: { name: 'Lifecycle engine v1', date: '2026-06-04', status: 'now' },
    domain: 'Marketing' },
  { id: 'orion', code: 'ORI', name: 'Orion — Workforce Analytics',
    program: 'People & Culture', sponsor: 'R. Volkov', pm: 'Tomas Friel',
    health: 'green', schedule: 'green', budget: 'amber', scope: 'green',
    progress: 0.66, budgetUsed: 0.78, budgetTotal: 1.10, eac: 1.18,
    startedAt: '2025-08-01', targetAt: '2026-07-20',
    risksOpen: 2, issuesOpen: 0, deps: 1, blockingDeps: 0,
    okrAlign: ['Reduce regrettable attrition'],
    benefits: { plan: 1.8, forecast: 2.0, realized: 0.6, unit: 'M Saved' },
    team: ['TF','MO','RC'], phase: 'Build',
    nextMilestone: { name: 'Manager dashboards', date: '2026-05-15', status: 'now' },
    domain: 'People' },
];

export const MOCK_RISKS: MockRisk[] = [
  { id: 'R-204', project: 'kepler', title: 'Robotics vendor cannot meet integration SLA',
    sev: 'high', prob: 0.7, impact: 0.9, owner: 'RC', due: '2026-05-04',
    mitigation: 'Dual-source secondary integrator; renegotiate scope to phased GA.', aging: 18 },
  { id: 'R-198', project: 'northstar', title: 'Pricing rules collision in legacy quote engine',
    sev: 'high', prob: 0.6, impact: 0.8, owner: 'JL', due: '2026-05-12',
    mitigation: 'Freeze pricing changes; spike adapter; load-test parity.', aging: 11 },
  { id: 'R-191', project: 'atlas', title: 'Privacy review pending on identity stitching',
    sev: 'med', prob: 0.5, impact: 0.6, owner: 'PS', due: '2026-05-22',
    mitigation: 'Privacy office review; fall back to deterministic-only stitch.', aging: 7 },
  { id: 'R-187', project: 'kepler', title: 'Q3 hiring shortfall for site reliability',
    sev: 'high', prob: 0.55, impact: 0.7, owner: 'RC', due: '2026-06-01',
    mitigation: 'Open contractor channel + reprioritize internal mobility.', aging: 22 },
  { id: 'R-182', project: 'vega', title: 'Salesforce schema change breaks lifecycle triggers',
    sev: 'med', prob: 0.45, impact: 0.55, owner: 'AK', due: '2026-05-30',
    mitigation: 'Pin schema version; add canary tenant before rollout.', aging: 5 },
  { id: 'R-177', project: 'lyra', title: 'Apple App Store review backlog',
    sev: 'low', prob: 0.4, impact: 0.4, owner: 'SK', due: '2026-05-26',
    mitigation: 'Phased TestFlight; submit two versions for parallel review.', aging: 3 },
  { id: 'R-172', project: 'northstar', title: 'Tax engine localization gaps (LATAM)',
    sev: 'med', prob: 0.5, impact: 0.65, owner: 'JL', due: '2026-06-08',
    mitigation: 'Engage Avalara solution architect; carve out Phase 2.', aging: 9 },
];

export const MOCK_DEPS: MockDep[] = [
  { from: 'atlas', to: 'vega', label: 'Identity stitching → Lifecycle triggers', status: 'amber', neededBy: '2026-05-22' },
  { from: 'monarch', to: 'northstar', label: 'Treasury → Quote-to-cash GL', status: 'green', neededBy: '2026-06-10' },
  { from: 'kepler', to: 'northstar', label: 'Inventory ledger → Order management', status: 'red', neededBy: '2026-05-15' },
  { from: 'harbor', to: 'atlas', label: 'Audit controls → Data lineage exports', status: 'green', neededBy: '2026-05-30' },
  { from: 'orion', to: 'kepler', label: 'Workforce data → Site staffing', status: 'amber', neededBy: '2026-06-04' },
  { from: 'atlas', to: 'lyra', label: 'CDP → Mobile activation', status: 'amber', neededBy: '2026-06-25' },
];

export const MOCK_OKRS: MockOKR[] = [
  { id: 'O1', title: 'Be the most trusted platform for our enterprise tier',
    owner: 'L. Chen', quarter: 'FY26 H1', progress: 0.74,
    krs: [
      { name: 'Achieve SOC 2 Type II + ISO 27001 by Jul', progress: 0.81, link: 'harbor' },
      { name: 'Zero P0 security incidents', progress: 1.0, link: null },
      { name: 'Reduce vendor data exposure 60%', progress: 0.42, link: 'harbor' },
    ]},
  { id: 'O2', title: 'Become the data-activation backbone for revenue',
    owner: 'K. Marsh', quarter: 'FY26 H1', progress: 0.55,
    krs: [
      { name: 'Atlas CDP serves 80% of marketing surfaces', progress: 0.62, link: 'atlas' },
      { name: 'Lyra reaches 1.2M MAU', progress: 0.56, link: 'lyra' },
      { name: 'Activation lift +18% YoY', progress: 0.47, link: null },
    ]},
  { id: 'O3', title: 'Modernize the operational core — finance, ops, people',
    owner: 'T. Banerjee', quarter: 'FY26 H1', progress: 0.51,
    krs: [
      { name: 'Cut fulfillment cost / order by 22%', progress: 0.34, link: 'kepler' },
      { name: 'Reduce DSO from 41 to 32 days', progress: 0.71, link: 'monarch' },
      { name: 'Manager analytics deployed to 100% sites', progress: 0.66, link: 'orion' },
    ]},
  { id: 'O4', title: 'Compound revenue from existing customers',
    owner: 'D. Reyes', quarter: 'FY26 H1', progress: 0.46,
    krs: [
      { name: 'Quote-to-cash velocity +35%', progress: 0.48, link: 'northstar' },
      { name: 'MQL → SQL conversion +30%', progress: 0.42, link: 'vega' },
      { name: 'Net revenue retention ≥ 118%', progress: 0.51, link: null },
    ]},
];

export const HEALTH_TRAIL: Record<string, RAG[]> = {
  atlas:     ['green','green','amber','amber','green','green','green','green','green','green','green','green'],
  northstar: ['green','amber','amber','amber','red','amber','amber','amber','amber','amber','amber','amber'],
  harbor:    ['green','green','green','green','green','green','green','green','green','green','green','green'],
  kepler:    ['amber','amber','red','red','red','red','red','red','amber','red','red','red'],
  lyra:      ['green','green','green','amber','amber','amber','amber','green','amber','amber','amber','amber'],
  monarch:   ['green','green','green','amber','green','green','green','green','green','green','green','green'],
  vega:      ['green','green','amber','amber','amber','amber','green','amber','amber','amber','amber','amber'],
  orion:     ['green','green','green','green','green','green','amber','green','green','green','green','green'],
};

export const BENEFITS_CURVE = {
  plan:     [0.0, 0.4, 1.0, 1.8, 2.8, 4.0, 5.3, 7.0, 9.0, 11.5, 14.5, 18.0],
  forecast: [0.0, 0.3, 0.8, 1.6, 2.5, 3.5, 4.8, 6.5, 8.4, 10.6, 13.4, 16.4],
  realized: [0.0, 0.2, 0.5, 1.0, 1.7, 2.5, 3.4, 4.4, 5.8, null, null, null] as Array<number | null>,
};

export const MONTHS = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'];

export const PROGRAMS = [
  'All programs',
  'Digital Foundation',
  'Commercial Excellence',
  'Trust & Compliance',
  'Operations 2.0',
  'Finance Modernization',
  'People & Culture',
];

export const MOCK_TASKS: Record<string, Array<{ id: string; title: string; owner: string; status: string; due: string; priority: string }>> = {
  atlas: [
    { id: 'T-9821', title: 'Deterministic identity merge — production rollout', owner: 'PS', status: 'In Progress', due: '2026-05-14', priority: 'P1' },
    { id: 'T-9817', title: 'Lakehouse cost guardrails (Iceberg compaction)', owner: 'RC', status: 'In Progress', due: '2026-05-21', priority: 'P2' },
    { id: 'T-9806', title: 'PII redaction pipeline — review', owner: 'MT', status: 'In Review', due: '2026-05-09', priority: 'P1' },
    { id: 'T-9799', title: 'Identity stitching SLO doc', owner: 'JL', status: 'Done', due: '2026-04-28', priority: 'P3' },
    { id: 'T-9785', title: 'Reverse ETL — Salesforce sink', owner: 'BO', status: 'Blocked', due: '2026-05-07', priority: 'P1' },
    { id: 'T-9762', title: 'Vendor SOW — privacy assistant', owner: 'PS', status: 'Todo', due: '2026-05-30', priority: 'P2' },
  ],
  northstar: [
    { id: 'T-9612', title: 'Pricing engine adapter — schema parity', owner: 'JL', status: 'In Progress', due: '2026-05-09', priority: 'P0' },
    { id: 'T-9601', title: 'Order orchestration — error budget review', owner: 'AK', status: 'In Progress', due: '2026-05-15', priority: 'P1' },
    { id: 'T-9588', title: 'LATAM tax mapping (BR, MX, CO)', owner: 'RM', status: 'Blocked', due: '2026-05-22', priority: 'P1' },
    { id: 'T-9572', title: 'Quote-to-cash UX — sales test cohort', owner: 'TF', status: 'In Review', due: '2026-05-06', priority: 'P2' },
  ],
  kepler: [
    { id: 'T-8421', title: 'Robotics integration — phased commissioning', owner: 'RC', status: 'Blocked', due: '2026-05-04', priority: 'P0' },
    { id: 'T-8418', title: 'WMS migration — site cutover plan', owner: 'BO', status: 'In Progress', due: '2026-05-19', priority: 'P1' },
    { id: 'T-8410', title: 'Inventory ledger reconciliation', owner: 'TF', status: 'In Progress', due: '2026-05-12', priority: 'P1' },
  ],
};
