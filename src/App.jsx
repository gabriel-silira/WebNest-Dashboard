
import { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Logo from './components/Logo.jsx';
import Auth from './pages/Auth.jsx';
import Metrics from './pages/Metrics.jsx';
import Overview from './pages/Overview.jsx';
import Placeholder from './pages/Placeholder.jsx';
import Publications from './pages/Publications.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Settings from './pages/Settings.jsx';
import { supabase } from './lib/supabase.js';
import {
  clearRecoverySession,
  rememberRecoverySession,
  sessionAccess,
  wasRecoverySession,
} from './lib/authSession.js';
import { demoAccount } from './data/demo.js';
import { NAV_ITEMS } from './data/navigation.js';
import { Menu } from 'lucide-react';

const VALID_STATES = ['demo', 'loading', 'no-account', 'error', 'empty'];

function idFromHash() {
  const id = window.location.hash.slice(1);
  return NAV_ITEMS.some((item) => item.id === id)
    ? id
    : NAV_ITEMS[0].id;
}

// Apenas para pré-visualizar estados em desenvolvimento: ?state=loading
function stateFromUrl() {
  const state = new URLSearchParams(window.location.search).get('state');
  return VALID_STATES.includes(state) ? state : 'demo';
}

export default function App() {
  const [activeId, setActiveId] = useState(idFromHash);
  const [menuOpen, setMenuOpen] = useState(false);
  const [status] = useState(stateFromUrl);

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [dashboardAllowed, setDashboardAllowed] = useState(false);
  const [instagramStatus, setInstagramStatus] = useState('loading');

  const account = useMemo(() => {
    const metadata = session?.user?.user_metadata ?? {};
    const name = metadata.dashboard_display_name?.trim() || demoAccount.name;
    const savedHandle = metadata.dashboard_instagram_handle?.trim();
    const handle = savedHandle
      ? `@${savedHandle.replace(/^@+/, '')}`
      : demoAccount.handle;

    return {
      ...demoAccount,
      name,
      handle,
      initials: name.slice(0, 2).toUpperCase() || demoAccount.initials,
    };
  }, [session]);

  // INITIAL_SESSION também é avaliado: PASSWORD_RECOVERY não é repetido após F5.
  useEffect(() => {
    let isMounted = true;
    let checkId = 0;

    async function checkSession(event, newSession) {
      const currentCheck = ++checkId;

      if (!newSession) {
        if (!isMounted) return;
        clearRecoverySession();
        setSession(null);
        setRecoveryMode(false);
        setDashboardAllowed(false);
        setAuthError(false);
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);
      const { data, error } = await supabase.auth
        .getClaims(newSession.access_token)
        .catch(() => ({ data: null, error: true }));

      if (!isMounted || currentCheck !== checkId) return;

      const claims = data?.claims;
      if (error || !claims || claims.sub !== newSession.user.id) {
        setSession(null);
        setRecoveryMode(false);
        setDashboardAllowed(false);
        setAuthError(true);
        setAuthLoading(false);
        return;
      }

      const { recovering, dashboardAllowed: canAccessDashboard } =
        sessionAccess(
          claims,
          event === 'PASSWORD_RECOVERY',
          wasRecoverySession(claims.session_id),
        );

      if (recovering) {
        rememberRecoverySession(claims.session_id);
      } else {
        clearRecoverySession();
      }

      setSession(newSession);
      setRecoveryMode(recovering);
      setDashboardAllowed(canAccessDashboard);
      setAuthError(false);
      setAuthLoading(false);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;

      setAuthLoading(true);
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);

      // Adia a verificação para fora do callback do Supabase Auth.
      setTimeout(() => {
        if (isMounted) void checkSession(event, newSession);
      }, 0);
    });

    return () => {
      isMounted = false;
      checkId += 1;
      subscription.unsubscribe();
    };
  }, []);

  // Mantém a navegação pelas seções do dashboard.
  useEffect(() => {
    const onHashChange = () => setActiveId(idFromHash());

    window.addEventListener('hashchange', onHashChange);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  // Fecha o menu mobile ao pressionar Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Erro ao sair:', error.message);
    } else {
      setMenuOpen(false);
      setRecoveryMode(false);
    }
  }

  // Aguarda a verificação inicial da sessão.
  if (authLoading) {
    return (
      <div className="auth-loading" role="status">
        Carregando sua sessão...
      </div>
    );
  }

  if (authError) {
    return (
      <div className="auth-loading" role="alert">
        Não foi possível verificar sua sessão.
        <button type="button" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
        <button type="button" onClick={handleLogout}>
          Sair
        </button>
      </div>
    );
  }

  // A recuperação tem prioridade sobre o dashboard.
  if (recoveryMode && session) {
    return <ResetPassword />;
  }

  // Sem sessão autenticada, mostra a página de login.
  if (!session) {
    return <Auth />;
  }

  if (!dashboardAllowed) {
    return (
      <div className="auth-loading" role="alert">
        Esta sessão não pode acessar a Dashboard. Entre com sua senha.
        <button type="button" onClick={handleLogout}>
          Sair
        </button>
      </div>
    );
  }

  const activeItem = NAV_ITEMS.find((item) => item.id === activeId);

  return (
    <div className="app">
      <header className="mobilebar">
        <button
          type="button"
          className="icon-button"
          aria-label="Abrir menu"
          aria-expanded={menuOpen}
          aria-controls="sidebar"
          onClick={() => setMenuOpen(true)}
        >
          <Menu aria-hidden="true" size={22} />
        </button>

        <Logo />
      </header>

      <Sidebar
        items={NAV_ITEMS}
        activeId={activeId}
        account={account}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={handleLogout}
        connectionStatus={instagramStatus}
      />

      {menuOpen && (
        <div
          className="backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="main" id="conteudo">
        <div className="content">
          {activeId === 'visao-geral' ? (
            <Overview
              account={account}
              status={status}
              onConnectionStatus={setInstagramStatus}
            />
          ) : activeId === 'publicacoes' ? (
            <Publications account={account} />
          ) : activeId === 'metricas' ? (
            <Metrics account={account} />
          ) : activeId === 'configuracoes' ? (
            <Settings
              account={account}
              connectionStatus={instagramStatus}
              onAccountUpdate={(user) => {
                setSession((currentSession) =>
                  currentSession
                    ? { ...currentSession, user }
                    : currentSession,
                );
                setInstagramStatus('connected');
              }}
            />
          ) : (
            <Placeholder title={activeItem.label} />
          )}
        </div>
      </main>
    </div>
  );
}
