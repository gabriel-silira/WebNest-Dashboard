
import PeriodSelect from './PeriodSelect.jsx';
import Avatar from './Avatar.jsx';

const STATUS_LABEL = {
  demo: 'Dados de demonstração',
  empty: 'Dados de demonstração',
  loading: 'Carregando métricas',
  'no-account': 'Nenhuma conta conectada',
  error: 'Falha ao carregar os dados',
  connected: 'Instagram conectado',
};

export default function PageHeader({ account, period, onPeriodChange, status }) {
  const isDemo = status === 'demo' || status === 'empty';
  const isLoading = status === 'loading';

  return (
    <header className="page-header">
      <div>
        <h1>Visão geral</h1>
        <p>
          Acompanhe o desempenho da conta profissional do Instagram em um só lugar.
        </p>
      </div>

      <div className="page-header__tools">
        <span className={`data-status${isDemo ? ' is-demo' : ''}`} role="status">
          <span className="data-status__dot" aria-hidden="true" />
          {status === 'connected'
            ? `Instagram conectado: ${account.handle}`
            : STATUS_LABEL[status]}
        </span>

        <div className="account-chip">
          <Avatar account={account} />
          <span>
            {isLoading ? 'Carregando' : account.name}
            {!isLoading && (
              <small>{status === 'connected' ? 'Conta conectada' : 'Demonstração'}</small>
            )}
          </span>
        </div>

        <PeriodSelect
          id="overview-period"
          value={period}
          onChange={onPeriodChange}
        />
      </div>
    </header>
  );
}
