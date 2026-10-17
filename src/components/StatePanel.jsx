import { AlertTriangle, Inbox, Link2Off } from 'lucide-react';

const VARIANTS = {
  'no-account': {
    icon: Link2Off,
    title: 'Nenhuma conta conectada',
    text: 'Conecte uma conta profissional do Instagram para ver as métricas aqui.',
  },
  error: {
    icon: AlertTriangle,
    title: 'Não foi possível carregar os dados',
    text: 'Tente novamente em instantes. Se o problema continuar, verifique a conexão da conta.',
  },
  empty: {
    icon: Inbox,
    title: 'Nenhuma publicação disponível',
    text: 'As publicações do período selecionado aparecerão aqui quando houver dados.',
  },
};

// action (opcional): { label, onClick } — só será usado quando houver backend.
export default function StatePanel({ variant, compact = false, action }) {
  if (variant === 'loading') {
    return (
      <div className="state state--loading" role="status" aria-live="polite">
        <span className="sr-only">Carregando métricas…</span>
        <div className="skeleton-grid" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton skeleton--card" />
          ))}
          <div className="skeleton skeleton--chart" />
        </div>
      </div>
    );
  }

  const { icon: Icon, title, text } = VARIANTS[variant];
  return (
    <div className={`state${compact ? ' state--compact' : ''}`} role={variant === 'error' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" size={28} strokeWidth={1.6} />
      <h2>{title}</h2>
      <p>{text}</p>
      {action && (
        <button type="button" className="button" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
