
import { useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { clearRecoverySession } from '../lib/authSession.js';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  async function returnToLogin() {
    try {
      const { error: signOutError } = await supabase.auth.signOut({
        scope: 'local',
      });
      if (signOutError) throw signOutError;
    } catch {
      setError('Senha alterada, mas não foi possível encerrar a sessão. Tente sair novamente.');
      return;
    }

    clearRecoverySession();
    window.location.replace('/');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setPasswordUpdated(true);
      setMessage('Senha alterada. Encerrando a sessão...');
      setPassword('');
      setConfirmPassword('');
      await returnToLogin();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível alterar sua senha. Solicite um novo link.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page auth-page--recovery">
      <section className="recovery-card" aria-labelledby="recovery-title">
        <div className="recovery-brand">
          <span className="auth-showcase__brand">
            WebNest<span>Dashboard</span>
          </span>
          <span className="recovery-brand__accent" aria-hidden="true" />
        </div>

        <div className="recovery-card__content">
          <div className="auth-heading recovery-heading">
            <span className="auth-eyebrow">
              <span className="auth-status-dot" />
              RECUPERAÇÃO DE CONTA
            </span>

            <h1 id="recovery-title">Nova <span>senha.</span></h1>

            <p>
              Escolha uma nova senha para proteger o acesso à sua Dashboard.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Nova senha</span>

              <div className="auth-input-wrap">
                <LockKeyhole size={18} />

                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Mínimo de 6 caracteres"
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <label className="auth-field">
              <span>Confirmar nova senha</span>

              <div className="auth-input-wrap">
                <LockKeyhole size={18} />

                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Digite a senha novamente"
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>
            </label>

            {error && (
              <p className="auth-feedback auth-feedback--error" role="alert">
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
              disabled={loading || passwordUpdated}
              aria-busy={loading}
            >
              <span>
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </span>
              {loading ? (
                <LoaderCircle className="recovery-spinner" size={18} aria-hidden="true" />
              ) : (
                <ArrowRight size={18} aria-hidden="true" />
              )}
            </button>

            {passwordUpdated && (
              <button
                type="button"
                className="auth-back-button"
                onClick={returnToLogin}
              >
                Voltar para o login
              </button>
            )}
          </form>

          <p className="recovery-card__footer">
            <ShieldCheck size={16} aria-hidden="true" />
            Proteja o acesso à sua conta WebNest.
          </p>
        </div>
      </section>
    </main>
  );
}
