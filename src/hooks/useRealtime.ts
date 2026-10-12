import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UseRealtimeParams {
  onDataChange: () => void;
  enabled?: boolean;
}

export function useRealtime({ onDataChange, enabled = true }: UseRealtimeParams) {
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('hisaab-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        () => {
          onDataChange();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expense_splits' },
        () => {
          onDataChange();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settlements' },
        () => {
          onDataChange();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          onDataChange();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
        () => {
          onDataChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onDataChange, enabled]);
}
