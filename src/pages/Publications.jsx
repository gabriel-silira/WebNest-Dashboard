import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Heart,
  MessageCircle,
  ExternalLink,
  Images,
  Film,
  LayoutGrid,
  RefreshCw,
} from 'lucide-react';

import { supabase } from '../lib/supabase';

const FILTERS = [
  { id: 'todos', label: 'Todos', icon: LayoutGrid },
  { id: 'imagem', label: 'Imagens', icon: Images },
  { id: 'reel', label: 'Reels', icon: Film },
  { id: 'carrossel', label: 'Carrosséis', icon: Images },
];

const numberFormat = new Intl.NumberFormat('pt-BR');

const typeLabels = {
  imagem: 'Imagem',
  reel: 'Reel',
  carrossel: 'Carrossel',
  outro: 'Publicação',
};

function formatDate(timestamp) {
  if (!timestamp) return 'Data não disponível';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Data não disponível';

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCount(value) {
  if (value === null || value === undefined || value === '') return '—';

  const number = Number(value);
  return Number.isFinite(number) ? numberFormat.format(number) : '—';
}

function getPostType(mediaType) {
  switch (mediaType) {
    case 'IMAGE':
      return 'imagem';
    case 'VIDEO':
      return 'reel';
    case 'CAROUSEL_ALBUM':
      return 'carrossel';
    default:
      return 'outro';
  }
}

function normalizePost(post) {
  return {
    id: post.id,
    title: post.caption?.trim() || 'Esta publicação não possui legenda.',
    caption: post.caption?.trim() || '',
    type: getPostType(post.media_type),
    date: post.timestamp,
    likes: post.like_count,
    comments: post.comments_count,
    permalink: post.permalink,
    imageUrl: post.media_url ?? post.thumbnail_url ?? null,
  };
}

function StatePanel({ icon: Icon, title, description, action }) {
  return (
    <div className="state state--compact">
      <Icon size={26} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}

export default function Publications({ account }) {
  const [filter, setFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadPublications = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.functions.invoke(
        'instagram-insights',
        {
          body: { periodDays: 30 },
        },
      );

      if (error) {
        console.error('Erro ao carregar publicações do Instagram:', error);
        throw new Error(
          'Não foi possível carregar as publicações do Instagram. Tente novamente.',
        );
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.profile) {
        throw new Error('A API não retornou os dados do perfil do Instagram.');
      }

      setPosts(Array.isArray(data.media) ? data.media.map(normalizePost) : []);
    } catch (error) {
      console.error('Falha ao carregar a página Publicações:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro inesperado ao carregar as publicações.',
      );
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadPublications();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPublications]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');

    return posts.filter((post) => {
      const matchesType = filter === 'todos' || post.type === filter;
      const searchableText = `${post.title} ${post.caption}`.toLocaleLowerCase(
        'pt-BR',
      );
      const matchesSearch = searchableText.includes(query);

      return matchesType && matchesSearch;
    });
  }, [posts, filter, search]);

  const totals = useMemo(
    () =>
      posts.reduce(
        (acc, post) => ({
          likes: acc.likes + (Number(post.likes) || 0),
          comments: acc.comments + (Number(post.comments) || 0),
        }),
        { likes: 0, comments: 0 },
      ),
    [posts],
  );

  return (
    <>
  <header className="page-header">
    <div>
      <h1>Publicações</h1>
      <p>Explore o desempenho dos seus conteúdos no Instagram.</p>
    </div>

    <button
      className="filter-button"
      type="button"
      onClick={loadPublications}
      disabled={loading}
    >
      <RefreshCw
        size={16}
        aria-hidden="true"
        className={loading ? 'is-spinning' : ''}
      />
      Atualizar
    </button>
  </header>

  {!loading && !errorMessage && account.handle && (
    <div className="instagram-connected">
      <span
        className="instagram-connected__indicator"
        aria-hidden="true"
      />
      <span>
        Instagram conectado: {account.handle}
      </span>
    </div>
  )}

      <section className="metrics" aria-label="Resumo das publicações">
        <article className="publication-summary">
          <span className="publication-summary__label">Publicações carregadas</span>
          <strong className="publication-summary__value">
            {loading ? '—' : formatCount(posts.length)}
          </strong>
        </article>

        <article className="publication-summary">
          <span className="publication-summary__label">Curtidas nas publicações</span>
          <strong className="publication-summary__value">
            {loading ? '—' : formatCount(totals.likes)}
          </strong>
        </article>

        <article className="publication-summary">
          <span className="publication-summary__label">Comentários nas publicações</span>
          <strong className="publication-summary__value">
            {loading ? '—' : formatCount(totals.comments)}
          </strong>
        </article>
      </section>

      <section className="card publications-panel">
        <div className="publications-toolbar">
          <div className="publication-filters" aria-label="Filtrar por tipo">
            {FILTERS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`filter-button${filter === id ? ' is-active' : ''}`}
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <label className="publication-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar publicação..."
              aria-label="Buscar publicação pela legenda"
            />
          </label>
        </div>

        <p className="publications-count" aria-live="polite">
          {loading
            ? 'Carregando publicações...'
            : `${filteredPosts.length} ${
                filteredPosts.length === 1
                  ? 'publicação encontrada'
                  : 'publicações encontradas'
              }`}
        </p>

        {loading ? (
          <StatePanel
            icon={RefreshCw}
            title="Carregando publicações"
            description="Estamos buscando os dados mais recentes da sua conta do Instagram."
          />
        ) : errorMessage ? (
          <StatePanel
            icon={RefreshCw}
            title="Não foi possível carregar"
            description={errorMessage}
            action={
              <button
                className="filter-button is-active"
                type="button"
                onClick={loadPublications}
              >
                <RefreshCw size={16} aria-hidden="true" />
                Tentar novamente
              </button>
            }
          />
        ) : posts.length === 0 ? (
          <StatePanel
            icon={Images}
            title="Nenhuma publicação disponível"
            description="A API não retornou publicações para esta conta. Confira a conexão com o Instagram e tente atualizar."
            action={
              <button
                className="filter-button"
                type="button"
                onClick={loadPublications}
              >
                <RefreshCw size={16} aria-hidden="true" />
                Atualizar
              </button>
            }
          />
        ) : filteredPosts.length > 0 ? (
          <div className="publications-list">
            {filteredPosts.map((post) => (
              <article className="publication-item" key={post.id}>
                <div className="publication-thumbnail">
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="publication-thumbnail__image"
                      loading="lazy"
                    />
                  ) : (
                    post.type === 'reel' ? (
                      <Film size={25} aria-hidden="true" />
                    ) : post.type === 'carrossel' ? (
                      <Images size={25} aria-hidden="true" />
                    ) : (
                      <LayoutGrid size={25} aria-hidden="true" />
                    )
                  )}
                </div>

                <div className="publication-info">
                  <h2>{post.title}</h2>
                  <div className="publication-meta">
                    <span>{typeLabels[post.type]}</span>
                    <span>{formatDate(post.date)}</span>
                  </div>
                  {post.permalink && (
                    <a
                      className="publication-open-link"
                      href={post.permalink}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Ver no Instagram
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  )}
                </div>

                <div className="publication-stat">
                  <Heart size={16} aria-hidden="true" />
                  <span>{formatCount(post.likes)}</span>
                  <span className="publication-stat__label">Curtidas</span>
                </div>

                <div className="publication-stat">
                  <MessageCircle size={16} aria-hidden="true" />
                  <span>{formatCount(post.comments)}</span>
                  <span className="publication-stat__label">Comentários</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <StatePanel
            icon={Search}
            title="Nenhuma publicação encontrada"
            description="Tente mudar o filtro ou usar outro termo de busca."
            action={
              <button
                className="filter-button"
                type="button"
                onClick={() => {
                  setFilter('todos');
                  setSearch('');
                }}
              >
                Limpar filtros
              </button>
            }
          />
        )}

        {!loading && !errorMessage && posts.length > 0 && (
          <p className="publications-footnote">
            Exibindo até {posts.length} publicações retornadas pela API do Instagram.
            Os totais acima consideram somente as publicações carregadas.
          </p>
        )}
      </section>
    </>
  );
}
