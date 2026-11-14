create extension if not exists pgcrypto;
create table if not exists public.waitlist (
 id uuid primary key default gen_random_uuid(),
 email text not null unique,
 created_at timestamptz not null default now()
);
alter table public.waitlist enable row level security;
create policy "Allow anonymous waitlist signups" on public.waitlist for insert to anon with check (char_length(email) <= 320 and position('@' in email) > 1);
create table if not exists public.assessments (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 subject text,
 rubric jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now(),
 owner_id uuid references auth.users(id) on delete cascade
);
create table if not exists public.submissions (
 id uuid primary key default gen_random_uuid(),
 assessment_id uuid not null references public.assessments(id) on delete cascade,
 student_label text not null,
 response_text text not null,
 score numeric(5,2),
 feedback text,
 teacher_approved boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.assessments enable row level security;
alter table public.submissions enable row level security;
create policy "Owners manage assessments" on public.assessments for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "Owners access submissions" on public.submissions for all to authenticated using (exists(select 1 from public.assessments a where a.id=assessment_id and a.owner_id=(select auth.uid()))) with check (exists(select 1 from public.assessments a where a.id=assessment_id and a.owner_id=(select auth.uid())));
