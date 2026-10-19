import assert from 'node:assert/strict';
import test from 'node:test';
import { insightRange, insightUrl, totalValueForMetric } from './insights.ts';

const now = new Date('2026-10-19T15:30:00.000Z');
const api = 'https://graph.instagram.com/v23.0';

for (const [days, sinceDate] of [
  [7, '2026-10-13'],
  [30, '2026-09-20'],
  [90, '2026-07-22'],
]) {
  test(`consulta total agregado dos últimos ${days} dias`, () => {
    const range = insightRange(days, now);
    assert.equal(range.sinceDate, sinceDate);
    assert.equal(range.today, '2026-10-19');
    assert.equal(range.until, Math.floor(now.getTime() / 1000));

    for (const metric of ['views', 'reach', 'total_interactions', 'accounts_engaged']) {
      const url = insightUrl(api, 'ig-user', metric, range);
      assert.equal(url.searchParams.get('metric'), metric);
      assert.equal(url.searchParams.get('period'), 'day');
      assert.equal(url.searchParams.get('metric_type'), 'total_value');
      assert.equal(url.searchParams.get('since'), String(range.since));
      assert.equal(url.searchParams.get('until'), String(range.until));
    }
  });
}

test('histórico de alcance continua sendo série diária separada', () => {
  const url = insightUrl(api, 'ig-user', 'reach_history', insightRange(30, now));
  assert.equal(url.searchParams.get('metric'), 'reach');
  assert.equal(url.searchParams.get('metric_type'), 'time_series');
});

test('preserva zero real e não soma alcance diário nem aceita valor ausente', () => {
  assert.equal(totalValueForMetric({ data: [{ name: 'views', total_value: { value: 0 } }] }, 'views'), 0);
  assert.equal(totalValueForMetric({ data: [{ name: 'views', total_value: { value: 42 } }] }, 'views'), 42);
  assert.equal(totalValueForMetric({ data: [{ name: 'reach', values: [{ value: 5 }, { value: 1 }] }] }, 'reach'), null);
  assert.equal(totalValueForMetric({ data: [] }, 'reach'), null);
  assert.equal(totalValueForMetric({ error: { code: 100 } }, 'views'), null);
  assert.equal(totalValueForMetric({ data: [{ name: 'reach', total_value: { value: '5' } }] }, 'reach'), null);
});
