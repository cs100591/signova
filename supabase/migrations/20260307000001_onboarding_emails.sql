-- ── Onboarding Email Sequence Table ─────────────────────────────────────────
-- Run this in Supabase SQL Editor before deploying the feature.

create table if not exists onboarding_emails (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  email         text not null,
  step          integer not null default 1,       -- Current step already sent (1–7)
  last_sent_at  timestamptz,                       -- Timestamp of the last sent email
  completed     boolean not null default false,    -- True when all 7 steps are done
  created_at    timestamptz default now()
);

-- Index to speed up daily cron queries (only incomplete sequences)
create index if not exists idx_onboarding_emails_cron
  on onboarding_emails (step, last_sent_at)
  where completed = false;

-- One row per user
create unique index if not exists idx_onboarding_emails_user
  on onboarding_emails (user_id);
