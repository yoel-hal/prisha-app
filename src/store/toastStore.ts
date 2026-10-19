import { create } from 'zustand';

export type ToastVariant = 'info' | 'success';

interface ToastState {
  message: string | null;
  variant: ToastVariant;
  showToast: (message: string, variant?: ToastVariant) => void;
  clearToast: () => void;
}

let hideTimeout: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  variant: 'info',
  showToast: (message, variant = 'info') => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    set({ message, variant });
    hideTimeout = setTimeout(() => {
      set({ message: null });
      hideTimeout = null;
    }, 4000);
  },
  clearToast: () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    set({ message: null });
  },
}));
