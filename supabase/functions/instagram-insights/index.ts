
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.3";
import {
  hasPasswordAuthentication,
  isAuthorizedInstagramUser,
} from "./authorization.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const API_BASE = "https://graph.instagram.com/v23.0";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

async function readJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }

  try {
    const authorization = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const instagramToken = Deno.env.get("INSTAGRAM_ACCESS_TOKEN");
    const ownerId = Deno.env.get("INSTAGRAM_HISTORY_OWNER_ID");
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Sessão não informada." }, 401);
    }

    if (!supabaseUrl || !supabaseKey || !instagramToken || !ownerId || !serviceRoleKey) {
      console.error("Configuração necessária ausente.");
      return jsonResponse(
        { error: "Configuração do servidor incompleta." },
        500,
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authorization },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const accessToken = authorization.slice("Bearer ".length).trim();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(accessToken);

    if (
      authError || !user || claimsError ||
      !claimsData?.claims || claimsData.claims.sub !== user.id
    ) {
      return jsonResponse(
        { error: "Sessão inválida ou expirada." },
        401,
      );
    }

    if (!hasPasswordAuthentication(claimsData.claims)) {
      return jsonResponse({ error: "Acesso indisponível nesta sessão." }, 403);
    }

    if (!isAuthorizedInstagramUser(user.id, ownerId)) {
      return jsonResponse({ error: "Conta não autorizada." }, 403);
    }

    // A tabela de histórico não fica acessível diretamente ao cliente.
    // A chave privilegiada é usada apenas depois da autenticação e autorização.
    const historyClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let periodDays = 30;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        const requestedDays = Number(body?.periodDays);

        if ([7, 30, 90].includes(requestedDays)) {
          periodDays = requestedDays;
        }
      } catch {
        // Mantém o período padrão.
      }
    }

    // 1. Consultar o perfil do Instagram.
    const profileUrl = new URL(`${API_BASE}/me`);
    profileUrl.searchParams.set(
      "fields",
      "user_id,username,account_type,media_count,followers_count",
    );

    const profileResponse = await fetch(profileUrl, {
      headers: {
        Authorization: `Bearer ${instagramToken}`,
      },
    });

    const profile = await readJson(profileResponse);

    if (!profileResponse.ok || !profile?.user_id) {
      console.error(
        "Falha ao consultar perfil:",
        profile?.error?.code,
      );

      return jsonResponse(
        {
          error: "Não foi possível consultar o perfil do Instagram.",
          code: profile?.error?.code ?? null,
        },
        502,
      );
    }

    // 2. Consultar as publicações.
    const mediaUrl = new URL(`${API_BASE}/me/media`);
    mediaUrl.searchParams.set(
      "fields",
      [
        "id",
        "caption",
        "media_type",
        "media_url",
        "thumbnail_url",
        "permalink",
        "timestamp",
        "like_count",
        "comments_count",
      ].join(","),
    );
    mediaUrl.searchParams.set("limit", "12");

    const mediaResponse = await fetch(mediaUrl, {
      headers: {
        Authorization: `Bearer ${instagramToken}`,
      },
    });

    const mediaResult = await readJson(mediaResponse);

    if (!mediaResponse.ok) {
      console.error(
        "Falha ao consultar publicações:",
        mediaResult?.error?.code,
      );

      return jsonResponse(
        {
          error: "Não foi possível obter as publicações.",
          code: mediaResult?.error?.code ?? null,
        },
        502,
      );
    }

    const media = Array.isArray(mediaResult?.data)
      ? mediaResult.data
      : [];

    // 3. Consultar as métricas agregadas da conta.
    let insights: unknown[] = [];
    let insightsError: string | null = null;

    const insightsUrl = new URL(
      `${API_BASE}/${profile.user_id}/insights`,
    );

    insightsUrl.searchParams.set(
      "metric",
      [
        "reach",
        "views",
        "accounts_engaged",
        "total_interactions",
        "likes",
        "comments",
        "saves",
        "follows_and_unfollows",
        "profile_links_taps",
      ].join(","),
    );

    insightsUrl.searchParams.set("metric_type", "total_value");
    insightsUrl.searchParams.set("period", "day");

    const insightsResponse = await fetch(insightsUrl, {
      headers: {
        Authorization: `Bearer ${instagramToken}`,
      },
    });

    const insightsResult = await readJson(insightsResponse);

    if (insightsResponse.ok) {
      insights = insightsResult?.data ?? [];
    } else {
      insightsError =
        insightsResult?.error?.message ??
        "Os Insights não estão disponíveis para esta conta.";

      console.warn(
        "Insights indisponíveis:",
        insightsResult?.error?.code,
        insightsError,
      );
    }

    // 4. Consultar o histórico diário de alcance.
    let reachHistory: Array<{
      date: string;
      value: number;
    }> = [];

    let reachHistoryError: string | null = null;

    const today = new Date().toISOString().slice(0, 10);
    const sinceDate = new Date(`${today}T00:00:00.000Z`);

    sinceDate.setUTCDate(
      sinceDate.getUTCDate() - (periodDays - 1),
    );

    const reachUrl = new URL(
      `${API_BASE}/${profile.user_id}/insights`,
    );

    reachUrl.searchParams.set("metric", "reach");
    reachUrl.searchParams.set("period", "day");
    reachUrl.searchParams.set("metric_type", "time_series");
    reachUrl.searchParams.set(
      "since",
      String(Math.floor(sinceDate.getTime() / 1000)),
    );
    reachUrl.searchParams.set(
      "until",
      String(Math.floor(Date.now() / 1000)),
    );

    const reachResponse = await fetch(reachUrl, {
      headers: {
        Authorization: `Bearer ${instagramToken}`,
      },
    });

    const reachResult = await readJson(reachResponse);

    if (reachResponse.ok) {
      const reachMetric = Array.isArray(reachResult?.data)
        ? reachResult.data.find(
            (item: { name?: string }) => item.name === "reach",
          )
        : null;

      reachHistory = Array.isArray(reachMetric?.values)
        ? reachMetric.values
            .map(
              (point: {
                value?: number;
                end_time?: string;
              }) => ({
                date: point.end_time
                  ? point.end_time.slice(0, 10)
                  : null,
                value:
                  typeof point.value === "number"
                    ? point.value
                    : null,
              }),
            )
            .filter(
              (
                point: {
                  date: string | null;
                  value: number | null;
                },
              ): point is { date: string; value: number } =>
                point.date !== null && point.value !== null,
            )
        : [];
    } else {
      reachHistoryError =
        reachResult?.error?.message ??
        "Não foi possível carregar o histórico de alcance.";

      console.warn(
        "Histórico de alcance indisponível:",
        reachResult?.error?.code,
        reachHistoryError,
      );
    }

    // 5. Registrar o total atual de seguidores.
    let followersHistory: Array<{
      date: string;
      value: number;
    }> = [];

    let followersHistoryError: string | null = null;

    const followersCount = Number(profile.followers_count);

    if (Number.isFinite(followersCount) && followersCount >= 0) {
      const { error: saveHistoryError } = await historyClient
        .from("instagram_followers_history")
        .upsert(
          {
            user_id: user.id,
            snapshot_date: today,
            followers_count: followersCount,
          },
          {
            onConflict: "user_id,snapshot_date",
          },
        );

      if (saveHistoryError) {
        console.error(
          "Não foi possível salvar o histórico de seguidores:",
          saveHistoryError.message,
        );

        followersHistoryError =
          "Não foi possível salvar o histórico de seguidores.";
      }
    } else {
      followersHistoryError =
        "A API não retornou uma quantidade válida de seguidores.";
    }

    // 6. Buscar o histórico de seguidores do período.
    const { data: historyRows, error: readHistoryError } =
      await historyClient
        .from("instagram_followers_history")
        .select("snapshot_date, followers_count")
        .eq("user_id", user.id)
        .gte("snapshot_date", sinceDate.toISOString().slice(0, 10))
        .lte("snapshot_date", today)
        .order("snapshot_date", { ascending: true });

    if (readHistoryError) {
      console.error(
        "Não foi possível consultar o histórico de seguidores:",
        readHistoryError.message,
      );

      followersHistoryError =
        "Não foi possível consultar o histórico de seguidores.";
    } else {
      followersHistory = (historyRows ?? []).map((row) => ({
        date: row.snapshot_date,
        value: row.followers_count,
      }));
    }

    // 7. Devolver os dados ao Dashboard.
    return jsonResponse({
      profile,
      media,
      insights,
      insightsError,
      reachHistory,
      reachHistoryError,
      reachHistoryPeriodDays: periodDays,
      followersHistory,
      followersHistoryError,
      followersHistoryPeriodDays: periodDays,
      paging: mediaResult?.paging ?? null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Erro interno na função Instagram:",
      error instanceof Error ? error.message : "Erro desconhecido",
    );

    return jsonResponse(
      { error: "Erro interno ao consultar o Instagram." },
      500,
    );
  }
});

