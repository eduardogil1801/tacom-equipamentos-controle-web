import { useEffect, useState } from 'react';

const isElectron = typeof window !== 'undefined' && window.electronAPI;

export const useElectron = () => {
  const [isElectronApp, setIsElectronApp] = useState(false);

  useEffect(() => {
    setIsElectronApp(!!isElectron);
  }, []);

  return {
    isElectronApp,
    electronAPI: isElectron ? (window as any).electronAPI : null
  };
};
