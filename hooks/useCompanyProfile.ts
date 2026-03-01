import { useState, useCallback } from 'react';

const LOCAL_STORAGE_KEY = 'tanmyaaCompanyProfile';

export const useCompanyProfile = () => {
  const [companyProfile, setCompanyProfile] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to read company profile from localStorage", e);
      return null;
    }
  });


  const saveProfile = useCallback((profileText: string) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, profileText);
      setCompanyProfile(profileText);
    } catch (e) {
      console.error("Failed to save company profile to localStorage", e);
    }
  }, []);

  const removeProfile = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setCompanyProfile(null);
    } catch (e) {
      console.error("Failed to remove company profile from localStorage", e);
    }
  }, []);

  return { companyProfile, saveProfile, removeProfile };
};
