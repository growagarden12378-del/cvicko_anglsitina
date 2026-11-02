create table if not exists tests (
  id serial primary key,
  subject text not null check (subject in ('aj')),
  year int not null,
  variant text not null default 'A',
  title text,
  duration_min int,
  unique (subject, year, variant)
);

-- Ukážky / zadania, ku ktorým sa viaže viac úloh (napr. "Bazén", "Ukážka 1")
create table if not exists passages (
  id serial primary key,
  test_id int not null references tests(id) on delete cascade,
  title text,
  body text,
  image_url text,
  sort int not null default 0
);

create table if not exists questions (
  id serial primary key,
  test_id int not null references tests(id) on delete cascade,
  passage_id int references passages(id) on delete set null,
  number int not null,
  kind text not null check (kind in ('abcd', 'short')),
  topic text not null,
  prompt text not null,
  image_url text,
  options jsonb,                         -- ["...", "...", "...", "..."] pre abcd
  correct text not null,                 -- "A".."D" alebo správny výsledok
  accepted jsonb not null default '[]',  -- ďalšie akceptované zápisy
  explanation text,
  verified boolean not null default false, -- true až po porovnaní s oficiálnym kľúčom
  unique (test_id, number)
);

create index if not exists questions_topic_idx on questions (topic);

-- Účty (prihlasovanie menom a heslom) a uložený postup
create table if not exists users (
  id serial primary key,
  username text not null unique,
  pass_hash text not null,
  progress jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  token_hash text primary key,
  user_id int not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_idx on sessions (user_id);
