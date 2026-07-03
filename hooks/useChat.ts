import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Message } from '@/lib/types';
import { Platform } from 'react-native';

const PAGE_SIZE = 50;

export function useChat(groupId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [members, setMembers] = useState<string[]>([]);
  const currentUserId = useRef<string | null>(null);
  const channel = useRef<any>(null);
  const oldestDate = useRef<string | null>(null);

  const fetchMessages = useCallback(async (older = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    currentUserId.current = user.id;

    let query = supabase
      .from('messages')
      .select('*, sender:sender_id(full_name, avatar_url, email)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (older && oldestDate.current) {
      query = query.lt('created_at', oldestDate.current);
    }

    query = query.limit(PAGE_SIZE);

    const { data, error } = await query;
    if (error) { console.warn('[chat] fetch error:', error); setLoading(false); return; }

    const msgs = (data as any[] || []).map(m => ({
      ...m,
      sender: m.sender || {},
      metadata: typeof m.metadata === 'string' ? JSON.parse(m.metadata) : (m.metadata || {}),
    })).reverse() as Message[];

    if (older) {
      setMessages(prev => [...msgs, ...prev]);
    } else {
      setMessages(msgs);
    }

    if (msgs.length < PAGE_SIZE) setHasMore(false);
    if (msgs.length > 0) oldestDate.current = msgs[0].created_at;

    setLoading(false);

    // Mark as read
    if (!older && msgs.length > 0) {
      const unreadIds = msgs
        .filter(m => m.sender_id !== user.id)
        .map(m => m.id);
      if (unreadIds.length > 0) {
        await supabase.from('message_reads').upsert(
          unreadIds.map(mid => ({ message_id: mid, user_id: user.id })),
          { onConflict: 'message_id,user_id' }
        ).maybeSingle();
      }
    }
  }, [groupId]);

  // Load initial
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    const grp = supabase
      .channel(`chat-${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`,
      }, async (payload: any) => {
        const newMsg = payload.new;
        const { data: sender } = await supabase
          .from('users')
          .select('full_name, avatar_url, email')
          .eq('id', newMsg.sender_id)
          .single();

        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          const msg: Message = {
            ...newMsg,
            metadata: typeof newMsg.metadata === 'string' ? JSON.parse(newMsg.metadata) : (newMsg.metadata || {}),
            sender: sender || {},
          };
          return [...prev, msg];
        });

        // Auto mark as read
        const { data: { user } } = await supabase.auth.getUser();
        if (user && newMsg.sender_id !== user.id) {
          supabase.from('message_reads').upsert(
            { message_id: newMsg.id, user_id: user.id },
            { onConflict: 'message_id,user_id' }
          ).maybeSingle();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(grp); };
  }, [groupId]);

  // Load members
  useEffect(() => {
    supabase.from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('status', 'active')
      .then(({ data }) => setMembers((data || []).map(m => m.user_id)));
  }, [groupId]);

  const sendMessage = useCallback(async (
    type: 'text' | 'image' | 'transaction',
    content: string,
    metadata: Record<string, any> = {}
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !content.trim()) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      group_id: groupId,
      sender_id: user.id,
      content: content.trim(),
      type,
      metadata,
    });
    if (error) console.warn('[chat] send error:', error);
    setSending(false);
  }, [groupId]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) fetchMessages(true);
  }, [hasMore, loading, fetchMessages]);

  return { messages, loading, sending, hasMore, loadMore, sendMessage, members, currentUserId: currentUserId.current };
}
