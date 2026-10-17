-- Rascunho para revisão. Não executar antes de implantar a versão protegida
-- de instagram-insights, pois ela passará a usar SERVICE_ROLE_KEY para o histórico.
-- O cron já usa service role e não depende das permissões de authenticated.
begin;

alter table public.instagram_followers_history enable row level security;

revoke select, insert, update
  on table public.instagram_followers_history
  from authenticated;

drop policy if exists "Users can read their follower history"
  on public.instagram_followers_history;
drop policy if exists "Users can insert their follower history"
  on public.instagram_followers_history;
drop policy if exists "Users can update their follower history"
  on public.instagram_followers_history;

commit;
