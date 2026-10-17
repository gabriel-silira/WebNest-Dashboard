import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasPasswordAuthentication,
  isAuthorizedInstagramUser,
} from './authorization.ts';
import {
  isPasswordSession,
  sessionAccess,
} from '../../../src/lib/authSession.js';

const claims = (...methods) => ({
  amr: methods.map((method) => ({ method })),
});

test('aceita senha normal inclusive após renovação do token', () => {
  assert.equal(hasPasswordAuthentication(claims('password')), true);
  assert.equal(hasPasswordAuthentication(claims('token_refresh', 'password')), true);
});

test('bloqueia recuperação inclusive após renovação e sem claim confiável', () => {
  assert.equal(hasPasswordAuthentication(claims('recovery')), false);
  assert.equal(hasPasswordAuthentication(claims('token_refresh', 'recovery')), false);
  assert.equal(hasPasswordAuthentication(claims('password', 'recovery')), false);
  assert.equal(hasPasswordAuthentication(claims('token_refresh')), false);
  assert.equal(hasPasswordAuthentication({}), false);
});

test('frontend e backend concordam com AMR misto e timestamps fora de ordem', () => {
  const cases = [
    {
      amr: [
        { method: 'token_refresh', timestamp: 300 },
        { method: 'password', timestamp: 100 },
      ],
      allowed: true,
    },
    {
      amr: [
        { method: 'password', timestamp: 100 },
        { method: 'totp', timestamp: 200 },
      ],
      allowed: true,
    },
    { amr: ['password', 'token_refresh'], allowed: true },
    {
      amr: [
        { method: 'recovery', timestamp: 100 },
        { method: 'token_refresh', timestamp: 300 },
      ],
      allowed: false,
    },
    {
      amr: [
        { method: 'recovery', timestamp: 300 },
        { method: 'password', timestamp: 100 },
      ],
      allowed: false,
    },
    {
      amr: [
        { method: 'password', timestamp: 300 },
        { method: 'recovery', timestamp: 100 },
      ],
      allowed: false,
    },
    { amr: ['recovery', 'token_refresh'], allowed: false },
    { amr: ['password', 'recovery'], allowed: false },
    { amr: [{ method: 'token_refresh', timestamp: 300 }], allowed: false },
    { amr: [null, { timestamp: 300 }], allowed: false },
    { amr: null, allowed: false },
  ];

  for (const { allowed, ...jwtClaims } of cases) {
    assert.equal(hasPasswordAuthentication(jwtClaims), allowed);
    assert.equal(isPasswordSession(jwtClaims), allowed);
    assert.equal(sessionAccess(jwtClaims).dashboardAllowed, allowed);
  }

  assert.equal(hasPasswordAuthentication(null), false);
  assert.equal(isPasswordSession(null), false);
});

test('autoriza exclusivamente o UUID do proprietário configurado no servidor', () => {
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const otherId = '22222222-2222-4222-8222-222222222222';

  assert.equal(isAuthorizedInstagramUser(ownerId, ownerId), true);
  assert.equal(isAuthorizedInstagramUser(otherId, ownerId), false);
  assert.equal(isAuthorizedInstagramUser(`${ownerId}-copy`, ownerId), false);
  assert.equal(isAuthorizedInstagramUser(ownerId, undefined), false);
  assert.equal(isAuthorizedInstagramUser(ownerId, ''), false);
});
