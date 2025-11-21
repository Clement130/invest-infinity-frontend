import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { UserRole } from '../types/training';
import type { Tables } from '../types/supabase';

type ProfileRow = Tables<'profiles'>;

interface AuthContextType {
  user: User | null;
  profile: ProfileRow | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      console.log('[AuthContext] Chargement du profil pour userId:', userId);
      
      // Timeout de 10 secondes pour éviter l'attente infinie (augmenté pour les connexions lentes)
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: chargement du profil trop long')), 10000);
      });

      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (error && error.code !== 'PGRST116') {
        console.error('[AuthContext] Erreur profil:', error);
        console.error('[AuthContext] Code:', error.code, 'Message:', error.message);
        
        // Si le profil n'existe pas, on le crée automatiquement avec le rôle 'client' par défaut
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          console.log('[AuthContext] Profil non trouvé, tentative de création...');
          
          // Récupérer l'email de l'utilisateur auth
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser?.user?.email) {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: authUser.user.email,
                role: 'client',
              })
              .select()
              .single();

            if (createError) {
              console.error('[AuthContext] Erreur lors de la création du profil:', createError);
              setProfile(null);
              return;
            }

            console.log('[AuthContext] Profil créé automatiquement:', { id: newProfile.id, email: newProfile.email, role: newProfile.role });
            setProfile(newProfile);
            return;
          }
        }
        
        setProfile(null);
        return;
      }

      if (!data) {
        console.warn('[AuthContext] Profil non trouvé (data est null)');
        // Essayer de créer le profil si l'utilisateur auth existe
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser?.user?.email) {
          console.log('[AuthContext] Tentative de création du profil...');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: authUser.user.email,
              role: 'client',
            })
            .select()
            .single();

          if (!createError && newProfile) {
            console.log('[AuthContext] Profil créé:', { id: newProfile.id, email: newProfile.email, role: newProfile.role });
            setProfile(newProfile);
            return;
          }
        }
        setProfile(null);
        return;
      }

      console.log('[AuthContext] Profil chargé:', { id: data.id, email: data.email, role: data.role });
      setProfile(data);
    } catch (err: any) {
      console.error('[AuthContext] Exception lors du chargement du profil:', err);
      if (err.message?.includes('Timeout')) {
        console.warn('[AuthContext] Timeout: le chargement du profil a pris plus de 10 secondes. Vérifiez votre connexion ou la configuration Supabase.');
      }
      // Ne pas bloquer l'application si le profil ne charge pas - l'utilisateur peut continuer
      setProfile(null);
    }
  }, []);

  const bootstrapSession = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const sessionUser = data.session?.user ?? null;
    setUser(sessionUser);

    if (sessionUser) {
      await loadProfile(sessionUser.id);
    } else {
      setProfile(null);
    }

    setLoading(false);
  }, [loadProfile]);

  useEffect(() => {
    bootstrapSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        const sessionUser = session?.user ?? null;
        setUser(sessionUser);

        if (sessionUser) {
          await loadProfile(sessionUser.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => listener?.subscription.unsubscribe();
  }, [bootstrapSession, loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      setUser(data.user);
      await loadProfile(data.user.id);
    },
    [loadProfile]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
    }
  }, [loadProfile, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role ?? null,
        loading,
        signIn,
        signOut,
        refreshProfile,
      }}
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
