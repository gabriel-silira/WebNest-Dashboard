const numberFmt = new Intl.NumberFormat('pt-BR');
const compactFmt = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const oneDecimal = { minimumFractionDigits: 1, maximumFractionDigits: 1 };

// 'YYYY-MM-DD' -> Date ao meio-dia (evita deslocamento de fuso)
const toDate = (iso) => new Date(`${iso}T12:00:00`);

export const formatNumber = (n) => numberFmt.format(n);
export const formatCompact = (n) => compactFmt.format(n);
export const formatPercent = (n) => `${n.toLocaleString('pt-BR', oneDecimal)}%`;

export function formatMetric(value, format) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return '—';
  }
  if (format === 'percent') return formatPercent(value);
  if (format === 'compact') return formatCompact(value);
  return formatNumber(value);
}

export function formatChange({ value, unit }) {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  const abs = Math.abs(value).toLocaleString('pt-BR', oneDecimal);
  return `${sign}${abs}${unit === 'pp' ? ' p.p.' : '%'}`;
}

export const formatShortDate = (iso) =>
  toDate(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');

export const formatLongDate = (iso) =>
  toDate(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });

export const formatDateWithYear = (iso) =>
  toDate(iso)
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .replaceAll('.', '');
