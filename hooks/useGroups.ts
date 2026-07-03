import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Group, GroupMember } from '@/lib/types';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

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

  const createGroup = useCallback(async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Giriş yapmalısın');

    // Benzersiz davet kodu oluştur
    let inviteCode: string;
    let retries = 0;
    while (true) {
      inviteCode = generateInviteCode();
      const { data: existing } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', inviteCode)
        .maybeSingle();
      if (!existing) break;
      retries++;
      if (retries > 10) throw new Error('Davet kodu oluşturulamadı');
    }

    const { data: group, error: gErr } = await supabase
      .from('groups')
      .insert({ name, created_by: user.id, invite_code: inviteCode })
      .select()
      .single();
    if (gErr || !group) throw new Error(gErr?.message || 'Grup oluşturulamadı');

    const { error: mErr } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id, role: 'admin' });
    if (mErr) throw new Error(mErr.message);

    await load();
    return group;
  }, [load]);

  const joinGroup = useCallback(async (inviteCode: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Giriş yapmalısın');

    const code = inviteCode.toUpperCase().trim();
    const { data: group, error: gErr } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', code)
      .maybeSingle();
    if (gErr || !group) throw new Error('Geçersiz davet kodu');

    // Zaten üye mi?
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (existing) throw new Error('Bu gruba zaten üyesin');

    const { error: mErr } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id, role: 'member' });
    if (mErr) throw new Error(mErr.message);

    await load();
    return group;
  }, [load]);

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

  return { groups, loading, reload: load, createGroup, joinGroup, leaveGroup };
}
