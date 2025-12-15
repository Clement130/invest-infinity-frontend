/**
 * Utilitaires pour générer les données structurées (JSON-LD) pour le SEO
 */

export interface OrganizationStructuredData {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
  contactPoint?: {
    '@type': string;
    contactType: string;
    email?: string;
    url?: string;
  };
}

export interface CourseStructuredData {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  provider: {
    '@type': string;
    name: string;
    url: string;
  };
  url: string;
  image?: string;
  offers?: {
    '@type': string;
    price: string;
    priceCurrency: string;
    availability: string;
    url: string;
  };
}

export interface FAQStructuredData {
  '@context': string;
  '@type': string;
  mainEntity: Array<{
    '@type': string;
    name: string;
    acceptedAnswer: {
      '@type': string;
      text: string;
    };
  }>;
}

export interface BreadcrumbStructuredData {
  '@context': string;
  '@type': string;
  itemListElement: Array<{
    '@type': string;
    position: number;
    name: string;
    item: string;
  }>;
}

/**
 * Génère les données structurées pour l'organisation
 */
export function generateOrganizationStructuredData(): OrganizationStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Invest Infinity',
    url: 'https://investinfinity.fr',
    logo: 'https://investinfinity.fr/logo.png',
    description: 'Plateforme de formation et communauté de trading premium. Formations complètes, sessions de trading en direct, communauté active et accompagnement personnalisé.',
    sameAs: [
      'https://discord.gg/investinfinity',
      // Ajoutez d'autres réseaux sociaux si disponibles
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Support client',
      url: 'https://investinfinity.fr/contact',
    },
  };
}

/**
 * Génère les données structurées pour un cours/formation
 */
export function generateCourseStructuredData(
  name: string,
  description: string,
  url: string,
  price?: string,
  priceCurrency: string = 'EUR',
  image?: string
): CourseStructuredData {
  const courseData: CourseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: 'Invest Infinity',
      url: 'https://investinfinity.fr',
    },
    url,
  };

  if (image) {
    courseData.image = image;
  }

  if (price) {
    courseData.offers = {
      '@type': 'Offer',
      price,
      priceCurrency,
      availability: 'https://schema.org/InStock',
      url,
    };
  }

  return courseData;
}

/**
 * Génère les données structurées pour une FAQ
 */
export function generateFAQStructuredData(
  questions: Array<{ question: string; answer: string }>
): FAQStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

/**
 * Génère les données structurées pour un fil d'Ariane (breadcrumb)
 */
export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>
): BreadcrumbStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Génère les données structurées pour un produit/service
 */
export function generateProductStructuredData(
  name: string,
  description: string,
  price: string,
  priceCurrency: string = 'EUR',
  url: string,
  image?: string,
  availability: string = 'https://schema.org/InStock'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: image || 'https://investinfinity.fr/logo.png',
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency,
      availability,
      url,
      seller: {
        '@type': 'Organization',
        name: 'Invest Infinity',
      },
    },
  };
}

