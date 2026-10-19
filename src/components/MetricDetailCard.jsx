import {
  Eye,
  MessageCircle,
  MousePointerClick,
  Play,
  UserRoundCheck,
  Users,
} from 'lucide-react';

const icons = {
  followers: Users,
  reach: Eye,
  views: Play,
  interactions: MousePointerClick,
  engaged: UserRoundCheck,
  engagement: MessageCircle,
};

function formatNumber(value) {
  if (value === null || value === undefined) return '—';

  return Number(value).toLocaleString('pt-BR', {
    maximumFractionDigits: 2,
  });
}

export default function MetricDetailCard({ metric }) {
  const Icon = icons[metric.id] ?? Users;
  const valueLabel = metric.status === 'loading'
    ? 'Carregando...'
    : metric.status === 'error'
      ? 'Erro na consulta'
      : metric.status === 'unavailable'
        ? 'Indisponível'
        : formatNumber(metric.value);

  return (
    <article className="metric-detail-card">
      <div className="metric-detail-card__top">
        <span>{metric.label}</span>

        <span className="metric-detail-card__icon">
          <Icon size={19} />
        </span>
      </div>

      <strong className="metric-detail-card__value">
        {valueLabel}
        {metric.format === 'percent' && metric.status === 'available' ? '%' : ''}
      </strong>

      <p className="metric-detail-card__description">
        {metric.description}
      </p>

      {metric.demo && (
        <div className="metric-detail-card__change">
          <span>Dados demonstrativos</span>
        </div>
      )}
    </article>
  );
}
