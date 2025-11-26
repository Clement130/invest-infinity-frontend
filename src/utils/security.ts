/**
 * Utilitaires de sécurité côté client
 */

// ==================== PROTECTION BRUTE FORCE ====================

interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

const LOGIN_ATTEMPTS_KEY = 'login_attempts';
const MAX_ATTEMPTS = 5;
const INITIAL_LOCKOUT_MS = 30 * 1000;     // 30 secondes
const MAX_LOCKOUT_MS = 15 * 60 * 1000;    // 15 minutes

/**
 * Récupère les tentatives de connexion stockées
 */
function getLoginAttempts(email: string): LoginAttempt {
  try {
    const stored = sessionStorage.getItem(`${LOGIN_ATTEMPTS_KEY}:${email}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignorer les erreurs de parsing
  }
  return { count: 0, lastAttempt: 0, lockedUntil: null };
}

/**
 * Sauvegarde les tentatives de connexion
 */
function saveLoginAttempts(email: string, attempts: LoginAttempt): void {
  try {
    sessionStorage.setItem(
      `${LOGIN_ATTEMPTS_KEY}:${email}`,
      JSON.stringify(attempts)
    );
  } catch {
    // Ignorer les erreurs de stockage
  }
}

/**
 * Vérifie si le compte est verrouillé
 */
export function isAccountLocked(email: string): { locked: boolean; remainingTime: number } {
  const attempts = getLoginAttempts(email.toLowerCase());
  const now = Date.now();
  
  if (attempts.lockedUntil && attempts.lockedUntil > now) {
    return {
      locked: true,
      remainingTime: Math.ceil((attempts.lockedUntil - now) / 1000),
    };
  }
  
  return { locked: false, remainingTime: 0 };
}

/**
 * Enregistre une tentative de connexion échouée
 */
export function recordFailedAttempt(email: string): { 
  locked: boolean; 
  remainingAttempts: number;
  lockoutTime: number;
} {
  const normalizedEmail = email.toLowerCase();
  const attempts = getLoginAttempts(normalizedEmail);
  const now = Date.now();
  
  // Réinitialiser si la dernière tentative date de plus de 15 minutes
  if (attempts.lastAttempt && now - attempts.lastAttempt > MAX_LOCKOUT_MS) {
    attempts.count = 0;
    attempts.lockedUntil = null;
  }
  
  attempts.count++;
  attempts.lastAttempt = now;
  
  if (attempts.count >= MAX_ATTEMPTS) {
    // Calculer le temps de blocage (exponentiel)
    const lockoutMultiplier = Math.min(
      Math.pow(2, Math.floor(attempts.count / MAX_ATTEMPTS) - 1),
      MAX_LOCKOUT_MS / INITIAL_LOCKOUT_MS
    );
    const lockoutTime = INITIAL_LOCKOUT_MS * lockoutMultiplier;
    attempts.lockedUntil = now + lockoutTime;
    
    saveLoginAttempts(normalizedEmail, attempts);
    
    return {
      locked: true,
      remainingAttempts: 0,
      lockoutTime: Math.ceil(lockoutTime / 1000),
    };
  }
  
  saveLoginAttempts(normalizedEmail, attempts);
  
  return {
    locked: false,
    remainingAttempts: MAX_ATTEMPTS - attempts.count,
    lockoutTime: 0,
  };
}

/**
 * Réinitialise les tentatives après une connexion réussie
 */
export function resetLoginAttempts(email: string): void {
  try {
    sessionStorage.removeItem(`${LOGIN_ATTEMPTS_KEY}:${email.toLowerCase()}`);
  } catch {
    // Ignorer les erreurs
  }
}

// ==================== SANITIZATION XSS ====================

/**
 * Échappe les caractères HTML dangereux
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  
  return str.replace(/[&<>"'`=/]/g, char => htmlEscapes[char] || char);
}

/**
 * Nettoie une chaîne pour éviter les injections
 */
export function sanitizeInput(input: string, maxLength: number = 500): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Supprimer les caractères de contrôle
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Supprimer les balises HTML
    .replace(/<[^>]*>/g, '')
    // Limiter la longueur
    .substring(0, maxLength)
    // Trimmer
    .trim();
}

// ==================== VALIDATION ====================

/**
 * Valide un email
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Valide la force d'un mot de passe
 */
export function validatePassword(password: string): {
  valid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score++;
  else feedback.push('Le mot de passe doit contenir au moins 8 caractères');
  
  if (password.length >= 12) score++;
  
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Ajoutez des lettres minuscules');
  
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Ajoutez des lettres majuscules');
  
  if (/[0-9]/.test(password)) score++;
  else feedback.push('Ajoutez des chiffres');
  
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push('Ajoutez des caractères spéciaux');
  
  // Vérifier les mots de passe courants
  const commonPasswords = ['password', '123456', 'qwerty', 'azerty', 'password123'];
  if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
    score = Math.max(0, score - 2);
    feedback.push('Évitez les mots de passe courants');
  }
  
  return {
    valid: score >= 4 && password.length >= 8,
    score,
    feedback,
  };
}

// ==================== PROTECTION CSRF ====================

/**
 * Génère un token CSRF
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Stocke et récupère le token CSRF
 */
export function getCsrfToken(): string {
  const storageKey = 'csrf_token';
  let token = sessionStorage.getItem(storageKey);
  
  if (!token) {
    token = generateCsrfToken();
    sessionStorage.setItem(storageKey, token);
  }
  
  return token;
}

