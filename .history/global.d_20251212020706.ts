export {};

declare global {
  interface Window {
    electronAPI: {
      doSomething: () => void;
      exitApp: () => void;
      // add all functions exposed via preload here
    };
  }
}
