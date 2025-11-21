import { useState, useRef } from 'react';
import { Upload, X, FileVideo, Loader2 } from 'lucide-react';
import { uploadBunnyVideo } from '../../services/bunnyStreamService';
import toast from 'react-hot-toast';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (videoId: string, title: string) => void;
}

export default function VideoUploadModal({
  isOpen,
  onClose,
  onUploadComplete,
}: VideoUploadModalProps) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier le type de fichier
      if (!selectedFile.type.startsWith('video/')) {
        toast.error('Veuillez sélectionner un fichier vidéo');
        return;
      }
      // Vérifier la taille (max 2GB)
      if (selectedFile.size > 2 * 1024 * 1024 * 1024) {
        toast.error('Le fichier est trop volumineux (max 2GB)');
        return;
      }
      setFile(selectedFile);
      if (!title) {
        // Suggérer un titre basé sur le nom du fichier
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast.error('Veuillez sélectionner un fichier et entrer un titre');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadBunnyVideo(title, file, (progress) => {
        setUploadProgress(progress);
      });

      toast.success('Vidéo uploadée avec succès !');
      onUploadComplete(result.videoId, result.title);
      
      // Réinitialiser le formulaire
      setTitle('');
      setFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de l\'upload'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-white/10 p-6 max-w-2xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Uploader une vidéo</h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 hover:bg-white/10 rounded-lg transition disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Titre de la vidéo *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
              placeholder="Ex: Introduction au trading"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Fichier vidéo *
            </label>
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                isUploading
                  ? 'border-gray-600 bg-gray-900/50 cursor-not-allowed'
                  : 'border-white/20 bg-white/5 hover:border-purple-500/50 hover:bg-purple-500/10'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
              {file ? (
                <div className="space-y-2">
                  <FileVideo className="w-12 h-12 mx-auto text-purple-400" />
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-sm text-gray-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-white">Cliquez pour sélectionner un fichier</p>
                  <p className="text-sm text-gray-400">
                    Formats supportés: MP4, MOV, AVI, etc. (max 2GB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Upload en cours...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={handleUpload}
              disabled={!file || !title.trim() || isUploading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Uploader
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

