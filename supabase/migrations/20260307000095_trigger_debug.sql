-- Debug table to log trigger firing
create table if not exists public._trigger_debug_log (
  id serial primary key,
  user_id text,
  user_email text,
  fired_at timestamptz default now(),
  net_call_result text
);

-- Replace trigger function with debug version
create or replace function public.handle_new_user_onboarding()
returns trigger
language plpgsql
security definer
set search_path = public, net
as $$
declare
  v_request_id bigint;
begin
  -- Log that trigger fired
  insert into public._trigger_debug_log (user_id, user_email, net_call_result)
  values (new.id::text, new.email, 'trigger_fired');

  -- Make the HTTP call
  begin
    select net.http_post(
      url := 'https://www.signova.me/api/email/auth-hook',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer 1KuLGY5OQ7a1hQmTyJDnI0uGBPwZ/vguT5Yuoeos34w='
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'users',
        'schema', 'auth',
        'record', jsonb_build_object(
          'id', new.id,
          'email', new.email,
          'created_at', new.created_at
        )
      )::text,
      timeout_milliseconds := 5000
    ) into v_request_id;

    update public._trigger_debug_log
    set net_call_result = 'http_queued_id_' || v_request_id::text
    where user_id = new.id::text;

  exception when others then
    update public._trigger_debug_log
    set net_call_result = 'error: ' || sqlerrm
    where user_id = new.id::text;
  end;

  return new;
end;
$$;

-- Grant read access for service role
grant select on public._trigger_debug_log to service_role;
