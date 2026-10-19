export const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90 };

export function insightMetric(data, name, periodDays, loading = false) {
  if (loading) return { value: null, status: 'loading' };
  if (!data || data.insightsPeriodDays !== periodDays) {
    return { value: null, status: 'error' };
  }
  if (data?.insightsErrors?.[name]) return { value: null, status: 'error' };

  // Somente total_value é um total de contas no intervalo. Uma série diária
  // jamais pode servir de fallback, especialmente para alcance único.
  const item = Array.isArray(data?.insights)
    ? data.insights.find((insight) => insight?.name === name)
    : null;
  const value = item?.total_value?.value;

  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? { value, status: 'available' }
    : { value: null, status: 'unavailable' };
}
