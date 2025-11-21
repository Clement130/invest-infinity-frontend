import { useCallback, useState } from 'react';
import { Upload, FileVideo, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useBunnyUpload, type UploadProgress } from '../../../hooks/admin/useBunnyUpload';
import toast from 'react-hot-toast';

interface BunnyUploadZoneProps {
  onUploadComplete?: (videoId: string, fileName: string) => void;
  multiple?: boolean;
}

export function BunnyUploadZone({ onUploadComplete, multiple = false }: BunnyUploadZoneProps) {
  const { uploads, uploadVideo, removeUpload } = useBunnyUpload();
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('video/')
      );

      if (files.length === 0) {
        toast.error('Veuillez déposer des fichiers vidéo (MP4, MOV, AVI, etc.)');
        return;
      }

      for (const file of files) {
        await uploadVideo(file, (videoId) => {
          onUploadComplete?.(videoId, file.name);
        });
      }
    },
    [uploadVideo, onUploadComplete]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((file) =>
        file.type.startsWith('video/')
      );

      if (files.length === 0) return;

      for (const file of files) {
        await uploadVideo(file, (videoId) => {
          onUploadComplete?.(videoId, file.name);
        });
      }

      // Reset input
      e.target.value = '';
    },
    [uploadVideo, onUploadComplete]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition ${
          isDragging
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-white/20 bg-white/5 hover:border-white/30'
        }`}
      >
        <input
          type="file"
          accept="video/*"
          multiple={multiple}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="space-y-3">
          <Upload className="w-12 h-12 mx-auto text-purple-400" />
          <div>
            <p className="text-lg font-semibold text-white mb-1">
              Glissez-déposez vos fichiers ici
            </p>
            <p className="text-sm text-gray-400">
              ou cliquez pour sélectionner
            </p>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>✅ Formats : MP4, MOV, AVI, MKV</p>
            <p>📦 Taille max : 5 GB par fichier</p>
          </div>
        </div>
      </div>

      {/* Liste des uploads en cours */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white">Uploads en cours</h3>
          {uploads.map((upload) => (
            <UploadProgressItem
              key={upload.id}
              upload={upload}
              onRemove={() => removeUpload(upload.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface UploadProgressItemProps {
  upload: UploadProgress;
  onRemove: () => void;
}

function UploadProgressItem({ upload, onRemove }: UploadProgressItemProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileVideo className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span className="text-sm font-medium text-white truncate">{upload.fileName}</span>
          {upload.status === 'ready' && (
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
          )}
          {upload.status === 'error' && (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          )}
        </div>
        <button
          onClick={onRemove}
          className="p-1 rounded hover:bg-white/10 transition flex-shrink-0"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {upload.status === 'uploading' && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Progression</span>
            <span>{upload.progress}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${upload.progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            ⚙️ Encodage Bunny prévu : ~3 min
          </p>
        </div>
      )}

      {upload.status === 'ready' && upload.videoId && (
        <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-xs">
          <p className="text-green-300">✅ Upload terminé</p>
          <code className="text-green-200 font-mono">{upload.videoId}</code>
        </div>
      )}

      {upload.status === 'error' && upload.error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
          ❌ {upload.error}
        </div>
      )}
    </div>
  );
}

