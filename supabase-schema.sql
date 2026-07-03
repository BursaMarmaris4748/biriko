-- ============================================================
-- Biriko Grup Mesajlaşma Şeması
-- Önce bunu, sonra aşağıdaki ek SQL'leri çalıştır.
-- ============================================================

-- 1) Gruplar (invite_code ile)
create table if not exists groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text default 'friends',
  created_by uuid references auth.users(id),
  avatar_url text,
  invite_code text unique default upper(substring(gen_random_uuid()::text, 1, 8)),
  created_at timestamp default now()
);

-- 2) Grup üyeleri
create table if not exists group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references auth.users(id),
  role text default 'member',
  status text default 'active',
  joined_at timestamp default now()
);

-- 3) Mesajlar
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  sender_id uuid references auth.users(id),
  content text not null,
  type text default 'text',
  metadata jsonb,
  created_at timestamp default now()
);

-- 4) Okundu bilgisi
create table if not exists message_reads (
  message_id uuid references messages(id) on delete cascade,
  user_id uuid references auth.users(id),
  read_at timestamp default now(),
  primary key (message_id, user_id)
);

-- 5) Profiller (kullanıcı adı, avatar için)
create table if not exists profiles (
  id uuid references auth.users(id) primary key,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamp default now()
);

-- Yeni kullanıcı kaydolunca otomatik profil oluştur
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 6) Okunmamış mesaj sayısı fonksiyonu
create or replace function get_unread_count(p_user_id uuid, p_group_id uuid)
returns bigint
language sql
stable
as $$
  select count(*)
  from messages m
  where m.group_id = p_group_id
    and m.sender_id != p_user_id
    and m.created_at > coalesce(
      (select max(mr.read_at) from message_reads mr where mr.message_id = m.id and mr.user_id = p_user_id),
      '1970-01-01'::timestamp
    );
$$;

-- ============================================================
-- INDEX'ler
-- ============================================================
create index if not exists idx_groups_invite_code on groups(invite_code);
create index if not exists idx_messages_group_id on messages(group_id);
create index if not exists idx_messages_created_at on messages(created_at desc);
create index if not exists idx_group_members_group_id on group_members(group_id);
create index if not exists idx_group_members_user_id on group_members(user_id);
create index if not exists idx_message_reads_user_id on message_reads(user_id);
create index if not exists idx_message_reads_message_id on message_reads(message_id);
create index if not exists idx_messages_group_id_created_at on messages(group_id, created_at desc);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table groups enable row level security;
alter table group_members enable row level security;
alter table messages enable row level security;
alter table message_reads enable row level security;
alter table profiles enable row level security;

-- Groups
create policy "Grup üyeleri grubu görebilir" on groups
  for select using (
    id in (select group_id from group_members where user_id = auth.uid() and status = 'active')
  );

create policy "Davet koduyla grup görülebilir" on groups
  for select using (true);

create policy "Kullanıcı grup oluşturabilir" on groups
  for insert with check (auth.uid() = created_by);

-- Group Members
create policy "Üyeler diğer üyeleri görebilir" on group_members
  for select using (
    group_id in (select group_id from group_members where user_id = auth.uid() and status = 'active')
  );

create policy "Kullanıcı gruba katılabilir" on group_members
  for insert with check (auth.uid() = user_id);

-- Messages
create policy "Grup üyeleri mesajları görebilir" on messages
  for select using (
    group_id in (select group_id from group_members where user_id = auth.uid() and status = 'active')
  );

create policy "Grup üyeleri mesaj gönderebilir" on messages
  for insert with check (
    auth.uid() = sender_id and
    group_id in (select group_id from group_members where user_id = auth.uid() and status = 'active')
  );

create policy "Kullanıcı kendi mesajını silebilir" on messages
  for delete using (auth.uid() = sender_id);

-- Message Reads
create policy "Kullanıcı okundu işaretleyebilir" on message_reads
  for insert with check (auth.uid() = user_id);

-- Profiles
create policy "Profiller herkes tarafından görülebilir" on profiles
  for select using (true);

create policy "Kullanıcı kendi profilini güncelleyebilir" on profiles
  for update using (auth.uid() = id);

-- ============================================================
-- Realtime
-- ============================================================
-- Aşağıdakileri SQL Editor'da çalıştır:
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table group_members;

-- ============================================================
-- Storage: sohbet fotoğrafları
-- ============================================================
-- Supabase Dashboard > Storage > Create bucket: chat-photos (public)
-- Veya:
-- insert into storage.buckets (id, name, public) values ('chat-photos', 'chat-photos', true);
