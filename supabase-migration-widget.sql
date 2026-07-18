-- ============================================================
-- SQL Migration: Widget Customisation Configurations
-- Run this in the Supabase SQL editor (project dashboard)
-- ============================================================

-- Alter public.companies to add widget customisation settings columns
alter table public.companies add column if not exists widget_color text default '#10B981';
alter table public.companies add column if not exists widget_greeting text default 'Hi there! 👋 How can I help you today?';
alter table public.companies add column if not exists widget_position text default 'br';
alter table public.companies add column if not exists widget_theme text default 'light';
alter table public.companies add column if not exists widget_title text;
