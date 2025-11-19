import React from 'react';

export default function About() {
  return (
    <section id="apropos" className="py-20 bg-[#2A2A2A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              À Propos de Nous
            </h2>
            <p className="text-gray-300 mb-6">
              Notre mission est de fournir des solutions innovantes et performantes pour répondre aux besoins de nos clients. Avec une expertise approfondie et une passion pour l'excellence, nous nous engageons à offrir le meilleur service possible.
            </p>
            <p className="text-gray-300 mb-8">
              Nous croyons en l'innovation continue et en l'amélioration constante de nos services pour garantir votre satisfaction.
            </p>
            <button className="px-8 py-3 bg-[#8A2BE2] text-white rounded-md hover:bg-[#9D4EDD] transition-colors">
              En savoir plus
            </button>
          </div>
          <div className="relative">
            <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80"
                alt="Notre équipe"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}