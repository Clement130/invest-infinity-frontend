/**
 * Composant de debug pour vérifier les variables d'environnement
 * À supprimer après résolution du problème
 */

export function EnvDebug() {
  const bunnyLibraryId = import.meta.env.VITE_BUNNY_STREAM_LIBRARY_ID;
  const bunnyEmbedUrl = import.meta.env.VITE_BUNNY_EMBED_BASE_URL;
  
  // Afficher toutes les variables VITE_*
  const allViteVars = Object.keys(import.meta.env)
    .filter(key => key.startsWith('VITE_'))
    .reduce((acc, key) => {
      acc[key] = import.meta.env[key];
      return acc;
    }, {} as Record<string, any>);

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 border border-yellow-500/50 rounded-lg p-4 text-xs font-mono z-50 max-w-md">
      <div className="text-yellow-400 font-bold mb-2">🔍 Debug Variables d'environnement</div>
      <div className="space-y-1">
        <div>
          <span className="text-gray-400">VITE_BUNNY_STREAM_LIBRARY_ID:</span>{' '}
          <span className={bunnyLibraryId ? 'text-green-400' : 'text-red-400'}>
            {bunnyLibraryId || '(non défini)'}
          </span>
        </div>
        <div>
          <span className="text-gray-400">VITE_BUNNY_EMBED_BASE_URL:</span>{' '}
          <span className={bunnyEmbedUrl ? 'text-green-400' : 'text-red-400'}>
            {bunnyEmbedUrl || '(non défini)'}
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="text-gray-400 mb-1">Toutes les variables VITE_*:</div>
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(allViteVars, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

