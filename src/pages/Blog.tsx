import React from 'react';
import { BookOpen, Clock, User, ArrowRight } from 'lucide-react';

const articles = [
  {
    title: "Les Fondamentaux de l'Analyse Technique",
    excerpt: "Découvrez les bases essentielles de l'analyse technique pour améliorer vos décisions de trading.",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80",
    category: "Analyse Technique",
    author: "Thomas Laurent",
    date: "28 Feb 2024",
    readTime: "10 min"
  },
  {
    title: "Guide Complet du Trading de Cryptomonnaies",
    excerpt: "Tout ce que vous devez savoir pour débuter dans le trading de cryptomonnaies en 2024.",
    image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&q=80",
    category: "Crypto",
    author: "Marie Dubois",
    date: "25 Feb 2024",
    readTime: "15 min"
  },
  {
    title: "Stratégies de Gestion des Risques",
    excerpt: "Apprenez à protéger votre capital avec des stratégies de gestion des risques efficaces.",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80",
    category: "Gestion des Risques",
    author: "Alexandre Martin",
    date: "22 Feb 2024",
    readTime: "12 min"
  }
];

export default function Blog() {
  return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Blog
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-500 mt-2">
              Actualités & Analyses
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Découvrez nos derniers articles, analyses et conseils pour améliorer votre trading
          </p>
        </div>

        {/* Featured Article */}
        <div className="mb-20">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-pink-800 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000" />
            <div className="relative">
              <div className="aspect-w-16 aspect-h-9 mb-8">
                <img
                  src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&q=80"
                  alt="Featured Article"
                  className="object-cover w-full h-[500px] rounded-2xl"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent rounded-2xl" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <span className="inline-block px-4 py-2 bg-pink-500 text-white text-sm font-semibold rounded-full mb-4">
                  À la une
                </span>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Les Meilleures Stratégies de Trading pour 2024
                </h2>
                <p className="text-gray-200 mb-6 max-w-3xl">
                  Découvrez les stratégies qui font leurs preuves en 2024 et comment les adapter à votre style de trading.
                </p>
                <div className="flex items-center text-gray-300 space-x-6">
                  <div className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    <span>Par Emma Petit</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    <span>20 min de lecture</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <article key={index} className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-pink-800 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000" />
              <div className="relative bg-black rounded-lg overflow-hidden">
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="object-cover w-full h-48"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-pink-400">{article.category}</span>
                    <span className="text-sm text-gray-400">{article.date}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-pink-400 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-gray-400 mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-400">
                      <BookOpen className="w-4 h-4 mr-2" />
                      {article.readTime}
                    </div>
                    <button className="text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1 group">
                      Lire plus
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}