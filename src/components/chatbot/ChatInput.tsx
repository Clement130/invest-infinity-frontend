import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types pour les attachements
export interface Attachment {
  file: File;
  preview?: string;
  type: 'image' | 'file';
}

interface ChatInputProps {
  onSend: (message: string, attachments?: Attachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
  allowAttachments?: boolean;
  maxAttachments?: number;
  maxFileSize?: number; // en MB
}

export default function ChatInput({ 
  onSend, 
  disabled, 
  placeholder = "Écris ton message...",
  allowAttachments = true,
  maxAttachments = 3,
  maxFileSize = 5, // 5MB par défaut
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || attachments.length > 0) && !disabled) {
      onSend(message.trim(), attachments.length > 0 ? attachments : undefined);
      setMessage('');
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setAttachmentError(null);

    // Vérifier le nombre max
    if (attachments.length + files.length > maxAttachments) {
      setAttachmentError(`Maximum ${maxAttachments} fichiers autorisés`);
      return;
    }

    const newAttachments: Attachment[] = [];

    Array.from(files).forEach(file => {
      // Vérifier la taille
      if (file.size > maxFileSize * 1024 * 1024) {
        setAttachmentError(`Fichier trop volumineux (max ${maxFileSize}MB)`);
        return;
      }

      const isImage = file.type.startsWith('image/');
      const attachment: Attachment = {
        file,
        type: isImage ? 'image' : 'file',
      };

      // Créer un aperçu pour les images
      if (isImage) {
        attachment.preview = URL.createObjectURL(file);
      }

      newAttachments.push(attachment);
    });

    setAttachments(prev => [...prev, ...newAttachments]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      // Libérer l'URL de l'aperçu
      if (newAttachments[index].preview) {
        URL.revokeObjectURL(newAttachments[index].preview!);
      }
      newAttachments.splice(index, 1);
      return newAttachments;
    });
    setAttachmentError(null);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      attachments.forEach(att => {
        if (att.preview) URL.revokeObjectURL(att.preview);
      });
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className="relative">
      {/* Aperçu des attachements */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 pt-2 pb-1 bg-[#1a1a1f] border-t border-pink-500/10 overflow-hidden"
          >
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="relative group"
                >
                  {att.type === 'image' && att.preview ? (
                    <img
                      src={att.preview}
                      alt={att.file.name}
                      className="w-16 h-16 object-cover rounded-lg border border-pink-500/20"
                    />
                  ) : (
                    <div className="w-16 h-16 flex flex-col items-center justify-center bg-[#2a2a30] rounded-lg border border-pink-500/20">
                      <FileText size={20} className="text-pink-400" />
                      <span className="text-[8px] text-gray-400 mt-1 max-w-full truncate px-1">
                        {att.file.name.slice(0, 10)}...
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message d'erreur */}
      <AnimatePresence>
        {attachmentError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 py-1 bg-red-500/10 border-t border-red-500/20"
          >
            <p className="text-xs text-red-400">{attachmentError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2 p-3 bg-[#1a1a1f] border-t border-pink-500/10">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="
              w-full px-4 py-2.5 pr-20
              bg-[#2a2a30] border border-pink-500/10
              rounded-xl text-sm text-white
              placeholder:text-gray-500
              focus:outline-none focus:border-pink-500/30
              resize-none overflow-hidden
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          />
          <div className="absolute right-3 bottom-2.5 flex items-center gap-1">
            {allowAttachments && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || attachments.length >= maxAttachments}
                  className="text-gray-500 hover:text-pink-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-1"
                  title="Joindre un fichier"
                >
                  <Paperclip size={16} />
                </button>
              </>
            )}
            <button
              type="button"
              className="text-gray-500 hover:text-pink-400 transition-colors p-1"
              title="Emojis (bientôt disponible)"
            >
              <Smile size={16} />
            </button>
          </div>
        </div>
        
        <motion.button
          type="submit"
          disabled={(!message.trim() && attachments.length === 0) || disabled}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="
            p-2.5 rounded-xl
            bg-gradient-to-r from-pink-500 to-violet-500
            text-white
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:shadow-lg hover:shadow-pink-500/25
            transition-all duration-200
          "
        >
          <Send size={18} />
        </motion.button>
      </div>
    </form>
  );
}

