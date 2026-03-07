-- Fix trigger function: include 'net' in search_path so net.http_post resolves
create or replace function public.handle_new_user_onboarding()
returns trigger
language plpgsql
security definer
set search_path = public, net
as $$
begin
  perform
    net.http_post(
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
    );
  return new;
exception
  when others then
    return new;
end;
$$;
