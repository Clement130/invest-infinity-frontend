import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

interface ChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
}

export default function ChatWidget({ isOpen, onToggle, unreadCount = 0 }: ChatWidgetProps) {
  return (
    <motion.button
      onClick={onToggle}
      className="
        relative z-50
        w-14 h-14 rounded-full
        bg-gradient-to-r from-pink-500 to-violet-500
        text-white shadow-lg shadow-pink-500/30
        flex items-center justify-center
        hover:shadow-xl hover:shadow-pink-500/40
        transition-shadow duration-300
      "
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <X size={24} />
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <MessageCircle size={24} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge de notification */}
      {!isOpen && unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="
            absolute -top-1 -right-1
            w-5 h-5 rounded-full
            bg-red-500 text-white text-xs font-bold
            flex items-center justify-center
            border-2 border-[#0f0f13]
          "
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </motion.span>
      )}

      {/* Pulse animation quand fermé */}
      {!isOpen && (
        <span className="absolute inset-0 rounded-full bg-pink-500 animate-ping opacity-20" />
      )}
    </motion.button>
  );
}

