export {};

declare global {
  interface Window {
    electronAPI?: {
      closeWindow: () => void;
    };
  }
}
