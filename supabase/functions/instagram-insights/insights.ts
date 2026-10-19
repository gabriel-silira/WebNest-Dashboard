export const CARD_METRICS = [
  "reach",
  "views",
  "total_interactions",
  "accounts_engaged",
] as const;

// Referência: https://developers.facebook.com/documentation/instagram-platform/api-reference/instagram-user/insights

export type CardMetric = typeof CARD_METRICS[number];

export function insightRange(periodDays: number, now: Date) {
  if (![7, 30, 90].includes(periodDays) || Number.isNaN(now.getTime())) {
    throw new Error("Período inválido.");
  }

  // Inclui o dia corrente e os periodDays - 1 dias anteriores em UTC.
  const today = now.toISOString().slice(0, 10);
  const start = new Date(`${today}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - (periodDays - 1));

  return {
    today,
    sinceDate: start.toISOString().slice(0, 10),
    since: Math.floor(start.getTime() / 1000),
    until: Math.floor(now.getTime() / 1000),
  };
}

export function insightUrl(
  apiBase: string,
  userId: string,
  metric: CardMetric | "reach_history",
  range: ReturnType<typeof insightRange>,
) {
  const url = new URL(`${apiBase}/${userId}/insights`);
  url.searchParams.set("metric", metric === "reach_history" ? "reach" : metric);
  url.searchParams.set("period", "day");
  url.searchParams.set(
    "metric_type",
    metric === "reach_history" ? "time_series" : "total_value",
  );
  url.searchParams.set("since", String(range.since));
  url.searchParams.set("until", String(range.until));
  return url;
}

export function totalValueForMetric(result: unknown, metric: CardMetric) {
  if (!result || typeof result !== "object" || !("data" in result)) return null;
  const data = (result as { data?: unknown }).data;
  if (!Array.isArray(data)) return null;
  const item = data.find((entry) => entry?.name === metric);
  const value = item?.total_value?.value;
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}
