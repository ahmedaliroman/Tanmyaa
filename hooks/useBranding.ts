import { useState, useCallback } from 'react';

const LOGO_KEY = 'tanmyaaCustomLogo';
const COLORS_KEY = 'tanmyaaCustomColors';
const TEMPLATE_KEY = 'tanmyaaCustomTemplate';

export const useBranding = () => {
  const [logo, setLogo] = useState<string | null>(() => localStorage.getItem(LOGO_KEY));
  const [colors, setColors] = useState<string | null>(() => localStorage.getItem(COLORS_KEY));
  const [template, setTemplate] = useState<string | null>(() => localStorage.getItem(TEMPLATE_KEY));

  const saveLogo = useCallback((logoBase64: string) => {
    localStorage.setItem(LOGO_KEY, logoBase64);
    setLogo(logoBase64);
  }, []);

  const saveColors = useCallback((colorsText: string) => {
    localStorage.setItem(COLORS_KEY, colorsText);
    setColors(colorsText);
  }, []);

  const saveTemplate = useCallback((templateText: string) => {
    localStorage.setItem(TEMPLATE_KEY, templateText);
    setTemplate(templateText);
  }, []);

  const removeLogo = useCallback(() => {
    localStorage.removeItem(LOGO_KEY);
    setLogo(null);
  }, []);

  const removeColors = useCallback(() => {
    localStorage.removeItem(COLORS_KEY);
    setColors(null);
  }, []);

  const removeTemplate = useCallback(() => {
    localStorage.removeItem(TEMPLATE_KEY);
    setTemplate(null);
  }, []);

  return { 
    logo, saveLogo, removeLogo, 
    colors, saveColors, removeColors,
    template, saveTemplate, removeTemplate,
    isLoaded: true 
  };
};
