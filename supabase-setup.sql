-- ============================================================
-- mijnbudget — Supabase database setup
-- Kopieer dit volledig in de Supabase SQL Editor en voer uit
-- ============================================================

-- Transacties
create table if not exists transactions (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('income', 'expense')),
  beschrijving  text not null,
  bedrag        numeric(10,2) not null check (bedrag > 0),
  categorie     text not null,
  date          date not null default current_date,
  notitie       text,
  created_at    timestamptz default now()
);

-- Budgetten per categorie
create table if not exists budgets (
  id             uuid primary key default gen_random_uuid(),
  category       text not null unique,
  monthly_limit  numeric(10,2) not null check (monthly_limit > 0),
  created_at     timestamptz default now()
);

-- Spaarpotjes
create table if not exists potjes (
  id              uuid primary key default gen_random_uuid(),
  naam            text not null,
  emoji           text default '🪣',
  doelbedrag      numeric(10,2) not null check (doelbedrag > 0),
  huidig_bedrag   numeric(10,2) not null default 0 check (huidig_bedrag >= 0),
  created_at      timestamptz default now()
);

-- Mutaties per potje (historiek)
create table if not exists potje_mutaties (
  id         uuid primary key default gen_random_uuid(),
  potje_id   uuid references potjes(id) on delete cascade,
  type       text not null check (type in ('toevoegen', 'opnemen')),
  bedrag     numeric(10,2) not null check (bedrag > 0),
  notitie    text,
  datum      date not null default current_date,
  created_at timestamptz default now()
);

-- ── Row Level Security (optioneel maar aanbevolen) ──────────
-- Zet RLS uit voor persoonlijk gebruik zonder login:
alter table transactions    disable row level security;
alter table budgets         disable row level security;
alter table potjes          disable row level security;
alter table potje_mutaties  disable row level security;

-- ── Indexen voor snelheid ───────────────────────────────────
create index if not exists idx_transactions_date     on transactions(date desc);
create index if not exists idx_transactions_type     on transactions(type);
create index if not exists idx_transactions_categorie on transactions(categorie);
create index if not exists idx_potje_mutaties_potje  on potje_mutaties(potje_id);

-- ── Voorbeelddata (optioneel, verwijder als je wil) ─────────
-- insert into potjes (naam, emoji, doelbedrag, huidig_bedrag) values
--   ('Huwelijk 2026', '💍', 14000, 2800),
--   ('Renovatie',     '🔨', 10000, 300),
--   ('Vakantie',      '✈️', 2000,  0);
