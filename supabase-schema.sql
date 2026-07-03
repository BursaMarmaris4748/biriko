-- ============================================================
-- Biriko Grup Mesajlaşma Şeması
-- Bu SQL'i Supabase SQL Editor'da çalıştır.
-- ============================================================

-- 1. Gruplar
CREATE TABLE groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Grup Üyeleri
CREATE TABLE group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'left')),
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(group_id, user_id)
);

-- 3. Mesajlar
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'transaction')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Okundu Bilgisi
CREATE TABLE message_reads (
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  read_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (message_id, user_id)
);

-- 5. Push Tokenlar
CREATE TABLE push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- INDEX'ler
-- ============================================================
CREATE INDEX idx_messages_group_id ON messages(group_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_message_reads_user_id ON message_reads(user_id);
CREATE INDEX idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX idx_messages_group_id_created_at ON messages(group_id, created_at DESC);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Groups: üye olanlar görebilir, oluşturan silebilir
CREATE POLICY "Groups select for members" ON groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    OR created_by = auth.uid()
  );

CREATE POLICY "Groups insert for all" ON groups
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Groups delete for creator" ON groups
  FOR DELETE USING (created_by = auth.uid());

-- Group Members: üyeler görebilir, admin ekleyebilir
CREATE POLICY "Members select" ON group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members insert" ON group_members
  FOR INSERT WITH CHECK (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM groups WHERE id = group_id AND created_by = auth.uid())
  );

CREATE POLICY "Members update" ON group_members
  FOR UPDATE USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM groups WHERE id = group_id AND created_by = auth.uid())
  );

-- Messages: grup üyeleri görebilir ve gönderebilir
CREATE POLICY "Messages select for members" ON messages
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Messages insert for members" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Messages delete own" ON messages
  FOR DELETE USING (sender_id = auth.uid());

-- Message Reads: üyeler görebilir ve ekleyebilir
CREATE POLICY "Reads select for members" ON message_reads
  FOR SELECT USING (
    message_id IN (SELECT id FROM messages WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Reads insert own" ON message_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Push Tokens: kullanıcı kendi token'ını yönetir
CREATE POLICY "Tokens select own" ON push_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Tokens upsert own" ON push_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Tokens update own" ON push_tokens
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- Realtime: mesajlar ve okundu bilgisi için yayın
-- ============================================================
-- Supabase Dashboard > Realtime > Replication'da aşağıdaki tabloları aktif et:
-- messages, message_reads, group_members
-- Veya SQL ile:
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE message_reads;
-- ALTER PUBLICATION supabase_realtime ADD TABLE group_members;

-- ============================================================
-- Storage: sohbet fotoğrafları için bucket
-- ============================================================
-- Supabase Dashboard > Storage > Create bucket: chat-photos (public)
-- Veya SQL ile:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('chat-photos', 'chat-photos', true);
-- 
-- Storage politikası:
-- CREATE POLICY "Chat photos select" ON storage.objects
--   FOR SELECT USING (bucket_id = 'chat-photos');
-- CREATE POLICY "Chat photos insert" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'chat-photos' AND auth.role() = 'authenticated'
--   );

-- ============================================================
-- Fonksiyon: okunmamış mesaj sayısı
-- ============================================================
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID, p_group_id UUID)
RETURNS BIGINT
LANGUAGE SQL
STABLE
AS $$
  SELECT COUNT(*)
  FROM messages m
  WHERE m.group_id = p_group_id
    AND m.sender_id != p_user_id
    AND m.created_at > COALESCE(
      (SELECT MAX(mr.read_at) FROM message_reads mr WHERE mr.message_id = m.id AND mr.user_id = p_user_id),
      '1970-01-01'::timestamptz
    );
$$;
