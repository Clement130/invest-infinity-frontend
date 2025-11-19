import { FormEvent, useEffect, useState } from 'react';

import { Mail, Lock } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';



export default function Login() {

  const { signIn, user, loading } = useAuth();

  const navigate = useNavigate();



  const [email, setEmail] = useState('butcher13550@gmail.com');

  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);



  // Si l'utilisateur est déjà connecté, on le pousse vers /app

  useEffect(() => {

    if (!loading && user) {

      navigate('/app', { replace: true });

    }

  }, [user, loading, navigate]);



  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {

    event.preventDefault();

    setError(null);

    setIsSubmitting(true);



    try {

      await signIn(email, password);

      // Si le signIn réussit, on redirige vers l'espace client

      navigate('/app', { replace: true });

    } catch (err: any) {

      console.error('Erreur de connexion :', err);

      const message =

        err?.message ??

        "Connexion impossible. Vérifie ton email et ton mot de passe.";



      setError(message);

    } finally {

      // quoi qu'il arrive, on réactive le bouton

      setIsSubmitting(false);

    }

  };



  const disabled = isSubmitting || !email || !password;



  return (

    <div className="min-h-screen flex items-center justify-center bg-black">

      <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900 to-black border border-white/5 shadow-2xl shadow-pink-500/10 px-8 py-10">

        <h1 className="text-3xl font-semibold text-white text-center mb-2">

          Connexion

        </h1>

        <p className="text-sm text-slate-400 text-center mb-8">

          Accède à ton espace client ou à l&apos;interface admin.

        </p>



        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="space-y-2">

            <label className="block text-sm font-medium text-slate-200">

              Email

            </label>

            <div className="relative">

              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">

                <Mail className="w-4 h-4" />

              </span>

              <input

                type="email"

                autoComplete="email"

                value={email}

                onChange={(e) => setEmail(e.target.value)}

                className="w-full bg-slate-900/60 border border-white/10 rounded-xl py-3 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/80 focus:border-pink-500 transition"

                placeholder="ton.email@example.com"

              />

            </div>

          </div>



          <div className="space-y-2">

            <label className="block text-sm font-medium text-slate-200">

              Mot de passe

            </label>

            <div className="relative">

              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">

                <Lock className="w-4 h-4" />

              </span>

              <input

                type="password"

                autoComplete="current-password"

                value={password}

                onChange={(e) => setPassword(e.target.value)}

                className="w-full bg-slate-900/60 border border-white/10 rounded-xl py-3 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/80 focus:border-pink-500 transition"

                placeholder="Ton mot de passe"

              />

            </div>

          </div>



          {error && (

            <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-100 text-xs px-3 py-2">

              {error}

            </div>

          )}



          <button

            type="submit"

            disabled={disabled}

            className={`w-full rounded-xl py-3 text-sm font-medium transition

              ${

                disabled

                  ? 'bg-pink-900/50 text-slate-400 cursor-not-allowed'

                  : 'bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white hover:from-pink-400 hover:to-fuchsia-400 shadow-lg shadow-pink-500/30'

              }`}

          >

            {isSubmitting
              ? 'Connexion…'
              : loading
              ? 'Chargement…'
              : 'Se connecter'}

          </button>

        </form>

      </div>

    </div>

  );

}
