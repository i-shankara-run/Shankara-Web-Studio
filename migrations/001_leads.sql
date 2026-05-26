-- Migration 001: leads + rate_limits
-- Run on your Coolify-managed Postgres:
--   psql "$DATABASE_URL" -f migrations/001_leads.sql

create extension if not exists "pgcrypto";

do $$ begin
  create type lead_status as enum (
    'new','researching','prompt_generated','demo_sent','won','lost'
  );
exception when duplicate_object then null; end $$;

create table if not exists leads (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  business_name     text        not null,
  business_desc     text        not null,
  whatsapp_e164     text        not null,
  brand_color       text        not null,
  brand_shade       text        not null,
  packages          jsonb       not null default '[]'::jsonb,
  status            lead_status not null default 'new',
  -- enrichment (admin-editable)
  logo_url          text,
  services_notes    text,
  online_urls       text[]      not null default '{}',
  research_notes    text,
  generated_prompt  text,
  demo_url          text,
  subdomain         text,
  -- whatsapp tracking
  wa_msg_id         text,
  wa_error          text
);

create index if not exists leads_created_idx on leads (created_at desc);
create index if not exists leads_status_idx  on leads (status);

create table if not exists rate_limits (
  ip            text        primary key,
  count         int         not null default 0,
  window_start  timestamptz not null default now()
);

create or replace function leads_set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

drop trigger if exists leads_updated_at on leads;
create trigger leads_updated_at
  before update on leads
  for each row execute function leads_set_updated_at();
