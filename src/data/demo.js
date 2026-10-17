// DADOS DE DEMONSTRAÇÃO — fictícios, gerados de forma determinística.
// Nada aqui vem da API do Instagram. Para dados reais, troque as funções exportadas.

const DEMO_END = new Date(2026, 9, 12); // 12 out 2026

export const demoAccount = {
  name: 'Marca Demo',
  handle: '@marca.demo',
  initials: 'MD',
  avatarUrl: null, // futuramente: foto da conta autorizada
};

export const PERIODS = [
  { id: '7d', label: 'Últimos 7 dias', days: 7 },
  { id: '30d', label: 'Últimos 30 dias', days: 30 },
  { id: '90d', label: 'Últimos 90 dias', days: 90 },
];

// followers/reach/engagement: [início, fim]. change: variação vs. período anterior.
const PERIOD_CONFIG = {
  '7d': {
    followers: [12700, 12846],
    reach: [29000, 33000],
    engagement: [4.9, 5.1],
    change: { followers: 0.9, reach: 3.1, impressions: 2.2, engagement: 0.2 },
  },
  '30d': {
    followers: [12400, 12846],
    reach: [21000, 33000],
    engagement: [5.0, 4.8],
    change: { followers: 2.8, reach: 9.4, impressions: 5.1, engagement: -0.3 },
  },
  '90d': {
    followers: [11350, 12846],
    reach: [15000, 33000],
    engagement: [4.5, 4.4],
    change: { followers: 9.2, reach: 21.6, impressions: 14.8, engagement: -0.1 },
  },
};

const IMPRESSIONS_PER_REACH = 1.76;

function wave(i, seed) {
  return Math.sin(i * 1.7 + seed) * 0.6 + Math.sin(i * 0.55 + seed * 2) * 0.4;
}

function isoDayAt(days, i) {
  const d = new Date(DEMO_END);
  d.setDate(d.getDate() - (days - 1 - i));
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function buildSeries(days, [from, to], { noise = 0, seed = 1, decimals = 0 } = {}) {
  const factor = 10 ** decimals;
  return Array.from({ length: days }, (_, i) => {
    const t = days === 1 ? 1 : i / (days - 1);
    const value = from + (to - from) * t + (i === days - 1 ? 0 : noise * wave(i, seed));
    return { date: isoDayAt(days, i), value: Math.round(value * factor) / factor };
  });
}

function sample(series, n) {
  return Array.from({ length: n }, (_, i) =>
    series[Math.round((i * (series.length - 1)) / (n - 1))].value,
  );
}

export function getDashboardData(periodId) {
  const period = PERIODS.find((p) => p.id === periodId) ?? PERIODS[1];
  const cfg = PERIOD_CONFIG[period.id];
  const points = Math.min(8, period.days);

  const followersSeries = buildSeries(period.days, cfg.followers);
  const reachSeries = buildSeries(period.days, cfg.reach, { noise: 2400, seed: period.days });
  const reachTotal = reachSeries.reduce((sum, p) => sum + p.value, 0);
  const impressionsTotal = Math.round(reachTotal * IMPRESSIONS_PER_REACH);
  const engagementSeries = buildSeries(8, cfg.engagement, { noise: 0.2, seed: 3, decimals: 1 });

  return {
    period,
    reachSeries,
    followersSeries,
    metrics: [
      {
        id: 'followers',
        label: 'Seguidores',
        value: followersSeries.at(-1).value,
        format: 'number',
        change: { value: cfg.change.followers, unit: 'percent' },
        trend: sample(followersSeries, points),
      },
      {
        id: 'reach',
        label: 'Alcance',
        value: reachTotal,
        format: 'compact',
        change: { value: cfg.change.reach, unit: 'percent' },
        trend: sample(reachSeries, points),
      },
      {
        id: 'impressions',
        label: 'Impressões',
        value: impressionsTotal,
        format: 'compact',
        change: { value: cfg.change.impressions, unit: 'percent' },
        trend: sample(reachSeries, points).map((v) => Math.round(v * IMPRESSIONS_PER_REACH)),
      },
      {
        id: 'engagement',
        label: 'Taxa de engajamento',
        value: cfg.engagement[1],
        format: 'percent',
        change: { value: cfg.change.engagement, unit: 'pp' },
        trend: engagementSeries.map((p) => p.value),
      },
    ],
  };
}

export function getRecentPosts() {
  return [
    { id: 'p1', title: 'Bastidores da montagem do novo estúdio', date: '2026-10-10', type: 'imagem', tone: 'teal', likes: 1284, comments: 86, reach: 38200 },
    { id: 'p2', title: 'Reels: 3 dicas rápidas para organizar o feed', date: '2026-10-07', type: 'reel', tone: 'slate', likes: 2931, comments: 214, reach: 91700 },
    { id: 'p3', title: 'Carrossel: resultados do trimestre em números', date: '2026-10-03', type: 'carrossel', tone: 'steel', likes: 972, comments: 41, reach: 27500 },
    { id: 'p4', title: 'Depoimento de cliente sobre o novo site', date: '2026-09-28', type: 'imagem', tone: 'cyan', likes: 1106, comments: 63, reach: 31900 },
    { id: 'p5', title: 'Reels: do briefing à entrega em 60 segundos', date: '2026-09-22', type: 'reel', tone: 'navy', likes: 1847, comments: 129, reach: 58300 },
  ];
}
