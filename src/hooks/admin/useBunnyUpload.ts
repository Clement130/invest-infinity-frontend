import { useState, useCallback } from 'react';
import { uploadBunnyVideo } from '../../services/bunnyStreamService';
import toast from 'react-hot-toast';

export interface UploadProgress {
  id: string;
  file: File;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'ready' | 'error';
  videoId?: string;
  error?: string;
}

export const useBunnyUpload = () => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const uploadVideo = useCallback(
    async (file: File, onComplete?: (videoId: string) => void) => {
      const id = `upload-${Date.now()}-${Math.random()}`;
      const fileName = file.name;

      // Ajouter l'upload à la liste
      setUploads((prev) => [
        ...prev,
        {
          id,
          file,
          fileName,
          progress: 0,
          status: 'pending',
        },
      ]);

      try {
        // Démarrer l'upload via l'Edge Function
        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: 'uploading' } : u))
        );

        // Utiliser la fonction d'upload qui passe par l'Edge Function
        const result = await uploadBunnyVideo(fileName, file, (progress) => {
          setUploads((prev) =>
            prev.map((u) => (u.id === id ? { ...u, progress } : u))
          );
        });

        // Marquer comme prêt
        setUploads((prev) =>
          prev.map((u) =>
            u.id === id
              ? { ...u, status: 'ready', progress: 100, videoId: result.guid }
              : u
          )
        );

        toast.success(`Vidéo "${fileName}" uploadée avec succès`);
        onComplete?.(result.guid);

        // Retirer de la liste après 3 secondes
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.id !== id));
        }, 3000);
      } catch (error: any) {
        // Vérifier si l'erreur concerne les secrets manquants
        const errorMessage = error.message || 'Erreur lors de l\'upload';
        const isConfigError = errorMessage.includes('BUNNY_STREAM_LIBRARY_ID') || 
                             errorMessage.includes('BUNNY_STREAM_API_KEY') ||
                             errorMessage.includes('doivent être configurés');
        
        setUploads((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  status: 'error',
                  error: isConfigError 
                    ? 'BUNNY_STREAM_LIBRARY_ID et BUNNY_STREAM_API_KEY doivent être configurés'
                    : errorMessage,
                }
              : u
          )
        );
        toast.error(`Erreur upload "${fileName}": ${errorMessage}`);
      }
    },
    []
  );

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status !== 'ready'));
  }, []);

  return {
    uploads,
    uploadVideo,
    removeUpload,
    clearCompleted,
  };
};

