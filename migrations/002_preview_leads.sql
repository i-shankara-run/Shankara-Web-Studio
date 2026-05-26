-- Migration 002: preview leads (Get Started gig captures playground interactions)
-- Run:  psql "$DATABASE_URL" -f migrations/002_preview_leads.sql

alter type lead_status add value if not exists 'preview' before 'new';

alter table leads
  alter column whatsapp_e164 drop not null;

alter table leads
  add column if not exists generated_slogan text,
  add column if not exists font_display    text,
  add column if not exists font_body       text,
  add column if not exists accent_emoji    text,
  add column if not exists run_count       int  not null default 0,
  add column if not exists last_run_at     timestamptz;

create index if not exists leads_last_run_idx on leads (last_run_at desc);
