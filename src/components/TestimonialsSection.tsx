import { Star, Quote, Play } from 'lucide-react';
import { useState } from 'react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  results: string;
  verified: boolean;
  videoUrl?: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Alexandre M.',
    role: 'Trader Indépendant',
    quote:
      'Grâce à cette formation, j\'ai pu passer de trader débutant à trader profitable en 6 mois. Les stratégies enseignées sont concrètes et applicables immédiatement.',
    rating: 5,
    results: '+35% de rendement en 6 mois',
    verified: true,
  },
  {
    id: '2',
    name: 'Sophie L.',
    role: 'Investisseuse',
    quote:
      'La qualité du contenu et le suivi personnalisé m\'ont permis d\'atteindre mes objectifs financiers. Je recommande vivement !',
    rating: 5,
    results: 'Premier mois profitable',
    verified: true,
  },
  {
    id: '3',
    name: 'Thomas R.',
    role: 'Entrepreneur',
    quote:
      'Les masterclass avec les intervenants extérieurs sont exceptionnelles. J\'ai appris des techniques que je n\'aurais jamais découvertes ailleurs.',
    rating: 5,
    results: 'Consistantly profitable depuis 3 mois',
    verified: true,
  },
];

interface TestimonialsSectionProps {
  onOpenRegister?: () => void;
  showCTA?: boolean;
  maxItems?: number;
}

export default function TestimonialsSection({
  onOpenRegister,
  showCTA = true,
  maxItems,
}: TestimonialsSectionProps) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const displayTestimonials = maxItems ? testimonials.slice(0, maxItems) : testimonials;

  return (
    <section className="py-20 bg-gradient-to-b from-black via-slate-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Ils ont transformé leur trading
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Découvrez les parcours de réussite de nos membres qui ont atteint leurs objectifs
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {displayTestimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4 hover:bg-white/10 transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{testimonial.name}</h4>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                {testimonial.verified && (
                  <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                    ✓ Vérifié
                  </span>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < testimonial.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>

              {/* Quote */}
              <div className="space-y-2">
                <Quote className="w-6 h-6 text-pink-400" />
                <p className="text-gray-300 italic">"{testimonial.quote}"</p>
              </div>

              {/* Results */}
              <div className="pt-2 border-t border-white/10">
                <p className="text-sm font-semibold text-green-400">{testimonial.results}</p>
              </div>

              {/* Video Button */}
              {testimonial.videoUrl && (
                <button
                  onClick={() => setSelectedVideo(testimonial.videoUrl || null)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 transition"
                >
                  <Play className="w-4 h-4" />
                  Voir le témoignage vidéo
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Call to Action */}
        {showCTA && onOpenRegister && (
          <div className="rounded-xl border border-pink-500/30 bg-gradient-to-r from-pink-500/10 to-purple-500/10 p-8 text-center space-y-4">
            <h3 className="text-2xl font-bold text-white">
              Rejoignez des centaines de traders qui réussissent
            </h3>
            <p className="text-gray-300">
              Commencez votre parcours vers la réussite en trading dès aujourd'hui
            </p>
            <button
              onClick={onOpenRegister}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition font-semibold text-white"
            >
              Rejoindre la formation
            </button>
          </div>
        )}

        {/* Video Modal */}
        {selectedVideo && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <div
              className="bg-slate-900 rounded-xl p-4 max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={selectedVideo}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="mt-4 w-full px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition text-white"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

