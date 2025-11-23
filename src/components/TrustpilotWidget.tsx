import { useEffect } from "react";

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
          {/* ✅ COLLE ICI TON TRUSTBOX OFFICIEL */}
          <div
            className="trustpilot-widget"
            data-locale="fr-FR"
            data-template-id="TON_TEMPLATE_ID"
            data-businessunit-id="TON_BUSINESSUNIT_ID"
            data-style-height="400px"
            data-style-width="100%"
            data-theme="dark"
          >
            <a href="https://fr.trustpilot.com/review/TON_DOMAINE" target="_blank" rel="noopener noreferrer">
              Trustpilot
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

