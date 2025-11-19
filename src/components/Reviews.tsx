import React, { useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

export default function Reviews() {
  const [activeIndex, setActiveIndex] = useState(0);

  const reviews = [
    {
      name: "Thomas Laurent",
      role: "Day Trader",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80",
      content: "Les analyses en temps réel m'ont permis d'améliorer significativement mes performances. Une vraie révolution dans ma façon de trader.",
      rating: 5
    },
    {
      name: "Marie Dubois",
      role: "Crypto Investor",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80",
      content: "La communauté est incroyable. J'ai appris énormément grâce aux webinaires et aux échanges avec les autres traders.",
      rating: 5
    },
    {
      name: "Alexandre Martin",
      role: "Swing Trader",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80",
      content: "Les signaux sont d'une précision remarquable. Le support est réactif et professionnel. Je recommande vivement !",
      rating: 5
    }
  ];

  const nextSlide = () => {
    setActiveIndex((current) => (current + 1) % reviews.length);
  };

  const prevSlide = () => {
    setActiveIndex((current) => (current - 1 + reviews.length) % reviews.length);
  };

  return (
    <section id="reviews" className="py-24 bg-white relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="text-pink-500 font-semibold text-lg mb-4 block">TÉMOIGNAGES</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Ce que disent
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-pink-500">
                nos traders
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Découvrez les expériences de notre communauté de traders performants
            </p>
          </div>
        </AnimatedSection>

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {reviews.map((review, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/50 to-pink-500/50 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000" />
                    <div className="relative bg-white p-8 rounded-2xl shadow-lg border border-pink-100 group-hover:border-pink-200 transition-colors duration-300">
                      <Quote className="w-10 h-10 text-pink-500 mb-4 opacity-50" />
                      <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                        {review.content}
                      </p>
                      <div className="flex mb-4">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <div className="flex items-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-pink-500 rounded-full blur-sm opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                          <img
                            src={review.image}
                            alt={review.name}
                            className="w-14 h-14 rounded-full object-cover relative ring-2 ring-pink-100 group-hover:ring-pink-300 transition-all duration-300"
                          />
                        </div>
                        <div className="ml-4">
                          <h4 className="text-gray-900 font-semibold text-lg">{review.name}</h4>
                          <p className="text-pink-500">{review.role}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white hover:bg-pink-50 text-pink-500 p-3 rounded-full transform transition-all duration-200 hover:scale-110 shadow-lg hover:shadow-pink-100 z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white hover:bg-pink-50 text-pink-500 p-3 rounded-full transform transition-all duration-200 hover:scale-110 shadow-lg hover:shadow-pink-100 z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots navigation */}
          <div className="flex justify-center mt-8 gap-2">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === activeIndex 
                    ? 'bg-pink-500 w-8' 
                    : 'bg-pink-200 w-2.5 hover:bg-pink-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}