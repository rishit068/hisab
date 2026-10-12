import { createContext, useContext, type ReactNode } from 'react';
import { useSession } from '../../hooks/useSession';
import type { Member } from '../../types/database';
import type { Session } from '@supabase/supabase-js';

interface AuthContextValue {
  session: Session | null;
  member: Member | null;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshMember: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useSession();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
