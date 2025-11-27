/**
 * Utilitaires de sécurité côté client
 */

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
