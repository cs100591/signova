-- Fix net.http_post call: correct parameter order and types
-- Signature: net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds int)

create or replace function public.handle_new_user_onboarding()
returns trigger
language plpgsql
security definer
set search_path = public, net
as $$
declare
  v_request_id bigint;
begin
  begin
    select net.http_post(
      url     := 'https://www.signova.me/api/email/auth-hook',
      body    := jsonb_build_object(
        'type', 'INSERT',
        'table', 'users',
        'schema', 'auth',
        'record', jsonb_build_object(
          'id', new.id,
          'email', new.email,
          'created_at', new.created_at
        )
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer 1KuLGY5OQ7a1hQmTyJDnI0uGBPwZ/vguT5Yuoeos34w='
      ),
      timeout_milliseconds := 5000
    ) into v_request_id;

  exception when others then
    null; -- don't block signup
  end;

  return new;
end;
$$;
