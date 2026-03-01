import { useState, useCallback } from 'react';

const LOCAL_STORAGE_KEY = 'tanmyaaCustomLogo';

export const useBranding = () => {
  const [logo, setLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to read custom logo from localStorage", e);
      return null;
    }
  });


  const saveLogo = useCallback((logoBase64: string) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, logoBase64);
      setLogo(logoBase64);
    } catch (e) {
      console.error("Failed to save custom logo to localStorage", e);
    }
  }, []);

  const removeLogo = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setLogo(null);
    } catch (e) {
      console.error("Failed to remove custom logo from localStorage", e);
    }
  }, []);

  return { logo, saveLogo, removeLogo, isLoaded: true };
};
