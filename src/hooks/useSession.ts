import { useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Member } from '../types/database';
import { getCachedCurrentMember, setCachedCurrentMember } from '../lib/offlineCache';

interface SessionState {
  session: Session | null;
  member: Member | null;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
}

export function useSession() {
  const cachedMember = getCachedCurrentMember();
  const [state, setState] = useState<SessionState>({
    session: null,
    member: cachedMember,
    isLoading: true,
    isAdmin: cachedMember?.is_admin ?? false,
    error: null,
  });

  const fetchMember = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('member_devices')
        .select('member_id, members(*)')
        .eq('auth_user_id', userId)
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      // data.members is the joined member row
      const member = (data as unknown as { members: Member }).members;
      return member;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const fetchedMember = await fetchMember(session.user.id);
        const resolvedMember = fetchedMember || getCachedCurrentMember();
        if (fetchedMember) {
          setCachedCurrentMember(fetchedMember);
        }
        setState({
          session,
          member: resolvedMember,
          isLoading: false,
          isAdmin: resolvedMember?.is_admin ?? false,
          error: null,
        });
      } else {
        setState({
          session: null,
          member: null,
          isLoading: false,
          isAdmin: false,
          error: null,
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setCachedCurrentMember(null);
          setState({
            session: null,
            member: null,
            isLoading: false,
            isAdmin: false,
            error: null,
          });
          return;
        }

        if (session?.user) {
          const fetchedMember = await fetchMember(session.user.id);
          const resolvedMember = fetchedMember || getCachedCurrentMember();
          if (fetchedMember) {
            setCachedCurrentMember(fetchedMember);
          }
          setState({
            session,
            member: resolvedMember,
            isLoading: false,
            isAdmin: resolvedMember?.is_admin ?? false,
            error: null,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchMember]);

  const signOut = useCallback(async () => {
    setCachedCurrentMember(null);
    await supabase.auth.signOut();
  }, []);

  const refreshMember = useCallback(async () => {
    if (state.session?.user) {
      const fetchedMember = await fetchMember(state.session.user.id);
      const resolvedMember = fetchedMember || getCachedCurrentMember();
      if (fetchedMember) {
        setCachedCurrentMember(fetchedMember);
      }
      setState((prev) => ({
        ...prev,
        member: resolvedMember,
        isAdmin: resolvedMember?.is_admin ?? false,
      }));
    }
  }, [state.session, fetchMember]);

  return {
    ...state,
    signOut,
    refreshMember,
  };
}
