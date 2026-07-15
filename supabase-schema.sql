-- ============================================================
-- BİRİKO SOHBET - TAM SQL (idempotent, tekrar çalıştırılabilir)
-- Bu dosyayı Supabase SQL Editor'da BAŞTAN SONA çalıştır.
-- ============================================================

-- ============================================================
-- 1) TABLOLAR
-- ============================================================

-- Gruplar
create table if not exists groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text default 'friends',
  created_by uuid references auth.users(id),
  avatar_url text,
  invite_code text unique default upper(substring(gen_random_uuid()::text, 1, 8)),
  created_at timestamp default now()
);

-- Grup üyeleri
create table if not exists group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references auth.users(id),
  role text default 'member',
  status text default 'active',
  joined_at timestamp default now()
);

-- Mesajlar
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  sender_id uuid references auth.users(id),
  content text not null,
  type text default 'text',
  metadata jsonb,
  created_at timestamp default now()
);

-- Okundu bilgisi
create table if not exists message_reads (
  message_id uuid references messages(id) on delete cascade,
  user_id uuid references auth.users(id),
  read_at timestamp default now(),
  primary key (message_id, user_id)
);

-- Profiller (kullanıcı adı + avatar)
create table if not exists profiles (
  id uuid references auth.users(id) primary key,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamp default now()
);

-- ============================================================
-- 2) MEVCUT KULLANICILAR İÇİN PROFİL OLUŞTUR (BACKFILL)
--    Bu olmadan sohbet ÇALIŞMAZ — mevcut kullanıcıların profili yok!
-- ============================================================
insert into profiles (id, full_name, email)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  email
from auth.users
on conflict (id) do nothing;

-- ============================================================
-- 3) TRIGGER: Yeni kullanıcı → otomatik profil
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- 4) YARDIMCI FONKSİYON: is_group_member
--    RLS sonsuz döngüsünü önlemek için security definer
-- ============================================================
create or replace function is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from group_members
    where group_id = p_group_id
      and user_id = p_user_id
      and status = 'active'
  );
$$;

-- ============================================================
-- 5) Okunmamış mesaj sayısı fonksiyonu
-- ============================================================
create or replace function get_unread_count(p_user_id uuid, p_group_id uuid)
returns bigint
language sql
security definer
stable
as $$
  select count(*)
  from messages m
  where m.group_id = p_group_id
    and m.sender_id != p_user_id
    and not exists (
      select 1 from message_reads mr
      where mr.message_id = m.id and mr.user_id = p_user_id
    );
$$;

-- ============================================================
-- 6) INDEX'ler
-- ============================================================
create index if not exists idx_groups_invite_code on groups(invite_code);
create index if not exists idx_messages_group_id on messages(group_id);
create index if not exists idx_messages_created_at on messages(created_at desc);
create index if not exists idx_group_members_group_id on group_members(group_id);
create index if not exists idx_group_members_user_id on group_members(user_id);
create index if not exists idx_message_reads_user_id on message_reads(user_id);
create index if not exists idx_message_reads_message_id on message_reads(message_id);

-- ============================================================
-- 7) RLS (Row Level Security)
-- ============================================================
alter table groups enable row level security;
alter table group_members enable row level security;
alter table messages enable row level security;
alter table message_reads enable row level security;
alter table profiles enable row level security;

-- --- GROUPS: politikaları sil + yeniden oluştur ---
drop policy if exists "grp_select_member" on groups;
drop policy if exists "grp_select_public" on groups;
drop policy if exists "grp_insert" on groups;
drop policy if exists "grp_delete" on groups;

-- Üyeler grubu görebilir + herkes davet kodu için görebilir
create policy "grp_select_member" on groups
  for select using (is_group_member(id, auth.uid()) or created_by = auth.uid());

create policy "grp_select_public" on groups
  for select using (true);

-- Kullanıcı kendi grubunu oluşturabilir
create policy "grp_insert" on groups
  for insert with check (auth.uid() = created_by);

create policy "grp_delete" on groups
  for delete using (auth.uid() = created_by);

-- --- GROUP_MEMBERS ---
drop policy if exists "gm_select" on group_members;
drop policy if exists "gm_insert" on group_members;
drop policy if exists "gm_update" on group_members;

create policy "gm_select" on group_members
  for select using (is_group_member(group_id, auth.uid()));

-- Kullanıcı kendi kaydını ekleyebilir (gruba katılma)
create policy "gm_insert_self" on group_members
  for insert with check (auth.uid() = user_id);

-- Grup sahibi admin olarak üye ekler (created_by)
create policy "gm_insert_owner" on group_members
  for insert with check (
    exists (select 1 from groups where id = group_id and created_by = auth.uid())
  );

-- Kullanıcı kendi statusunu güncelleyebilir (ayrılma)
create policy "gm_update_self" on group_members
  for update using (auth.uid() = user_id);

-- Grup sahibi üye statusunu güncelleyebilir
create policy "gm_update_owner" on group_members
  for update using (
    exists (select 1 from groups where id = group_id and created_by = auth.uid())
  );

-- --- MESSAGES ---
drop policy if exists "msg_select" on messages;
drop policy if exists "msg_insert" on messages;
drop policy if exists "msg_delete" on messages;

create policy "msg_select" on messages
  for select using (is_group_member(group_id, auth.uid()));

create policy "msg_insert" on messages
  for insert with check (
    auth.uid() = sender_id and is_group_member(group_id, auth.uid())
  );

create policy "msg_delete" on messages
  for delete using (auth.uid() = sender_id);

-- --- MESSAGE_READS ---
drop policy if exists "mr_select" on message_reads;
drop policy if exists "mr_insert" on message_reads;

create policy "mr_select" on message_reads
  for select using (
    exists (
      select 1 from messages m
      where m.id = message_id
        and is_group_member(m.group_id, auth.uid())
    )
  );

create policy "mr_insert" on message_reads
  for insert with check (auth.uid() = user_id);

-- --- PROFILES ---
drop policy if exists "prof_select" on profiles;
drop policy if exists "prof_update" on profiles;

create policy "prof_select" on profiles
  for select using (true);

create policy "prof_update" on profiles
  for update using (auth.uid() = id);

-- ============================================================
-- 8) REALTIME
-- ============================================================
do $$
begin
  begin execute 'alter publication supabase_realtime add table messages'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table group_members'; exception when others then null; end;
end $$;
