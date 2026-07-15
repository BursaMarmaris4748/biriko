import { useEffect, useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Message } from '@/lib/types';

const PAGE_SIZE = 50;

async function fetchSenders(senderIds: string[]): Promise<Record<string, any>> {
  if (!senderIds.length) return {};
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .in('id', senderIds);
    if (error) { console.warn('[chat] fetchSenders error:', error.message); return {}; }
    const map: Record<string, any> = {};
    (data || []).forEach(p => { map[p.id] = p; });
    return map;
  } catch (e) { console.warn('[chat] fetchSenders exception:', e); return {}; }
}

export function useChat(groupId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [members, setMembers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const currentUserId = useRef<string | null>(null);
  const oldestDate = useRef<string | null>(null);
  const loadedSenderIds = useRef<Set<string>>(new Set());

  // Fetch group info
  useEffect(() => {
    supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.warn('[chat] group fetch error:', error.message);
        if (data) setGroupName(data.name);
      });
  }, [groupId]);

  const attachSenders = useCallback(async (msgs: any[]): Promise<Message[]> => {
    const ids = [...new Set(msgs.map(m => m.sender_id).filter(Boolean))] as string[];
    const newIds = ids.filter(id => !loadedSenderIds.current.has(id));
    if (newIds.length > 0) {
      const senderMap = await fetchSenders(newIds);
      newIds.forEach(id => loadedSenderIds.current.add(id));
      return msgs.map(m => ({
        ...m,
        sender: senderMap[m.sender_id] || {},
        metadata: typeof m.metadata === 'string' ? safeParse(m.metadata) : (m.metadata || {}),
      })) as Message[];
    }
    return msgs.map(m => ({
      ...m,
      metadata: typeof m.metadata === 'string' ? safeParse(m.metadata) : (m.metadata || {}),
    })) as Message[];
  }, []);

  const fetchMessages = useCallback(async (older = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { console.warn('[chat] no user'); setLoading(false); return; }
    currentUserId.current = user.id;

    let query = supabase
      .from('messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (older && oldestDate.current) {
      query = query.lt('created_at', oldestDate.current);
    }

    query = query.limit(PAGE_SIZE);

    const { data, error } = await query;
    if (error) {
      console.warn('[chat] fetch error:', error.message);
      setLoading(false);
      return;
    }

    const raw = (data as any[] || []).reverse();
    const withSenders = await attachSenders(raw);

    if (older) {
      setMessages(prev => [...withSenders, ...prev]);
    } else {
      setMessages(withSenders);
    }

    if (raw.length < PAGE_SIZE) setHasMore(false);
    if (raw.length > 0) oldestDate.current = raw[0].created_at;

    setLoading(false);

    // Mark as read
    if (!older && raw.length > 0) {
      const unreadIds = raw.filter(m => m.sender_id !== user.id).map(m => m.id);
      if (unreadIds.length > 0) {
        await supabase.from('message_reads').upsert(
          unreadIds.map(mid => ({ message_id: mid, user_id: user.id })),
          { onConflict: 'message_id,user_id' }
        ).maybeSingle();
      }
    }
  }, [groupId, attachSenders]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`,
      }, async (payload: any) => {
        const newMsg = payload.new;
        let sender: Record<string, any> = {};
        try {
          const { data: s } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, email')
            .eq('id', newMsg.sender_id)
            .maybeSingle();
          if (s) sender = s;
        } catch {}

        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, {
            ...newMsg,
            metadata: typeof newMsg.metadata === 'string' ? safeParse(newMsg.metadata) : (newMsg.metadata || {}),
            sender,
          } as Message];
        });

        // Auto mark as read
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && newMsg.sender_id !== user.id) {
            await supabase.from('message_reads').upsert(
              { message_id: newMsg.id, user_id: user.id },
              { onConflict: 'message_id,user_id' }
            );
          }
        } catch {}
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId]);

  // Load members
  useEffect(() => {
    supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('status', 'active')
      .then(({ data }) => setMembers((data || []).map(m => m.user_id)));
  }, [groupId]);

  // sendMessage: hata varsa Alert ile göster
  const sendMessage = useCallback(async (
    type: 'text' | 'image' | 'transaction',
    content: string,
    metadata: Record<string, any> = {}
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Hata', 'Oturum açman gerekiyor.');
      return;
    }
    if (!content.trim()) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      group_id: groupId,
      sender_id: user.id,
      content: content.trim(),
      type,
      metadata: Object.keys(metadata).length ? metadata : undefined,
    });
    if (error) {
      console.warn('[chat] send error:', error.code, error.message);
      Alert.alert('Mesaj gönderilemedi', `[${error.code}] ${error.message}`);
    }
    setSending(false);
  }, [groupId]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) fetchMessages(true);
  }, [hasMore, loading, fetchMessages]);

  return {
    messages, loading, sending, hasMore, loadMore, sendMessage,
    members, currentUserId: currentUserId.current, groupName,
  };
}

function safeParse(s: any): Record<string, any> {
  try { return typeof s === 'string' ? JSON.parse(s) : (s || {}); }
  catch { return {}; }
}
