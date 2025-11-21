/**
 * Hook personnalisé pour les notifications toast
 * 
 * Fournit une API simple et cohérente pour afficher des notifications
 * avec des styles personnalisés adaptés au thème de l'application.
 */
import toast from 'react-hot-toast';

export function useToast() {
  return {
    success: (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
      return toast.success(message, {
        duration: options?.duration ?? 4000,
        ...(options?.action && {
          action: {
            label: options.action.label,
            onClick: options.action.onClick,
          },
        }),
      });
    },
    error: (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
      return toast.error(message, {
        duration: options?.duration ?? 5000,
        ...(options?.action && {
          action: {
            label: options.action.label,
            onClick: options.action.onClick,
          },
        }),
      });
    },
    warning: (message: string, options?: { duration?: number }) => {
      return toast(message, {
        icon: '⚠️',
        duration: options?.duration ?? 4000,
      });
    },
    info: (message: string, options?: { duration?: number }) => {
      return toast(message, {
        icon: 'ℹ️',
        duration: options?.duration ?? 4000,
      });
    },
    loading: (message: string) => {
      return toast.loading(message);
    },
    promise: <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: any) => string);
      },
    ) => {
      return toast.promise(promise, messages);
    },
    dismiss: (toastId?: string) => {
      toast.dismiss(toastId);
    },
  };
}

