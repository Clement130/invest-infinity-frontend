import { useEffect } from 'react';
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
  useEffect(() => {
    if (document.getElementById('trustpilot-script-micro')) return;
    const script = document.createElement('script');
    script.id = 'trustpilot-script-micro';
    script.src = 'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const isTrustpilotConfigured =
    trustpilotConfig.templateId !== '54197383fd9dceac42a68694' ||
    trustpilotConfig.businessUnitId !== '68ba93e234cd8124d1d2cdb4' ||
    trustpilotConfig.domain !== 'investinfinity.fr';

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">
            Vérifié par Trustpilot
          </p>
          <h2 className="text-3xl font-extrabold text-gray-900 mt-2 mb-3">
            18 avis 5 étoiles – Note moyenne 4.5/5
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Ils valident notre accompagnement : voici les derniers avis authentiques issus de
            Trustpilot.
          </p>
        </div>

        {isTrustpilotConfigured && (
          <div
            className="trustpilot-widget mx-auto mb-12 max-w-sm"
            data-locale={trustpilotConfig.locale}
            data-template-id={trustpilotConfig.templateId}
            data-businessunit-id={trustpilotConfig.businessUnitId}
            data-style-height="24px"
            data-style-width="100%"
            data-theme="light"
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

        <div className="grid gap-6 md:grid-cols-3 overflow-x-auto md:overflow-visible snap-x md:snap-none">
          {testimonials.map((review, index) => (
            <article
              key={review.author}
              className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 min-w-[280px] snap-center"
            >
              <div className="flex mb-3" aria-label="Note cliente">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={`${index}-star-${i}`} />
                ))}
              </div>
              <p className="text-gray-700 italic leading-relaxed line-clamp-6">"{review.text}"</p>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="font-semibold text-gray-900">{review.author}</p>
                <p className="text-sm text-gray-500">{review.date}</p>
                <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                  ✅ Vérifié par Trustpilot
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

