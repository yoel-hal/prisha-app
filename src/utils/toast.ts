import { useToastStore } from '../store/toastStore';

export function showToast(message: string): void {
  useToastStore.getState().showToast(message);
}
