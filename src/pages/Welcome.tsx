import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { leadApi } from '../services/leadApi';

export default function Welcome() {
  const navigate = useNavigate();
  const [budget, setBudget] = useState('');
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const budgetNumber = parseInt(budget, 10);

    if (budgetNumber < 200) {
      setError('Le dépôt minimum chez RaiseFX est de 200€');
      return;
    }

    // Récupérer l'email stocké lors de l'inscription
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      setError("Email introuvable. Veuillez vous réinscrire.");
      return;
    }

    setIsUpdating(true);
    try {
      await leadApi.updateCapital({
        email: userEmail,
        capital: budgetNumber,
      });
      navigate('/trading-account');
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du capital :', err);
      setError(
        err?.message ?? 'Erreur lors de la mise à jour du capital. Réessaie.',
      );
    } finally {
      setIsUpdating(false);
    }
  };
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setBudget(value);
    setError(''); // Réinitialiser l'erreur quand l'utilisateur modifie la valeur
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-900/10 via-black to-black pt-32 pb-20">

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-pink-500/10 mb-8">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <span className="text-pink-200">Bienvenue dans la communauté</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Bienvenue chez
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-500 mt-2">
              InvestInfinity
            </span>
          </h1>
          <p className="text-xl text-pink-100 max-w-2xl mx-auto mb-2">
            Complétez votre profil de trader en quelques secondes
          </p>
        </div>

        {/* Profile Form */}
        <div className="relative overflow-hidden">
          <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-pink-500/10">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Budget Input */}
              <div>
                <label htmlFor="budget" className="block text-lg font-medium text-pink-100 mb-4">
                  Quel est votre budget pour le trading ?
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={isUpdating}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    id="budget"
                    name="budget"
                    required
                    value={budget}
                    onChange={handleBudgetChange}
                    className={`
                      w-full
                      bg-black/20
                      border
                      text-white
                      rounded-xl
                      px-6
                      py-4
                      text-lg
                      placeholder-pink-200/50
                      transition-all
                      duration-300
                      focus:outline-none
                      focus:ring-2
                      focus:ring-pink-500/50
                      pr-16
                      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-pink-500/20 focus:border-pink-500'}
                    `}
                    placeholder="Entrez votre budget"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-pink-200 pointer-events-none">
                    EUR
                  </span>
                </div>
                {error && (
                  <div className="mt-2 flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isUpdating}
                className="
                  w-full
                  group
                  relative
                  overflow-hidden
                  bg-gradient-to-r
                  from-pink-500
                  to-pink-800
                  text-white
                  rounded-xl
                  py-4
                  px-6
                  text-lg
                  font-semibold
                  transition-all
                  duration-300
                  hover:from-pink-500
                  hover:to-pink-600
                  focus:outline-none
                  focus:ring-2
                  focus:ring-pink-500
                  focus:ring-offset-2
                  focus:ring-offset-black
                  shadow-lg
                  shadow-pink-500/25
                  hover:shadow-pink-500/50
                "
              >
                <span className="relative flex items-center justify-center gap-2">
                  Enregistrer mes informations
                  <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
            <div className="w-12 h-0.5 bg-pink-500/30"></div>
            <div className="w-3 h-3 rounded-full bg-pink-500/30"></div>
          </div>
          <p className="text-pink-200/60 text-sm">Étape 1 sur 2</p>
        </div>
      </div>
    </div>
  );
}