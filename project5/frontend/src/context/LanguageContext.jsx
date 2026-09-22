/**
 * LanguageContext — Global language state persisted in localStorage.
 * All pages/components consume this context instead of managing isolated lang state.
 */
import React, { createContext, useContext, useState } from 'react';
import { getSavedLanguage, setSavedLanguage } from '../utils/i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getSavedLanguage());

  const setLang = (code) => {
    setSavedLanguage(code);
    setLangState(code);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
