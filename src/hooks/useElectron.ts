import { useState } from 'react';

// Web-only version - no Electron support
export const useElectron = () => {
  return {
    isElectronApp: false,
    electronAPI: null
  };
};
