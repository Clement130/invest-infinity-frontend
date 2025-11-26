import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { UserRole } from '../types/training';
import type { Tables } from '../types/supabase';
import { 
  isAccountLocked, 
  recordFailedAttempt, 
  resetLoginAttempts 
} from '../utils/security';

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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  // Référence pour conserver le profil pendant le rafraîchissement
  const profileRef = useRef<ProfileRow | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      console.log('[AuthContext] Chargement du profil pour userId:', userId);
      
      // Timeout de 5 secondes pour éviter les blocages
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: chargement du profil trop long')), 5000);
      });
      
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

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
      profileRef.current = data; // Conserver dans la ref aussi
    } catch (err: any) {
      console.error('[AuthContext] Exception lors du chargement du profil:', err);
      if (err.message?.includes('Timeout')) {
        console.warn('[AuthContext] Timeout: le chargement du profil a pris plus de 5 secondes');
      }
      // Ne pas bloquer l'application si le profil ne charge pas - l'utilisateur peut continuer
      setProfile(null);
    }
  }, []);

  const bootstrapSession = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        await loadProfile(sessionUser.id);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('[AuthContext] Erreur dans bootstrapSession:', err);
      // Ne pas bloquer l'application même en cas d'erreur
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  useEffect(() => {
    bootstrapSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const sessionUser = session?.user ?? null;
        
        // Utiliser une fonction de callback pour accéder à la valeur actuelle de user
        setUser((previousUser) => {
          // Si c'est un rafraîchissement de token (TOKEN_REFRESHED) et que l'utilisateur est le même,
          // on ne réinitialise pas le profil pour éviter les redirections
          if (event === 'TOKEN_REFRESHED' && sessionUser?.id === previousUser?.id) {
            console.log('[AuthContext] TOKEN_REFRESHED détecté - conservation du profil existant');
            setIsRefreshing(true);
            // On garde le profil existant pendant le rafraîchissement
            // Si on a un profil en mémoire, on le conserve dans l'état
            const currentProfile = profileRef.current;
            if (currentProfile) {
              console.log('[AuthContext] Profil conservé pendant le rafraîchissement:', currentProfile.role);
              // Le profil reste dans l'état pour éviter les redirections
              setProfile(currentProfile);
            }
            // On recharge le profil en arrière-plan sans bloquer
            loadProfile(sessionUser.id).finally(() => {
              setIsRefreshing(false);
            });
            return sessionUser;
          }
          
          // Pour les autres événements (SIGNED_IN, SIGNED_OUT, etc.), on met à jour normalement
          // MAIS on conserve le profil existant si l'utilisateur est le même pour éviter les redirections
          // lors des changements d'onglet ou autres vérifications de session
          if (sessionUser) {
            // Si l'utilisateur est le même et qu'on a déjà un profil, on le conserve
            // pendant le rechargement pour éviter les redirections
            if (sessionUser.id === previousUser?.id && profileRef.current) {
              console.log('[AuthContext] Vérification de session - conservation du profil existant');
              // Conserver le profil pendant le rechargement
              setProfile(profileRef.current);
              // Recharger en arrière-plan
              loadProfile(sessionUser.id);
            } else {
              // Nouvel utilisateur ou pas de profil en mémoire, charger normalement
              loadProfile(sessionUser.id);
            }
          } else {
            setProfile(null);
            profileRef.current = null;
          }
          
          return sessionUser;
        });
      }
    );

    return () => listener?.subscription.unsubscribe();
  }, [bootstrapSession, loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      // ==================== PROTECTION BRUTE FORCE ====================
      const lockStatus = isAccountLocked(email);
      if (lockStatus.locked) {
        throw new Error(
          `Trop de tentatives. Réessayez dans ${lockStatus.remainingTime} secondes.`
        );
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Enregistrer la tentative échouée
        const attemptResult = recordFailedAttempt(email);
        
        if (attemptResult.locked) {
          throw new Error(
            `Compte temporairement bloqué. Réessayez dans ${attemptResult.lockoutTime} secondes.`
          );
        } else if (attemptResult.remainingAttempts <= 2) {
          throw new Error(
            `${error.message} (${attemptResult.remainingAttempts} tentative(s) restante(s))`
          );
        }
        
        throw error;
      }

      // Réinitialiser les tentatives après succès
      resetLoginAttempts(email);

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
