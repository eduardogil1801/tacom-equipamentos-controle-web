import { useEffect, useState } from 'react';

// Type definition for electron API
declare global {
  interface Window {
    electronAPI?: any;
  }
}

const isElectron = typeof window !== 'undefined' && window.electronAPI;

export const useElectron = () => {
  const [isElectronApp, setIsElectronApp] = useState(false);

  useEffect(() => {
    setIsElectronApp(!!isElectron);
  }, []);

  return {
    isElectronApp: false, // Disabled for web deployment
    electronAPI: null
  };
};
