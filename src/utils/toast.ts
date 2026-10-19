import { useToastStore, type ToastVariant } from '../store/toastStore';

export function showToast(message: string, variant?: ToastVariant): void {
  useToastStore.getState().showToast(message, variant);
}
