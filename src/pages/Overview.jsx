import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import MetricDetailCard from '../components/MetricDetailCard.jsx';
import ChartCard from '../components/ChartCard.jsx';
import PostsTable from '../components/PostsTable.jsx';
import StatePanel from '../components/StatePanel.jsx';
import { supabase } from '../lib/supabase.js';
import { insightMetric, PERIOD_DAYS } from '../lib/insights.js';

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (point) =>
        typeof point.date === 'string' &&
        point.value !== null && point.value !== undefined &&
        Number.isFinite(Number(point.value)),
    )
    .map((point) => ({ date: point.date, value: Number(point.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function normalizePosts(media) {
  if (!Array.isArray(media)) return [];

  return [...media]
    .sort((a, b) => new Date(b.timestamp ?? 0) - new Date(a.timestamp ?? 0))
    .slice(0, 3)
    .map((post) => ({
      id: post.id,
      title: post.caption?.trim() ? post.caption : 'Publicação sem legenda',
      date: post.timestamp?.slice(0, 10) ?? '',
      type:
        post.media_type === 'VIDEO'
          ? 'reel'
          : post.media_type === 'CAROUSEL_ALBUM'
            ? 'carrossel'
            : 'imagem',
      imageUrl: post.media_type === 'VIDEO'
        ? post.thumbnail_url || null
        : post.media_url || post.thumbnail_url || null,
      likes: post.like_count,
      comments: post.comments_count,
      // O endpoint atual não fornece alcance por publicação.
      reach: null,
    }));
}

// status continua disponível para pré-visualizar estados por ?state=.
export default function Overview({ account, status, onConnectionStatus }) {
  const [periodId, setPeriodId] = useState('30d');
  const [instagram, setInstagram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);
  const periodDays = PERIOD_DAYS[periodId];

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadOverview() {
      setLoading(true);
      setError('');
      setInstagram(null);

      try {
        const { data, error: functionError } = await supabase.functions.invoke(
          'instagram-insights',
          { body: { periodDays }, signal: controller.signal },
        );

        if (!active) return;
        if (functionError) throw functionError;
        if (data?.error) throw new Error(data.error);
        if (!data?.profile) {
          throw new Error('A API não retornou os dados do perfil do Instagram.');
        }

        setInstagram(data);
      } catch (loadError) {
        if (!active) return;
        console.error('Falha ao carregar a visão geral:', loadError);
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Não foi possível carregar os dados do Instagram.',
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOverview();
    return () => {
      active = false;
      controller.abort();
    };
  }, [periodDays, reloadVersion]);

  const reachHistory = useMemo(
    () => normalizeHistory(instagram?.reachHistory),
    [instagram],
  );
  const followersHistory = useMemo(
    () => normalizeHistory(instagram?.followersHistory),
    [instagram],
  );
  const posts = useMemo(() => normalizePosts(instagram?.media), [instagram]);
  const followers = instagram?.profile?.followers_count == null
    ? null
    : Number(instagram.profile.followers_count);
  const engagementSeries = useMemo(() => {
    if (!Number.isFinite(followers) || followers <= 0) return [];

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDays);

    return (instagram?.media ?? [])
      .filter(
        (post) => {
          const publishedAt = new Date(post.timestamp);

          return (
            post.timestamp &&
            !Number.isNaN(publishedAt.getTime()) &&
            publishedAt >= cutoff &&
            post.like_count !== null && post.like_count !== undefined &&
            post.comments_count !== null && post.comments_count !== undefined &&
            Number.isFinite(Number(post.like_count)) &&
            Number.isFinite(Number(post.comments_count))
          );
        },
      )
      .map((post) => ({
        date: post.timestamp,
        value: ((Number(post.like_count) + Number(post.comments_count)) / followers) * 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [followers, instagram, periodDays]);
  const engagement = engagementSeries.at(-1)?.value ?? null;
  const metrics = [
    {
      id: 'followers',
      label: 'Seguidores',
      value: Number.isFinite(followers) ? followers : null,
      status: loading ? 'loading' : Number.isFinite(followers) ? 'available' : 'unavailable',
      description: 'Total atual de seguidores da conta.',
    },
    {
      id: 'reach',
      label: 'Alcance',
      ...insightMetric(instagram, 'reach', periodDays, loading),
      description: 'Contas únicas alcançadas no período selecionado.',
    },
    {
      id: 'views',
      label: 'Visualizações',
      ...insightMetric(instagram, 'views', periodDays, loading),
      description: 'Visualizações no período selecionado.',
    },
    {
      id: 'engagement',
      label: 'Taxa de engajamento',
      value: engagement,
      status: loading ? 'loading' : engagement === null ? 'unavailable' : 'available',
      format: 'percent',
      description: 'Curtidas e comentários da publicação mais recente em relação aos seguidores.',
    },
  ];

  const forcedStatus = status && status !== 'demo' ? status : null;
  const currentStatus = forcedStatus ?? (loading ? 'loading' : error ? 'error' : 'connected');

  useEffect(() => {
    onConnectionStatus?.(currentStatus);
  }, [currentStatus, onConnectionStatus]);
  return (
    <>
      <PageHeader
        account={account}
        period={periodId}
        onPeriodChange={setPeriodId}
        status={currentStatus}
      />

      {currentStatus === 'loading' ? (
        <StatePanel variant="loading" />
      ) : currentStatus === 'error' ? (
        <StatePanel
          variant="error"
          action={{ label: 'Tentar novamente', onClick: () => setReloadVersion((version) => version + 1) }}
        />
      ) : currentStatus === 'no-account' ? (
        <StatePanel variant="no-account" />
      ) : (
        <>
          <section className="metrics" aria-labelledby="metrics-title">
            <h2 id="metrics-title" className="sr-only">
              Métricas principais
            </h2>
            {metrics.map((metric) => (
              <MetricDetailCard key={metric.id} metric={metric} />
            ))}
          </section>

          {instagram?.insightsPeriodDays !== periodDays && (
            <p role="alert">A função de Insights publicada precisa ser atualizada para confirmar o período dos cartões.</p>
          )}
          {instagram?.insightsError && (
            <p role="status">{instagram.insightsError}</p>
          )}

          <section className="charts">
            {reachHistory.length > 0 && (
              <ChartCard
                id="reach"
                title="Evolução do alcance"
                description={`Contas alcançadas por dia · últimos ${periodDays} dias`}
                data={reachHistory}
                unit="contas"
              />
            )}
            {followersHistory.length > 0 && (
              <ChartCard
                id="followers"
                title="Crescimento de seguidores"
                description={`Total de seguidores registrado por dia · últimos ${periodDays} dias`}
                data={followersHistory}
                unit="seguidores"
              />
            )}
            {reachHistory.length === 0 && followersHistory.length === 0 && (
              <StatePanel variant="empty" compact />
            )}
          </section>

          <section className="card recent-publications" aria-labelledby="posts-title">
            <div className="card__head">
              <h2 id="posts-title">Publicações recentes</h2>
              <a className="link" href="#publicacoes">
                Ver todas <ArrowRight aria-hidden="true" size={16} />
              </a>
            </div>
            {posts.length > 0 ? <PostsTable posts={posts} /> : <StatePanel variant="empty" compact />}
          </section>
        </>
      )}
    </>
  );
}
