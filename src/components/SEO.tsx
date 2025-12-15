import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'course';
  siteName?: string;
  locale?: string;
  structuredData?: object;
  noindex?: boolean;
  nofollow?: boolean;
  canonical?: string;
}

const DEFAULT_TITLE = 'Invest Infinity - Formation Trading & Éducation Financière';
const DEFAULT_DESCRIPTION = 'Apprenez le trading avec Invest Infinity. Formations complètes, communauté active, sessions de trading en direct et accompagnement personnalisé. Rejoignez des milliers de traders qui réussissent.';
const DEFAULT_IMAGE = 'https://investinfinity.fr/logo.png';
const DEFAULT_URL = 'https://investinfinity.fr';
const DEFAULT_SITE_NAME = 'Invest Infinity';
const DEFAULT_LOCALE = 'fr_FR';

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = 'trading, formation trading, éducation financière, trading en ligne, apprendre le trading, communauté traders, analyse technique, analyse fondamentale, forex, crypto, actions',
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  siteName = DEFAULT_SITE_NAME,
  locale = DEFAULT_LOCALE,
  structuredData,
  noindex = false,
  nofollow = false,
  canonical,
}: SEOProps) {
  const location = useLocation();
  const currentUrl = url || `${DEFAULT_URL}${location.pathname}`;
  const canonicalUrl = canonical || currentUrl;
  const fullTitle = title.includes('Invest Infinity') ? title : `${title} | Invest Infinity`;

  useEffect(() => {
    // Title
    document.title = fullTitle;

    // Meta tags de base
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', 'Invest Infinity');
    updateMetaTag('robots', noindex || nofollow ? `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}` : 'index, follow');
    updateMetaTag('language', 'French');
    updateMetaTag('revisit-after', '7 days');

    // Open Graph
    updateMetaTag('og:title', fullTitle, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:image', image, 'property');
    updateMetaTag('og:url', currentUrl, 'property');
    updateMetaTag('og:type', type, 'property');
    updateMetaTag('og:site_name', siteName, 'property');
    updateMetaTag('og:locale', locale, 'property');

    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:site', '@InvestInfinity');
    updateMetaTag('twitter:creator', '@InvestInfinity');

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Structured Data (JSON-LD)
    if (structuredData) {
      // Supprimer tous les scripts JSON-LD existants
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
      existingScripts.forEach(script => script.remove());

      // Si structuredData est un tableau, créer un script par élément
      // Sinon, créer un seul script
      const dataArray = Array.isArray(structuredData) ? structuredData : [structuredData];
      
      dataArray.forEach((data) => {
        const script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
      });
    }

    // Hreflang (si nécessaire pour multi-langue)
    // Pour l'instant, on ne met que le français
    let hreflangLink = document.querySelector('link[rel="alternate"][hreflang="fr"]');
    if (!hreflangLink) {
      hreflangLink = document.createElement('link');
      hreflangLink.setAttribute('rel', 'alternate');
      hreflangLink.setAttribute('hreflang', 'fr');
      hreflangLink.setAttribute('href', currentUrl);
      document.head.appendChild(hreflangLink);
    } else {
      hreflangLink.setAttribute('href', currentUrl);
    }

    // X-default
    let xDefaultLink = document.querySelector('link[rel="alternate"][hreflang="x-default"]');
    if (!xDefaultLink) {
      xDefaultLink = document.createElement('link');
      xDefaultLink.setAttribute('rel', 'alternate');
      xDefaultLink.setAttribute('hreflang', 'x-default');
      xDefaultLink.setAttribute('href', currentUrl);
      document.head.appendChild(xDefaultLink);
    } else {
      xDefaultLink.setAttribute('href', currentUrl);
    }
  }, [fullTitle, description, keywords, image, currentUrl, canonicalUrl, type, siteName, locale, structuredData, noindex, nofollow]);

  return null;
}

function updateMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let meta = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

