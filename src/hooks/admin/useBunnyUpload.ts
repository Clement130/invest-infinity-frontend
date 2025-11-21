import { useState, useCallback } from 'react';
import { createBunnyVideo, uploadToBunny } from '../../utils/admin/bunnyStreamAPI';
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
        // Créer la vidéo dans Bunny
        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: 'uploading' } : u))
        );

        const { guid } = await createBunnyVideo(fileName);

        // Upload le fichier
        await uploadToBunny(guid, file, (progress) => {
          setUploads((prev) =>
            prev.map((u) => (u.id === id ? { ...u, progress } : u))
          );
        });

        // Marquer comme prêt
        setUploads((prev) =>
          prev.map((u) =>
            u.id === id
              ? { ...u, status: 'ready', progress: 100, videoId: guid }
              : u
          )
        );

        toast.success(`Vidéo "${fileName}" uploadée avec succès`);
        onComplete?.(guid);

        // Retirer de la liste après 3 secondes
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.id !== id));
        }, 3000);
      } catch (error: any) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  status: 'error',
                  error: error.message || 'Erreur lors de l\'upload',
                }
              : u
          )
        );
        toast.error(`Erreur upload "${fileName}": ${error.message}`);
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

