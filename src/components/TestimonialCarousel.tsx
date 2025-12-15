import { trustpilotConfig } from '../config/trustpilot';

const testimonials = [
  {
    text: "Une team en or ! InvestInfinity, c'est vraiment une équipe exceptionnelle. Toujours présente pour aider, expliquer et pousser chacun à donner le meilleur de soi-même. Grâce à eux, j'ai énormément progressé et pris confiance dans mon trading. On apprend, on partage, on s'entraide — tout ça dans une super ambiance, motivante et bienveillante. Un énorme big up à toute la team InvestInfinity 🔥💪 vous êtes au top !",
    author: 'M. SERY Damien',
    date: '12 novembre 2025',
  },
  {
    text: "Comment ne pas mettre 5 étoiles avec de telle prof une super pédagogie ils t'apprenne à prendre confiance pour te lancer merci la team",
    author: 'Kévin Ferreira',
    date: '10 novembre 2025',
  },
  {
    text: "Je me permets de réécrire un avis parce que après plus d'une semaine a leurs côtés j'ai énormément appris et les résultats sont extraordinaires de plus 3 coachs et en live pour la transparence c'est du bonheur. Ils nous apprennent et corrige nos erreurs, franchement j'ai rien trouver de mieux. J'ai qu'une chose a dire foncer les yeux fermés.",
    author: 'Gianni',
    date: '5 novembre 2025',
  },
];

const StarIcon = () => <span className="text-yellow-400 text-lg">★</span>;

const TestimonialCarousel = () => {
  const trustpilotUrl = `https://fr.trustpilot.com/review/${trustpilotConfig.domain}`;

  return (
    <section className="py-20 bg-[#05070d] relative overflow-hidden">

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 text-emerald-300 text-sm font-semibold uppercase tracking-wide">
            <span>Vérifié par</span>
            <span className="flex items-center gap-1">
              <span className="text-lg">★</span> Trustpilot
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">
            Ils nous notent <span className="text-emerald-300">4,5★</span> sur Trustpilot
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto">
            Avis authentiques issus de notre profil public. Aucun filtre, juste les retours de la communauté InvestInfinity.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-6">
            <a
              href={trustpilotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white border border-white/20 hover:bg-white/20 transition"
            >
              Voir les 18 avis complets
              <span aria-hidden>↗</span>
            </a>
            <p className="text-gray-400 text-sm">
              Mis à jour automatiquement par Trustpilot
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 overflow-x-auto md:overflow-visible snap-x md:snap-none">
          {testimonials.map((review, index) => (
            <article
              key={review.author}
              className="bg-[#0d111c] p-6 rounded-2xl border border-white/10 min-w-[280px] snap-center shadow-[0_15px_40px_rgba(6,10,20,0.6)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex mb-3 text-emerald-300" aria-label="Note cliente">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={`${index}-star-${i}`} />
                ))}
              </div>
              <p className="text-gray-200 italic leading-relaxed line-clamp-6">"{review.text}"</p>
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="font-semibold text-white">{review.author}</p>
                <p className="text-sm text-gray-400">{review.date}</p>
                <p className="text-xs text-emerald-300 font-medium mt-2 flex items-center gap-1">
                  ✅ Avis publié sur Trustpilot
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialCarousel;

