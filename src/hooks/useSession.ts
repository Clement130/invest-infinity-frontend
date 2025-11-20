import { useAuth } from '../context/AuthContext';

export function useSession() {
  return useAuth();
}
