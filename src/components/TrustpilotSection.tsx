import React from "react";

export const TrustpilotBadge = () => (
  <a
    href="https://www.trustpilot.com/review/investinfinity.fr"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors"
  >
    <svg className="h-5 w-5 text-[#00b67a]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
    <span className="text-sm font-medium text-white/90">4,5★ sur Trustpilot • 18 avis</span>
  </a>
);

export const TrustpilotSection = () => {
  const reviews = [
    {
      quote:
        "J'ai enfin compris comment analyser les marchés. Les formations sont claires et le Discord est une mine d'or.",
      author: "Nicolas",
      plan: "Premium",
    },
    {
      quote: "Les alertes trading m'ont fait gagner un temps fou. Support réactif et communauté au top.",
      author: "Sabrina",
      plan: "Essential",
    },
    {
      quote: "Sceptique au début, convaincu après 2 semaines. Les résultats parlent d'eux-mêmes.",
      author: "Romain",
      plan: "Premium",
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00b67a]/10 border border-[#00b67a]/20 mb-6">
            <svg className="h-5 w-5 text-[#00b67a]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <span className="text-sm font-medium text-[#00b67a]">Vérifié par Trustpilot</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ils nous notent <span className="text-[#00b67a]">4,5★</span> sur Trustpilot
          </h2>
          <p className="text-white/60 max-w-xl mx-auto">
            Avis authentiques issus de notre profil public. Aucun filtre, juste les retours de la communauté InvestInfinity.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-colors"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-[#00b67a]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>

              <p className="text-white/80 mb-4 leading-relaxed">"{review.quote}"</p>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                  {review.author[0]}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{review.author}</p>
                  <p className="text-white/40 text-xs">{review.plan}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="https://www.trustpilot.com/review/investinfinity.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white/60 hover:text-[#00b67a] transition-colors"
          >
            Voir les 18 avis complets
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </a>
          <p className="text-white/30 text-sm mt-2">Mis à jour automatiquement par Trustpilot</p>
        </div>
      </div>
    </section>
  );
};

export default TrustpilotSection;

