
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  formatCompact,
  formatLongDate,
  formatNumber,
  formatShortDate,
} from '../utils/format.js';

// Cores do gráfico, seguindo a identidade visual do dashboard.
const LINE = 'var(--accent-ink)';
const AREA = 'var(--accent)';
const GRID = 'var(--grid)';
const MUTED = 'var(--text-muted)';

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <span>{formatLongDate(label)}</span>

      <strong>
        {formatNumber(payload[0].value)} {unit}
      </strong>
    </div>
  );
}

export default function ChartCard({
  id,
  title,
  description,
  data = [],
  unit,
  className = '',
}) {
  const validData = Array.isArray(data)
    ? data
        .filter(
          (point) =>
            point &&
            typeof point.date === 'string' &&
            point.value !== null && point.value !== undefined &&
            Number.isFinite(Number(point.value)),
        )
        .map((point) => ({
          date: point.date,
          value: Number(point.value),
        }))
    : [];

  const values = validData.map((point) => point.value);
  const first = validData[0];
  const last = validData[validData.length - 1];

  const summary = validData.length > 0
    ? `${title}. Início: ${formatNumber(first.value)} ${unit} em ${formatLongDate(first.date)}. Fim: ${formatNumber(last.value)} ${unit} em ${formatLongDate(last.date)}. Mínimo ${formatNumber(Math.min(...values))}, máximo ${formatNumber(Math.max(...values))}.`
    : `${title}. Não há dados disponíveis para exibir.`;

  return (
    <article
      className={`card chart-card ${className}`}
      aria-labelledby={`${id}-title`}
    >
      <h2 id={`${id}-title`}>{title}</h2>

      <p className="card__sub">{description}</p>

      {validData.length === 0 ? (
        <div
          className="chart chart--empty"
          role="status"
          aria-label={summary}
        >
          <p>
            Não há dados disponíveis para exibir neste período.
          </p>
        </div>
      ) : (
        <div className="chart" role="img" aria-label={summary}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={validData}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke={GRID}
              />

              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                tick={{ fill: MUTED, fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: GRID }}
                interval="preserveStartEnd"
                minTickGap={32}
              />

              <YAxis
                width={56}
                tickFormatter={formatCompact}
                tick={{ fill: MUTED, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
              />

              <Tooltip
                content={<ChartTooltip unit={unit} />}
                cursor={{
                  stroke: LINE,
                  strokeDasharray: '3 3',
                }}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke={LINE}
                strokeWidth={3}
                fill={AREA}
                fillOpacity={0.14}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: 'var(--surface-alt)',
                  stroke: LINE,
                  strokeWidth: 3,
                }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}
