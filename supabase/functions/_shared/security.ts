/**
 * Module de sécurité partagé pour les Edge Functions
 * Contient : Rate Limiting, Validation, Sanitization
 */

// ==================== RATE LIMITING ====================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Cache en mémoire pour le rate limiting (reset à chaque cold start)
const rateLimitCache = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  maxRequests: number;      // Nombre max de requêtes
  windowMs: number;         // Fenêtre de temps en ms
  identifier: string;       // Identifiant unique (IP, email, etc.)
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;          // Temps en secondes avant reset
}

/**
 * Vérifie si une requête est autorisée selon le rate limit
 */
export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const key = config.identifier;
  
  // Nettoyer les entrées expirées (toutes les 100 requêtes)
  if (rateLimitCache.size > 100) {
    for (const [k, v] of rateLimitCache.entries()) {
      if (v.resetAt < now) {
        rateLimitCache.delete(k);
      }
    }
  }
  
  const entry = rateLimitCache.get(key);
  
  if (!entry || entry.resetAt < now) {
    // Nouvelle entrée ou expirée
    rateLimitCache.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: Math.ceil(config.windowMs / 1000),
    };
  }
  
  if (entry.count >= config.maxRequests) {
    // Limite atteinte
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  
  // Incrémenter le compteur
  entry.count++;
  rateLimitCache.set(key, entry);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/**
 * Obtient l'IP du client à partir des headers
 */
export function getClientIP(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

/**
 * Crée une réponse 429 Too Many Requests
 */
export function rateLimitResponse(
  resetIn: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter: resetIn,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(resetIn),
      },
    }
  );
}

// ==================== VALIDATION & SANITIZATION ====================

/**
 * Sanitize une chaîne de caractères (supprime les balises HTML et les caractères dangereux)
 */
export function sanitizeString(input: string, maxLength: number = 500): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Supprimer les balises HTML
    .replace(/<[^>]*>/g, '')
    // Supprimer les caractères de contrôle
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Échapper les caractères dangereux pour SQL/XSS
    .replace(/[<>"'`]/g, (char) => {
      const escapeMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;',
      };
      return escapeMap[char] || char;
    })
    // Limiter la longueur
    .substring(0, maxLength)
    // Trimmer
    .trim();
}

/**
 * Valide un email
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  // Regex RFC 5322 simplifiée
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Valide un numéro de téléphone international
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  
  // Format E.164 : +[code pays][numéro]
  const phoneRegex = /^\+[1-9]\d{6,14}$/;
  
  // Nettoyer les espaces et tirets
  const cleanPhone = phone.replace(/[\s\-().]/g, '');
  
  return phoneRegex.test(cleanPhone);
}

/**
 * Valide un montant (capital)
 */
export function isValidCapital(capital: unknown): { valid: boolean; value: number; error?: string } {
  if (capital === null || capital === undefined) {
    return { valid: false, value: 0, error: 'Capital is required' };
  }
  
  const value = Number(capital);
  
  if (Number.isNaN(value)) {
    return { valid: false, value: 0, error: 'Capital must be a number' };
  }
  
  if (value < 0) {
    return { valid: false, value: 0, error: 'Capital cannot be negative' };
  }
  
  if (value > 10000000) {
    return { valid: false, value: 0, error: 'Capital value seems unrealistic' };
  }
  
  return { valid: true, value };
}

/**
 * Valide un prénom/nom
 */
export function isValidName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  
  const cleanName = name.trim();
  
  // Minimum 2 caractères, maximum 100
  if (cleanName.length < 2 || cleanName.length > 100) return false;
  
  // Uniquement lettres, espaces, tirets, apostrophes
  const nameRegex = /^[\p{L}\s\-']+$/u;
  
  return nameRegex.test(cleanName);
}

// ==================== LOGGING SÉCURISÉ ====================

/**
 * Masque les données sensibles dans les logs
 */
export function sanitizeForLog(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'credit_card', 'apikey'];
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'string' && lowerKey === 'email') {
      // Masquer partiellement l'email
      const [local, domain] = value.split('@');
      if (local && domain) {
        result[key] = `${local.substring(0, 2)}***@${domain}`;
      } else {
        result[key] = '[INVALID_EMAIL]';
      }
    } else if (typeof value === 'string' && lowerKey.includes('phone')) {
      // Masquer partiellement le téléphone
      result[key] = value.length > 4 
        ? `***${value.slice(-4)}` 
        : '[REDACTED]';
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Log sécurisé qui masque les données sensibles
 */
export function secureLog(
  prefix: string,
  message: string,
  data?: Record<string, unknown>
): void {
  if (data) {
    console.log(`[${prefix}] ${message}`, sanitizeForLog(data));
  } else {
    console.log(`[${prefix}] ${message}`);
  }
}

// ==================== HEADERS DE SÉCURITÉ ====================

/**
 * Ajoute les headers de sécurité à une réponse
 */
export function addSecurityHeaders(
  headers: Record<string, string>
): Record<string, string> {
  return {
    ...headers,
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
}

