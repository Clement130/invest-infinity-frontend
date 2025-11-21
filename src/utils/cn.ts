/**
 * Utilitaire pour combiner les classes CSS
 * Version simplifiée de clsx/classnames
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

