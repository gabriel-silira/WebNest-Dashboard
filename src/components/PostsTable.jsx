import { useState } from 'react';
import { Heart, Image as ImageIcon, Images, MessageCircle, Play } from 'lucide-react';
import { formatDateWithYear, formatMetric } from '../utils/format.js';

const TYPE = {
  reel: { icon: Play, label: 'reel' },
  carrossel: { icon: Images, label: 'carrossel' },
  imagem: { icon: ImageIcon, label: 'imagem' },
};

function PostThumbnail({ post }) {
  const [imageFailed, setImageFailed] = useState(false);
  const { icon: Icon, label } = TYPE[post.type];

  return (
    <span className="recent-post__thumbnail">
      {post.imageUrl && !imageFailed ? (
        <img
          src={post.imageUrl}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Icon
          aria-label={`Miniatura indisponível para ${label}`}
          role="img"
          size={23}
          strokeWidth={1.7}
        />
      )}
    </span>
  );
}

export default function PostsTable({ posts }) {
  return (
    <div className="recent-posts" role="list" aria-label="Três publicações mais recentes">
      {posts.map((post) => (
        <article className="recent-post" role="listitem" key={post.id}>
          <div className="recent-post__main">
            <PostThumbnail post={post} />
            <div className="recent-post__copy">
              <p className="recent-post__caption" title={post.title}>{post.title}</p>
              {post.date ? (
                <time className="recent-post__date" dateTime={post.date}>
                  {formatDateWithYear(post.date)}
                </time>
              ) : (
                <span className="recent-post__date">Data indisponível</span>
              )}
            </div>
          </div>
          <div className="recent-post__stats" aria-label="Métricas da publicação">
            <span className="recent-post__stat">
              <Heart size={15} aria-hidden="true" />
              <span>Curtidas</span>
              <strong>{formatMetric(post.likes)}</strong>
            </span>
            <span className="recent-post__stat">
              <MessageCircle size={15} aria-hidden="true" />
              <span>Comentários</span>
              <strong>{formatMetric(post.comments)}</strong>
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
