export interface Group {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  avatar_url?: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  status: 'active' | 'left';
  joined_at: string;
}

export interface Message {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'transaction';
  metadata: Record<string, any>;
  created_at: string;
  sender?: { full_name?: string; avatar_url?: string; email?: string };
  read_by_me?: boolean;
}

export interface MessageRead {
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
}
