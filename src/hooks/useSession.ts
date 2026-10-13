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
  // If we have a cached member, resolve immediately (no loading spinner).
  // The network call below will run in the background and update state.
  const [state, setState] = useState<SessionState>({
    session: null,
    member: cachedMember,
    isLoading: cachedMember === null, // only show loading if we have no cached data
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
    // Get initial session — resolves from Supabase's local storage cache
    // immediately when offline (no network call needed for the session token itself).
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Try to fetch fresh member data from server.
        // If offline, fetchMember returns null and we fall back to cache.
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
        // No active session — redirect to welcome only if no cached member either
        const cached = getCachedCurrentMember();
        if (cached) {
          // Edge case: session expired but cache exists — still mark done
          setState((prev) => ({ ...prev, isLoading: false }));
        } else {
          setState({
            session: null,
            member: null,
            isLoading: false,
            isAdmin: false,
            error: null,
          });
        }
      }
    }).catch(() => {
      // getSession itself threw (extreme offline scenario) — use cache
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
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
