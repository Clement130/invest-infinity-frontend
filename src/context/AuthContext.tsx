import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { UserRole } from '../types/training';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

type ProfileRow = {
  role: UserRole | null;
  user_id?: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function loadProfileForSession(sessionUser: User | null) {
    if (!sessionUser) {
      setRole(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', sessionUser.id)
      .maybeSingle();

    if (error) {
      console.error('Erreur profil:', error);
      setRole(null);
      return;
    }

    const profile = (data ?? null) as ProfileRow | null;
    setRole(profile?.role ?? null);
  }

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      setUser(session?.user ?? null);
      await loadProfileForSession(session?.user ?? null);

      setLoading(false);
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setUser(session?.user ?? null);
        await loadProfileForSession(session?.user ?? null);
      }
    );

    return () => listener?.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    setUser(data.user);
    await loadProfileForSession(data.user);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, role, loading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }

  return context;
}
