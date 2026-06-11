import { create } from 'zustand';

interface ToastState {
  message: string | null;
  showToast: (message: string) => void;
  clearToast: () => void;
}

let hideTimeout: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  showToast: (message) => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    set({ message });
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
