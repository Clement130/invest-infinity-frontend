import { useState } from 'react';
import { AlertCircle, CheckCircle2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export function EnvironmentCheck() {
  // ⚠️ SÉCURITÉ: VITE_BUNNY_STREAM_API_KEY n'est plus nécessaire côté client
  // Les clés API sont gérées par les Edge Functions
  const bunnyLibraryId = import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID;
  const bunnyEmbedUrl = import.meta.env.VITE_BUNNY_EMBED_BASE_URL;
  const [copied, setCopied] = useState<string | null>(null);

  // VITE_BUNNY_STREAM_LIBRARY_ID est toujours nécessaire pour les URLs CDN (non sensible)
  // VITE_BUNNY_EMBED_BASE_URL est nécessaire pour le lecteur vidéo
  const isConfigured = Boolean(bunnyLibraryId && bunnyEmbedUrl);

  // Debug: log dans la console
  if (typeof window !== 'undefined' && !isConfigured) {
    console.warn('[EnvironmentCheck] Variables manquantes:', {
      VITE_BUNNY_STREAM_LIBRARY_ID: bunnyLibraryId || 'NON DÉFINI',
      VITE_BUNNY_EMBED_BASE_URL: bunnyEmbedUrl || 'NON DÉFINI',
      allViteEnv: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')),
    });
  }

  if (isConfigured) {
    return null; // Ne rien afficher si tout est configuré
  }

  const missingVars = [
    !bunnyLibraryId && 'VITE_BUNNY_STREAM_LIBRARY_ID',
    !bunnyEmbedUrl && 'VITE_BUNNY_EMBED_BASE_URL',
  ].filter(Boolean) as string[];

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      toast.success('Variable copiée dans le presse-papiers');
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      toast.error('Impossible de copier');
    }
  };

  const copyAllVars = () => {
    const envContent = missingVars.map(v => `${v}=`).join('\n');
    copyToClipboard(envContent);
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-amber-300">
              Variables d'environnement manquantes
            </h3>
            {missingVars.length > 1 && (
              <button
                onClick={copyAllVars}
                className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                Copier tout
              </button>
            )}
          </div>
          <div className="text-xs text-gray-400 space-y-2">
            <p>Pour utiliser la gestion vidéo, configurez ces variables dans votre fichier <code className="bg-black/40 px-1 py-0.5 rounded">.env.local</code> :</p>
            <ul className="space-y-1.5">
              {!bunnyLibraryId && (
                <li className="flex items-center gap-2">
                  <code className="bg-black/40 px-2 py-1 rounded flex-1 font-mono text-xs">
                    VITE_BUNNY_STREAM_LIBRARY_ID
                  </code>
                  <button
                    onClick={() => copyToClipboard('VITE_BUNNY_STREAM_LIBRARY_ID=')}
                    className="p-1 rounded hover:bg-amber-500/20 transition"
                    title="Copier"
                  >
                    {copied === 'VITE_BUNNY_STREAM_LIBRARY_ID=' ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-amber-300" />
                    )}
                  </button>
                </li>
              )}
              {!bunnyEmbedUrl && (
                <li className="flex items-center gap-2">
                  <code className="bg-black/40 px-2 py-1 rounded flex-1 font-mono text-xs">
                    VITE_BUNNY_EMBED_BASE_URL
                  </code>
                  <button
                    onClick={() => copyToClipboard('VITE_BUNNY_EMBED_BASE_URL=')}
                    className="p-1 rounded hover:bg-amber-500/20 transition"
                    title="Copier"
                  >
                    {copied === 'VITE_BUNNY_EMBED_BASE_URL=' ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-amber-300" />
                    )}
                  </button>
                </li>
              )}
            </ul>
            <p className="mt-2 text-amber-300 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Certaines fonctionnalités seront limitées sans ces variables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

