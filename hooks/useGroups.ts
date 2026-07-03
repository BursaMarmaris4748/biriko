import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Group, GroupMember } from '@/lib/types';
import RealtimeChannel from '@supabase/realtime-js';

export function useGroups() {
  const [groups, setGroups] = useState<(Group & { unread?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (!memberships?.length) { setLoading(false); setGroups([]); return; }

    const ids = memberships.map(m => m.group_id);
    const { data: grps } = await supabase
      .from('groups')
      .select('*')
      .in('id', ids)
      .order('created_at', { ascending: false });

    const withUnread = await Promise.all((grps || []).map(async (g) => {
      const { count } = await supabase
        .rpc('get_unread_count', { p_user_id: user.id, p_group_id: g.id });
      return { ...g, unread: count || 0 };
    }));

    setGroups(withUnread);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createGroup = useCallback(async (name: string, memberEmails: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Giriş yapmalısın');

    const { data: group, error: gErr } = await supabase
      .from('groups')
      .insert({ name, created_by: user.id })
      .select()
      .single();
    if (gErr || !group) throw new Error(gErr?.message || 'Grup oluşturulamadı');

    const memberIds: string[] = [user.id];
    for (const email of memberEmails) {
      const { data: u } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.trim())
        .maybeSingle();
      if (u) memberIds.push(u.id);
    }

    const members = memberIds.map(uid => ({
      group_id: group.id,
      user_id: uid,
      role: uid === user.id ? 'admin' : 'member',
    }));
    const { error: mErr } = await supabase.from('group_members').insert(members);
    if (mErr) throw new Error(mErr.message);

    await load();
    return group;
  }, [load]);

  const addMember = useCallback(async (groupId: string, email: string) => {
    const { data: u } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.trim())
      .maybeSingle();
    if (!u) throw new Error('Kullanıcı bulunamadı');

    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: u.id, role: 'member' });
    if (error) throw new Error(error.message);
  }, []);

  const leaveGroup = useCallback(async (groupId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('group_members')
      .update({ status: 'left' })
      .eq('group_id', groupId)
      .eq('user_id', user.id);
    await load();
  }, [load]);

  return { groups, loading, reload: load, createGroup, addMember, leaveGroup };
}
