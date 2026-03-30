import { useState, useCallback } from 'react';

const LOGO_KEY = 'tanmyaaCustomLogo';
const COLORS_KEY = 'tanmyaaCustomColors';
const PRESENTATION_TEMPLATE_KEY = 'tanmyaaCustomPresentationTemplate';
const PRESENTATION_TEMPLATE_URL_KEY = 'tanmyaaCustomPresentationTemplateUrl';
const REPORT_TEMPLATE_KEY = 'tanmyaaCustomReportTemplate';
const REPORT_TEMPLATE_URL_KEY = 'tanmyaaCustomReportTemplateUrl';

export const useBranding = () => {
  const [logo, setLogo] = useState<string | null>(() => localStorage.getItem(LOGO_KEY));
  const [colors, setColors] = useState<string | null>(() => localStorage.getItem(COLORS_KEY));
  const [presentationTemplate, setPresentationTemplate] = useState<string | null>(() => localStorage.getItem(PRESENTATION_TEMPLATE_KEY));
  const [presentationTemplateUrl, setPresentationTemplateUrl] = useState<string | null>(() => localStorage.getItem(PRESENTATION_TEMPLATE_URL_KEY));
  const [reportTemplate, setReportTemplate] = useState<string | null>(() => localStorage.getItem(REPORT_TEMPLATE_KEY));
  const [reportTemplateUrl, setReportTemplateUrl] = useState<string | null>(() => localStorage.getItem(REPORT_TEMPLATE_URL_KEY));

  const saveLogo = useCallback((logoBase64: string) => {
    localStorage.setItem(LOGO_KEY, logoBase64);
    setLogo(logoBase64);
  }, []);

  const saveColors = useCallback((colorsText: string) => {
    localStorage.setItem(COLORS_KEY, colorsText);
    setColors(colorsText);
  }, []);

  const savePresentationTemplate = useCallback((templateText: string) => {
    localStorage.setItem(PRESENTATION_TEMPLATE_KEY, templateText);
    setPresentationTemplate(templateText);
  }, []);

  const savePresentationTemplateUrl = useCallback((url: string) => {
    localStorage.setItem(PRESENTATION_TEMPLATE_URL_KEY, url);
    setPresentationTemplateUrl(url);
  }, []);

  const saveReportTemplate = useCallback((templateText: string) => {
    localStorage.setItem(REPORT_TEMPLATE_KEY, templateText);
    setReportTemplate(templateText);
  }, []);

  const saveReportTemplateUrl = useCallback((url: string) => {
    localStorage.setItem(REPORT_TEMPLATE_URL_KEY, url);
    setReportTemplateUrl(url);
  }, []);

  const removeLogo = useCallback(() => {
    localStorage.removeItem(LOGO_KEY);
    setLogo(null);
  }, []);

  const removeColors = useCallback(() => {
    localStorage.removeItem(COLORS_KEY);
    setColors(null);
  }, []);

  const removePresentationTemplate = useCallback(() => {
    localStorage.removeItem(PRESENTATION_TEMPLATE_KEY);
    setPresentationTemplate(null);
  }, []);

  const removePresentationTemplateUrl = useCallback(() => {
    localStorage.removeItem(PRESENTATION_TEMPLATE_URL_KEY);
    setPresentationTemplateUrl(null);
  }, []);

  const removeReportTemplate = useCallback(() => {
    localStorage.removeItem(REPORT_TEMPLATE_KEY);
    setReportTemplate(null);
  }, []);

  const removeReportTemplateUrl = useCallback(() => {
    localStorage.removeItem(REPORT_TEMPLATE_URL_KEY);
    setReportTemplateUrl(null);
  }, []);

  return { 
    logo, saveLogo, removeLogo, 
    colors, saveColors, removeColors,
    presentationTemplate, savePresentationTemplate, removePresentationTemplate,
    presentationTemplateUrl, savePresentationTemplateUrl, removePresentationTemplateUrl,
    reportTemplate, saveReportTemplate, removeReportTemplate,
    reportTemplateUrl, saveReportTemplateUrl, removeReportTemplateUrl,
    isLoaded: true 
  };
};
