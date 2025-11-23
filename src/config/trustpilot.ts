// Configuration Trustpilot
// Remplacez ces valeurs par celles fournies par Trustpilot dans votre dashboard
// Dashboard: https://businessapp.b2b.trustpilot.com/features/trustbox-widgets
//
// Pour obtenir ces valeurs:
// 1. Connectez-vous sur https://businessapp.b2b.trustpilot.com
// 2. Allez dans Features > TrustBox widgets
// 3. Cliquez sur "Get code" / "Obtenir le code"
// 4. Copiez le code HTML et exécutez: node scripts/configure-trustpilot.js "<code HTML>"
//    OU remplacez manuellement les valeurs ci-dessous

export const trustpilotConfig = {
  // Template ID - Trouvé dans le code TrustBox (attribut data-template-id)
  templateId: process.env.VITE_TRUSTPILOT_TEMPLATE_ID || "TON_TEMPLATE_ID",
  
  // Business Unit ID - Trouvé dans le code TrustBox (attribut data-businessunit-id)
  businessUnitId: process.env.VITE_TRUSTPILOT_BUSINESSUNIT_ID || "TON_BUSINESSUNIT_ID",
  
  // Domaine - Votre domaine Trustpilot (ex: invest-infinity.com)
  // Trouvé dans l'URL du lien: https://fr.trustpilot.com/review/VOTRE_DOMAINE
  domain: process.env.VITE_TRUSTPILOT_DOMAIN || "TON_DOMAINE",
  
  // Locale
  locale: "fr-FR",
  
  // Thème
  theme: "dark" as "dark" | "light",
  
  // Dimensions
  height: "400px",
  width: "100%",
};

