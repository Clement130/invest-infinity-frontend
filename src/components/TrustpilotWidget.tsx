import { useEffect } from "react";
import { trustpilotConfig } from "../config/trustpilot";

export default function TrustpilotWidget() {
  useEffect(() => {
    // évite de charger le script plusieurs fois
    if (document.getElementById("trustpilot-script")) return;

    const script = document.createElement("script");
    script.id = "trustpilot-script";
    script.src = "https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Vérifier si la configuration est complète
  const isConfigured = 
    trustpilotConfig.templateId !== "TON_TEMPLATE_ID" &&
    trustpilotConfig.businessUnitId !== "TON_BUSINESSUNIT_ID" &&
    trustpilotConfig.domain !== "TON_DOMAINE";

  return (
    <section className="py-24 px-4 bg-[#0f0f13]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Avis clients
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Découvrez les retours authentiques de nos membres
          </p>
        </div>

        <div className="max-w-5xl mx-auto bg-neutral-900/60 rounded-2xl p-6 border border-neutral-800">
          {!isConfigured ? (
            <div className="text-center py-8">
              <p className="text-yellow-400 mb-4">
                ⚠️ Configuration Trustpilot requise
              </p>
              <p className="text-gray-400 text-sm mb-4">
                Veuillez remplir les informations dans <code className="bg-black/40 px-2 py-1 rounded">src/config/trustpilot.ts</code>
              </p>
              <p className="text-gray-500 text-xs">
                Récupérez ces informations depuis votre dashboard Trustpilot
              </p>
            </div>
          ) : (
            <div
              className="trustpilot-widget"
              data-locale={trustpilotConfig.locale}
              data-template-id={trustpilotConfig.templateId}
              data-businessunit-id={trustpilotConfig.businessUnitId}
              data-style-height={trustpilotConfig.height}
              data-style-width={trustpilotConfig.width}
              data-theme={trustpilotConfig.theme}
            >
              <a 
                href={`https://fr.trustpilot.com/review/${trustpilotConfig.domain}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Trustpilot
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

