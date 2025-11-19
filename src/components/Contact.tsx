import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Contact() {
  return (
    <section id="contact" className="py-20 bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Contactez-nous
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Notre équipe est à votre disposition pour répondre à toutes vos questions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <Mail className="w-6 h-6 text-[#8A2BE2] mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-2">Email</h3>
                <p className="text-gray-400">contact@example.com</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Phone className="w-6 h-6 text-[#8A2BE2] mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-2">Téléphone</h3>
                <p className="text-gray-400">+33 1 23 45 67 89</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <MapPin className="w-6 h-6 text-[#8A2BE2] mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-2">Adresse</h3>
                <p className="text-gray-400">123 Rue Example, 75000 Paris</p>
              </div>
            </div>
          </div>

          <form className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="Votre nom"
                className="w-full px-4 py-3 bg-[#2A2A2A] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Votre email"
                className="w-full px-4 py-3 bg-[#2A2A2A] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
              />
            </div>
            <div>
              <textarea
                rows={4}
                placeholder="Votre message"
                className="w-full px-4 py-3 bg-[#2A2A2A] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
              />
            </div>
            <button className="w-full px-8 py-3 bg-[#8A2BE2] text-white rounded-md hover:bg-[#9D4EDD] transition-colors">
              Envoyer
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}