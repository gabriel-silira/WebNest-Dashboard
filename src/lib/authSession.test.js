import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearRecoverySession,
  isPasswordSession,
  isRecoverySession,
  rememberRecoverySession,
  sessionAccess,
  wasRecoverySession,
} from './authSession.js';

const claims = (...methods) => ({
  amr: methods.map((method) => ({ method })),
});

test('distingue login por senha e sessão de recuperação após refresh', () => {
  assert.equal(isPasswordSession(claims('password')), true);
  assert.equal(isPasswordSession(claims('password', 'token_refresh')), true);
  assert.equal(isPasswordSession(claims('recovery')), false);
  assert.equal(isPasswordSession(claims('recovery', 'token_refresh')), false);
  assert.equal(isRecoverySession(claims('recovery', 'token_refresh')), true);
  assert.equal(isRecoverySession({ amr: ['recovery', 'token_refresh'] }), true);
  assert.equal(isPasswordSession({ amr: ['password', 'token_refresh'] }), true);
  assert.equal(isPasswordSession(claims('token_refresh')), false);
});

test('F5 e URL direta não liberam a Dashboard durante recuperação', () => {
  assert.deepEqual(sessionAccess(claims('recovery')), {
    recovering: true,
    dashboardAllowed: false,
  });
  assert.deepEqual(sessionAccess(claims('recovery', 'token_refresh')), {
    recovering: true,
    dashboardAllowed: false,
  });
  assert.deepEqual(sessionAccess(claims('otp'), false, true), {
    recovering: true,
    dashboardAllowed: false,
  });
  assert.deepEqual(sessionAccess(claims('password')), {
    recovering: false,
    dashboardAllowed: true,
  });
});

test('identifica após F5 apenas a mesma sessão de recuperação', () => {
  const storage = new Map();
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
  };

  rememberRecoverySession('session-a');
  assert.equal(wasRecoverySession('session-a'), true);
  assert.equal(wasRecoverySession('session-b'), false);
  clearRecoverySession();
  assert.equal(wasRecoverySession('session-a'), false);
  delete globalThis.window;
});
