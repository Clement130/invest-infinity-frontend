interface BunnyPlayerProps {
  videoId: string;
}

export default function BunnyPlayer({ videoId }: BunnyPlayerProps) {
  const baseUrl = import.meta.env.VITE_BUNNY_EMBED_BASE_URL;

  if (!baseUrl) {
    return (
      <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden border border-red-500/30 bg-black/50 flex items-center justify-center">
        <div className="text-center space-y-2 px-4">
          <p className="text-red-400 font-medium">
            Bunny Stream n'est pas configuré
          </p>
          <p className="text-sm text-gray-400">
            La variable d'environnement VITE_BUNNY_EMBED_BASE_URL est manquante.
          </p>
        </div>
      </div>
    );
  }

  if (!videoId || videoId.trim() === '') {
    return (
      <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden border border-yellow-500/30 bg-black/50 flex items-center justify-center">
        <div className="text-center space-y-2 px-4">
          <p className="text-yellow-400 font-medium">Vidéo non configurée</p>
          <p className="text-sm text-gray-400">
            Aucun identifiant vidéo n'est associé à cette leçon.
          </p>
        </div>
      </div>
    );
  }

  // Construction de l'URL d'embed
  // Note: Adaptez ce format selon votre configuration Bunny Stream
  // Exemple: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
  // ou: https://vz-{libraryId}.b-cdn.net/{videoId}/play_720p.mp4
  const embedUrl = `${baseUrl}/${videoId}`;

  return (
    <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        title="Lecteur vidéo Bunny Stream"
      />
    </div>
  );
}


