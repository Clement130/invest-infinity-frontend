import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function EnvironmentCheck() {
  const bunnyLibraryId = import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID;
  const bunnyApiKey = import.meta.env.VITE_BUNNY_STREAM_API_KEY;
  const bunnyEmbedUrl = import.meta.env.VITE_BUNNY_EMBED_BASE_URL;

  const isConfigured = Boolean(bunnyLibraryId && bunnyApiKey && bunnyEmbedUrl);

  if (isConfigured) {
    return null; // Ne rien afficher si tout est configuré
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-300 mb-2">
            Variables d'environnement manquantes
          </h3>
          <div className="text-xs text-gray-400 space-y-1">
            <p>Pour utiliser la gestion vidéo, configurez ces variables dans votre fichier <code className="bg-black/40 px-1 py-0.5 rounded">.env.local</code> :</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              {!bunnyLibraryId && (
                <li><code className="bg-black/40 px-1 py-0.5 rounded">VITE_BUNNY_STREAM_LIBRARY_ID</code></li>
              )}
              {!bunnyApiKey && (
                <li><code className="bg-black/40 px-1 py-0.5 rounded">VITE_BUNNY_STREAM_API_KEY</code></li>
              )}
              {!bunnyEmbedUrl && (
                <li><code className="bg-black/40 px-1 py-0.5 rounded">VITE_BUNNY_EMBED_BASE_URL</code></li>
              )}
            </ul>
            <p className="mt-2 text-amber-300">
              ⚠️ Certaines fonctionnalités seront limitées sans ces variables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

