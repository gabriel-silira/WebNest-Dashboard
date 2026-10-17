
import { useState } from 'react';
import {
  Bell,
  Check,
  Camera,
  ShieldCheck,
  UserRound,
  Database,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { loadTheme, saveTheme } from '../lib/theme.js';

const SETTINGS_KEY = 'webnest-dashboard-settings';

const DEFAULT_SETTINGS = {
  displayName: 'Teste',
  handle: '@teste',
  email: '',
  notifications: {
    performance: true,
    publications: true,
    weeklyReport: false,
  },
};

function loadSettings(account) {
  const accountSettings = {
    ...DEFAULT_SETTINGS,
    displayName: account.name,
    handle: account.handle,
  };

  try {
    const saved = localStorage.getItem(SETTINGS_KEY);

    if (!saved) return accountSettings;

    const parsed = JSON.parse(saved);

    return {
      ...accountSettings,
      // O perfil é lido da conta autenticada; apenas estas preferências
      // continuam locais até existir uma central de notificações.
      email: parsed.email ?? '',
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(parsed.notifications ?? {}),
      },
    };
  } catch {
    return accountSettings;
  }
}

function SettingToggle({ title, description, checked, onChange }) {
  return (
    <div className="setting-row">
      <div className="setting-row__info">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <button
        type="button"
        className={`setting-toggle ${checked ? 'is-enabled' : ''}`}
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  );
}

export default function Settings({ account, connectionStatus, onAccountUpdate }) {
  const [initialSettings] = useState(() => loadSettings(account));
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || loadTheme());
  const [themeFeedback, setThemeFeedback] = useState('');

  function changeTheme(value) {
    setTheme(value);
    const persisted = saveTheme(value);
    setThemeFeedback(persisted
      ? 'Tema aplicado e salvo neste navegador.'
      : 'Tema aplicado. O navegador não permitiu salvar a preferência.');
  }

  const [displayName, setDisplayName] = useState(initialSettings.displayName);
  const [handle, setHandle] = useState(initialSettings.handle);
  const [email, setEmail] = useState(initialSettings.email);

  const [notifications, setNotifications] = useState(
    initialSettings.notifications
  );

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  function updateNotification(key, value) {
    setNotifications((current) => ({
      ...current,
      [key]: value,
    }));
    setSaved(false);
  }

  
  async function handleSave(event) {
    event.preventDefault();

    const normalizedName = displayName.trim();
    const normalizedHandle = `@${handle.trim().replace(/^@+/, '')}`;

    if (!normalizedName || normalizedHandle === '@') {
      setSaveError('Informe um nome de exibição e um usuário do Instagram.');
      return;
    }

    setSaving(true);
    setSaved(false);
    setSaveError('');

    const settings = {
      displayName: normalizedName,
      handle: normalizedHandle,
      email,
      notifications,
    };

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          dashboard_display_name: normalizedName,
          dashboard_instagram_handle: normalizedHandle,
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('A conta não retornou os dados atualizados.');

      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch {
        console.warn('As preferências locais não puderam ser salvas.');
      }
      onAccountUpdate?.(data.user);
      setSaved(true);
    } catch (error) {
      setSaved(false);
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o perfil da conta.',
      );
    } finally {
      setSaving(false);
    }
  }


  return (
    <section className="settings-page">
      <header className="settings-header">
        <div>
          <h1>Configurações</h1>
          <p>Gerencie sua conta e personalize sua experiência.</p>
        </div>
      </header>

      <div className="settings-notice">
        <span className="settings-notice__dot" />
        O nome e o usuário do Instagram são salvos na sua conta.
      </div>

      <section className="card settings-card" aria-labelledby="appearance-title">
        <div className="settings-card__heading">
          <span className="settings-card__icon"><Palette size={20} aria-hidden="true" /></span>
          <div>
            <h2 id="appearance-title">Aparência</h2>
            <p className="card__sub">Escolha o tema da Dashboard. A preferência é salva automaticamente neste navegador.</p>
          </div>
        </div>
        <div className="theme-options" role="group" aria-label="Tema da Dashboard">
          {[
            { value: 'dark', label: 'Escuro', description: 'Fundo azul-marinho e detalhes em ciano.', Icon: Moon },
            { value: 'light', label: 'Claro', description: 'Superfícies claras e contraste suave.', Icon: Sun },
          ].map(({ value, label, description, Icon }) => (
            <button
              className={`theme-option${theme === value ? ' is-selected' : ''}`}
              type="button"
              aria-pressed={theme === value}
              data-theme-value={value}
              onClick={() => changeTheme(value)}
              key={value}
            >
              <span className="theme-option__indicator" aria-hidden="true" />
              <Icon size={22} aria-hidden="true" />
              <span className="theme-option__copy"><strong>{label}</strong><span>{description}</span></span>
            </button>
          ))}
        </div>
        <p className="theme-feedback" role="status">{themeFeedback}</p>
      </section>

      <form onSubmit={handleSave} className="settings-layout">
        <div className="settings-main">
          <section className="card settings-card">
            <div className="settings-card__heading">
              <span className="settings-card__icon">
                <UserRound size={20} />
              </span>
              <div>
                <h2>Perfil da conta</h2>
                <p className="card__sub">
                  Informações da conta exibida no dashboard.
                </p>
              </div>
            </div>

            <div className="settings-fields">
              <label className="settings-field">
                <span>Nome de exibição</span>
                <input
                  value={displayName}
                  onChange={(event) => {
                    setDisplayName(event.target.value);
                    setSaved(false);
                    setSaveError('');
                  }}
                  required
                  maxLength={60}
                />
              </label>

              <label className="settings-field">
                <span>Usuário do Instagram</span>
                <div className="settings-input-with-icon">
                  <Camera size={18} />
                  <input
                    value={handle}
                    onChange={(event) => {
                      setHandle(event.target.value);
                      setSaved(false);
                    setSaveError('');
                    }}
                    required
                    maxLength={30}
                  />
                </div>
              </label>

              <label className="settings-field">
                <span>E-mail para notificações</span>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setSaved(false);
                  }}
                />
                <small>Opcional. Nenhum e-mail será enviado nesta versão.</small>
              </label>
            </div>
          </section>

          <section className="card settings-card">
            <div className="settings-card__heading">
              <span className="settings-card__icon">
                <Bell size={20} />
              </span>
              <div>
                <h2>Notificações</h2>
                <p className="card__sub">
                  Escolha quais avisos deseja ativar na interface.
                </p>
              </div>
            </div>

            <div className="settings-options">
              <SettingToggle
                title="Desempenho da conta"
                description="Avisos sobre mudanças nos indicadores."
                checked={notifications.performance}
                onChange={(value) => updateNotification('performance', value)}
              />

              <SettingToggle
                title="Desempenho das publicações"
                description="Acompanhe atualizações sobre o conteúdo."
                checked={notifications.publications}
                onChange={(value) => updateNotification('publications', value)}
              />

              <SettingToggle
                title="Resumo semanal"
                description="Preferência para um resumo semanal de métricas."
                checked={notifications.weeklyReport}
                onChange={(value) => updateNotification('weeklyReport', value)}
              />
            </div>
          </section>

          <div className="settings-actions">
            <button className="settings-save-button" type="submit" disabled={saving}>
              <Check size={17} />
              {saving ? 'Salvando perfil...' : 'Salvar alterações'}
            </button>

            {saved && (
              <p className="settings-save-feedback" role="status">
                Perfil salvo com sucesso na sua conta.
              </p>
            )}

            {saveError && (
              <p className="auth-feedback auth-feedback--error" role="alert">
                {saveError}
              </p>
            )}
          </div>
        </div>

        <aside className="settings-side">
          <section className="card settings-status-card">
            <div className="settings-card__heading">
              <span className="settings-card__icon">
                <ShieldCheck size={20} />
              </span>
              <div>
                <h2>Integração</h2>
                <p className="card__sub">Status da conexão</p>
              </div>
            </div>

            <div className="settings-status">
              <div>
                <strong>
                  {connectionStatus === 'loading'
                    ? 'Verificando conexão'
                    : connectionStatus === 'error'
                      ? 'Conexão indisponível'
                      : 'Instagram conectado'}
                </strong>
                <p>
                  {connectionStatus === 'loading'
                    ? 'Buscando os dados da conta'
                    : account.handle}
                </p>
              </div>
            </div>

            <p className="settings-help">
              Os dados de perfil exibidos no dashboard são atualizados quando
              você salva este formulário.
            </p>
          </section>

          <section className="card settings-status-card">
            <div className="settings-card__heading">
              <span className="settings-card__icon">
                <Database size={20} />
              </span>
              <div>
                <h2>Armazenamento</h2>
                <p className="card__sub">Onde os dados ficam</p>
              </div>
            </div>

            <div className="settings-storage">
              <strong>Preferências do navegador</strong>
              <p>
                E-mail e preferências de notificações ficam neste navegador.
              </p>
            </div>
          </section>
        </aside>
      </form>
    </section>
  );
}
