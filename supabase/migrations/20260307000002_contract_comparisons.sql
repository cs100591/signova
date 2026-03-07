create table contract_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  contract_a_id uuid,
  contract_b_id uuid,
  contract_a_url text,
  contract_b_url text,
  status text default 'pending',
  similarity_warning boolean default false,
  result_json jsonb,
  created_at timestamptz default now()
);

create index on contract_comparisons (user_id, created_at desc);

alter table contract_comparisons enable row level security;

create policy "Users see own comparisons" on contract_comparisons
  for all using (user_id = auth.uid());
