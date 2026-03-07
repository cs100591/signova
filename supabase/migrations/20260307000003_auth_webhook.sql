-- Create auth webhook trigger to fire onboarding email on new user signup
-- Uses Supabase's built-in supabase_functions.http_request function

create or replace function public.handle_new_user_onboarding()
returns trigger
language plpgsql
security definer
set search_path = public
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
      )
    );
  return new;
exception
  when others then
    -- Don't block signup if webhook fails
    return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user_onboarding();
