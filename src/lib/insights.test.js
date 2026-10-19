import assert from 'node:assert/strict';
import test from 'node:test';
import { insightMetric } from './insights.js';

test('distingue zero, ausência, erro, carregamento e resposta de período antigo', () => {
  const response = {
    insightsPeriodDays: 30,
    insights: [
      { name: 'views', total_value: { value: 0 } },
      { name: 'reach', values: [{ value: 5 }, { value: 1 }] },
    ],
    insightsErrors: { accounts_engaged: 'Falha na Meta.' },
  };

  assert.deepEqual(insightMetric(response, 'views', 30), { value: 0, status: 'available' });
  assert.deepEqual(insightMetric(response, 'reach', 30), { value: null, status: 'unavailable' });
  assert.deepEqual(insightMetric(response, 'accounts_engaged', 30), { value: null, status: 'error' });
  assert.deepEqual(insightMetric(response, 'views', 30, true), { value: null, status: 'loading' });
  assert.deepEqual(insightMetric(response, 'views', 7), { value: null, status: 'error' });
  assert.deepEqual(insightMetric({ insights: response.insights }, 'views', 30), { value: null, status: 'error' });
});
