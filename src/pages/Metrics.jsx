
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import PeriodSelect from '../components/PeriodSelect.jsx';
import ChartCard from '../components/ChartCard.jsx';
import MetricDetailCard from '../components/MetricDetailCard.jsx';
import { formatNumber } from '../utils/format.js';
import '../styles/components.css';

const descriptions = {
  followers: 'Total atual de seguidores da conta.',
  reach: 'Contas únicas alcançadas no período diário consultado.',
  views: 'Visualizações no período diário consultado.',
  interactions: 'Interações no período diário consultado.',
  engaged: 'Contas que interagiram no período diário consultado.',
};

function getInsightValue(insights, name) {
  const insight = insights?.find((item) => item.name === name);

  if (!insight) return null;

  if (insight.total_value?.value !== undefined) {
    return insight.total_value.value;
  }

  const values = insight.values;

  if (Array.isArray(values) && values.length > 0) {
    return values[values.length - 1].value ?? null;
  }

  return null;
}

export default function Metrics({ account }) {
  const [periodId, setPeriodId] = useState('30d');
  const [instagram, setInstagram] = useState(null);
  const [instagramLoading, setInstagramLoading] = useState(true);
  const [instagramError, setInstagramError] = useState('');

  const periodDays =
    periodId === '7d' ? 7 :
    periodId === '90d' ? 90 :
    30;

  useEffect(() => {
    let active = true;

    async function loadInstagram() {
      setInstagramLoading(true);
      setInstagramError('');

      try {
        const { data, error } = await supabase.functions.invoke(
          'instagram-insights',
          {
            body: { periodDays },
          },
        );

        if (!active) return;

        if (error) {
          console.error('Erro na Edge Function:', error);
          setInstagramError(
            'Não foi possível carregar os dados do Instagram.',
          );
          return;
        }

        if (data?.error) {
          setInstagramError(data.error);
          return;
        }

        if (!data?.profile) {
          setInstagramError(
            'A API não retornou os dados do perfil.',
          );
          return;
        }

        setInstagram(data);
      } catch (error) {
        if (!active) return;

        console.error('Erro ao carregar o Instagram:', error);
        setInstagramError('Ocorreu um erro inesperado.');
      } finally {
        if (active) setInstagramLoading(false);
      }
    }

    loadInstagram();

    return () => {
      active = false;
    };
  }, [periodDays]);

  const reachHistory = Array.isArray(instagram?.reachHistory)
    ? [...instagram.reachHistory]
        .filter(
          (point) =>
            typeof point.date === 'string' &&
            Number.isFinite(Number(point.value)),
        )
        .map((point) => ({
          date: point.date,
          value: Number(point.value),
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const followersHistory = Array.isArray(instagram?.followersHistory)
    ? [...instagram.followersHistory]
        .filter(
          (point) =>
            typeof point.date === 'string' &&
            Number.isFinite(Number(point.value)),
        )
        .map((point) => ({
          date: point.date,
          value: Number(point.value),
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const realMetrics = [
    {
      id: 'reach',
      label: 'Contas alcançadas',
      value: getInsightValue(instagram?.insights, 'reach'),
      description: descriptions.reach,
    },
    {
      id: 'views',
      label: 'Visualizações',
      value: getInsightValue(instagram?.insights, 'views'),
      description: descriptions.views,
    },
    {
      id: 'interactions',
      label: 'Interações',
      value: getInsightValue(instagram?.insights, 'total_interactions'),
      description: descriptions.interactions,
    },
    {
      id: 'engaged',
      label: 'Contas com engajamento',
      value: getInsightValue(instagram?.insights, 'accounts_engaged'),
      description: descriptions.engaged,
    },
  ];

  const metrics = [
    {
      id: 'followers',
      label: 'Seguidores',
      value: instagram?.profile?.followers_count ?? null,
      description: descriptions.followers,
    },
    ...realMetrics,
  ];

  // Taxa por publicação: (curtidas + comentários) / seguidores atuais * 100.
  // A API retorna apenas as 12 publicações mais recentes; o gráfico usa as que
  // estão dentro do período selecionado e têm contagens numéricas disponíveis.
  const engagementSeries = (() => {
    const followers = Number(instagram?.profile?.followers_count);

    if (!Number.isFinite(followers) || followers <= 0) return [];
    if (!Array.isArray(instagram?.media)) return [];

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDays);

    return instagram.media
      .filter((post) => {
        if (!post.timestamp) return false;
        const publishedAt = new Date(post.timestamp);
        if (Number.isNaN(publishedAt.getTime()) || publishedAt < cutoff) {
          return false;
        }

        return (
          Number.isFinite(Number(post.like_count)) &&
          post.like_count !== null &&
          post.like_count !== undefined &&
          Number.isFinite(Number(post.comments_count)) &&
          post.comments_count !== null &&
          post.comments_count !== undefined
        );
      })
      .map((post) => ({
        date: new Date(post.timestamp).toISOString().slice(0, 10),
        value: Number(
          (((Number(post.like_count) + Number(post.comments_count)) / followers) * 100).toFixed(2),
        ),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  })();

  const engagementDescription = instagramLoading
    ? 'Carregando publicações do Instagram...'
    : !instagram?.profile?.followers_count
      ? 'Não foi possível calcular: quantidade de seguidores indisponível.'
      : engagementSeries.length > 0
        ? `Taxa por publicação: (curtidas + comentários) ÷ ${formatNumber(instagram.profile.followers_count)} seguidores × 100. Considera ${engagementSeries.length} publicação(ões) retornada(s) pela API nos últimos ${periodDays} dias; não é uma série diária da conta.`
        : `Não há publicações com curtidas e comentários disponíveis nos últimos ${periodDays} dias entre as até 12 publicações retornadas pela API.`;

  return (
    <section className="metrics-page">
      <div className="metrics-page__header">
        <div>
          <h1>Métricas</h1>

          <p className="metrics-page__subtitle">
            Acompanhe o desempenho e a evolução da conta.
          </p>
        </div>

        <div className="metrics-period">
          <span>Período dos gráficos</span>

          <PeriodSelect
            id="metrics-period"
            value={periodId}
            onChange={setPeriodId}
          />
        </div>
      </div>

      <div
        className={`metrics-demo-notice ${instagramError ? 'is-error' : ''}`}
        role="status"
      >
        <span className="metrics-demo-notice__dot" />

        {instagramLoading
          ? 'Carregando dados do Instagram...'
          : instagramError
            ? `Erro: ${instagramError}`
            : `Instagram conectado: ${account.handle}`}
      </div>

      <div className="metrics-detail-grid">
        {metrics.map((metric) => (
          <MetricDetailCard key={metric.id} metric={metric} />
        ))}
      </div>

      {instagram?.insightsError && (
        <p role="status">
          Alguns Insights não estão disponíveis: {instagram.insightsError}
        </p>
      )}

      <div className="metrics-charts-grid">
        <ChartCard
          id="metrics-followers"
          title="Crescimento de seguidores"
          description={
            instagramLoading
              ? 'Carregando histórico de seguidores...'
              : instagram?.followersHistoryError
                ? 'Não foi possível consultar o histórico armazenado.'
                : followersHistory.length > 0
                  ? `Total de seguidores registrado por dia nos últimos ${periodDays} dias. O histórico começa a partir da primeira coleta.`
                  : 'O histórico está começando a ser construído. Os dados aparecerão após a primeira coleta.'
          }
          data={followersHistory}
          unit="seguidores"
        />

        <ChartCard
          id="metrics-reach"
          title="Evolução do alcance"
          description={
            instagramLoading
              ? 'Carregando histórico real do Instagram...'
              : instagram?.reachHistoryError
                ? 'Não foi possível obter o histórico real.'
                : `Contas únicas alcançadas por dia nos últimos ${periodDays} dias.`
          }
          data={reachHistory}
          unit="contas alcançadas"
        />

        <ChartCard
          id="metrics-engagement"
          title="Taxa de engajamento"
          description={engagementDescription}
          data={engagementSeries}
          unit="%"
          className="metrics-chart-wide"
        />
      </div>

    </section>
  );
}
