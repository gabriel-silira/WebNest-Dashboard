const RECOVERY_SESSION_KEY = 'webnest-recovery-session-id';

export function authenticationMethods(claims) {
  return Array.isArray(claims?.amr)
    ? claims.amr
        .map((entry) =>
          typeof entry === 'string' ? entry : entry?.method
        )
        .filter((method) => typeof method === 'string')
    : [];
}

export function isRecoverySession(claims) {
  return authenticationMethods(claims).includes('recovery');
}

export function isPasswordSession(claims) {
  const methods = authenticationMethods(claims);
  // O timestamp ordena o AMR, mas não apaga a origem de recuperação da sessão.
  return methods.includes('password') && !methods.includes('recovery');
}

export function sessionAccess(claims, recoveryEvent = false, remembered = false) {
  const recovering = recoveryEvent || isRecoverySession(claims) || remembered;
  return {
    recovering,
    dashboardAllowed: !recovering && isPasswordSession(claims),
  };
}

export function rememberRecoverySession(sessionId) {
  if (!sessionId) return;
  try {
    window.sessionStorage.setItem(RECOVERY_SESSION_KEY, sessionId);
  } catch {
    // O claim do JWT continua sendo a fonte primária para a interface.
  }
}

export function wasRecoverySession(sessionId) {
  if (!sessionId) return false;
  try {
    return window.sessionStorage.getItem(RECOVERY_SESSION_KEY) === sessionId;
  } catch {
    return false;
  }
}

export function clearRecoverySession() {
  try {
    window.sessionStorage.removeItem(RECOVERY_SESSION_KEY);
  } catch {
    // Nenhuma credencial é armazenada nesta chave.
  }
}
