
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function clearFeedback() {
    setMessage('');
    setError('');
  }

  function openResetMode() {
    setResetMode(true);
    setPassword('');
    clearFeedback();
  }

  function backToLogin() {
    setResetMode(false);
    setPassword('');
    clearFeedback();
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    clearFeedback();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível entrar. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset(event) {
    event.preventDefault();
    setLoading(true);
    clearFeedback();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: new URL(
            import.meta.env.BASE_URL,
            window.location.origin,
          ).href,
        }
      );

      if (error) throw error;

      setMessage(
        'Se esse e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.'
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível solicitar a recuperação de senha.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-layout">
        <aside className="auth-showcase">
          <div className="auth-showcase__top">
            <span className="auth-showcase__brand">
              WebNest<span>Dashboard</span>
            </span>
          </div>

          <div className="auth-showcase__content">
            <span className="auth-showcase__eyebrow">
              INSTAGRAM ANALYTICS
            </span>

            <h1>
              Crescimento
              <br />
              acompanhado
              <br />
              <span>por dados.</span>
            </h1>

            <p>
              Uma visão clara do desempenho da WebNest,
              das publicações aos resultados.
            </p>

            <div className="auth-preview" aria-hidden="true">
              <div className="auth-preview__header">
                <div>
                  <span className="auth-preview__label">
                    VISÃO GERAL
                  </span>
                  <strong>Desempenho da conta</strong>
                </div>
                <span className="auth-preview__period">30 dias</span>
              </div>

              <div className="auth-preview__metrics">
                <div>
                  <span>Seguidores</span>
                  <strong>Instagram</strong>
                </div>
                <div>
                  <span>Engajamento</span>
                  <strong>Conteúdo</strong>
                </div>
              </div>

              <div className="auth-preview__chart">
                <div className="auth-preview__chart-line" />
                <div className="auth-preview__chart-line" />
                <div className="auth-preview__chart-line" />
                <svg
                  viewBox="0 0 420 100"
                  preserveAspectRatio="none"
                  role="presentation"
                >
                  <defs>
                    <linearGradient
                      id="auth-chart-fill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#43d9e8"
                        stopOpacity=".25"
                      />
                      <stop
                        offset="100%"
                        stopColor="#43d9e8"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 82 C35 76 45 58 80 65 S130 76 160 48 S215 60 245 35 S300 49 330 22 S380 30 420 8 L420 100 L0 100 Z"
                    fill="url(#auth-chart-fill)"
                  />
                  <path
                    d="M0 82 C35 76 45 58 80 65 S130 76 160 48 S215 60 245 35 S300 49 330 22 S380 30 420 8"
                    fill="none"
                    stroke="#43d9e8"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>

              <span className="auth-preview__note">
                Prévia ilustrativa da interface
              </span>
            </div>
          </div>

          <div className="auth-showcase__bottom">
            <span>SEU ESPAÇO DE ANÁLISE</span>
            <span>01 / WEBNEST</span>
          </div>
        </aside>

        <section className="auth-panel">
          <div className="auth-panel__content">
            <div className="auth-heading">
              <span className="auth-eyebrow">
                <span className="auth-status-dot" />
                ACESSO RESTRITO
              </span>

              <h2>
                {resetMode ? (
                  <>
                    Recuperar
                    <br />
                    <span>sua senha.</span>
                  </>
                ) : (
                  <>
                    Bem-vindo
                    <br />
                    <span>de volta.</span>
                  </>
                )}
              </h2>

              <p>
                {resetMode
                  ? 'Informe seu e-mail para receber as instruções de recuperação.'
                  : 'Entre para acompanhar os resultados da sua conta.'}
              </p>
            </div>

            <form
              className="auth-form"
              onSubmit={resetMode ? handlePasswordReset : handleLogin}
            >
              <label className="auth-field">
                <span>E-mail</span>

                <div className="auth-input-wrap">
                  <Mail size={18} aria-hidden="true" />
                  <input
                    type="email"
                    name="email"
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      clearFeedback();
                    }}
                    required
                  />
                </div>
              </label>

              {!resetMode && (
                <label className="auth-field">
                  <span>Senha</span>

                  <div className="auth-input-wrap">
                    <LockKeyhole size={18} aria-hidden="true" />

                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        clearFeedback();
                      }}
                      required
                    />

                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      aria-label={
                        showPassword
                          ? 'Ocultar senha'
                          : 'Mostrar senha'
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </label>
              )}

              {!resetMode && (
                <button
                  type="button"
                  className="auth-text-button"
                  onClick={openResetMode}
                >
                  Esqueci minha senha
                </button>
              )}

              {error && (
                <p
                  className="auth-feedback auth-feedback--error"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {message && (
                <p
                  className="auth-feedback auth-feedback--success"
                  role="status"
                >
                  {message}
                </p>
              )}

              <button
                className="auth-submit"
                type="submit"
                disabled={loading}
              >
                <span>
                  {loading
                    ? 'Aguarde...'
                    : resetMode
                      ? 'Enviar instruções'
                      : 'Entrar na dashboard'}
                </span>

                {!loading && <ArrowRight size={18} />}
              </button>

              {resetMode && (
                <button
                  type="button"
                  className="auth-back-button"
                  onClick={backToLogin}
                >
                  <ArrowLeft size={17} />
                  Voltar para o login
                </button>
              )}
            </form>

            <p className="auth-panel__note">
              Acesso pessoal à WebNest Dashboard.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
