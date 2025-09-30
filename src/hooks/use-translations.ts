"use client";

import { useState, useEffect, useCallback } from 'react';

// Suposem que només tenim 'ca' i 'es', amb 'es' per defecte.
type Locale = 'ca' | 'es';
type TranslationKeys = 
  | 'Common' 
  | 'Dashboard' 
  | 'Actions' 
  | 'Reports' 
  | 'MyGroups' 
  | 'Settings' 
  | 'AiSettings' 
  | 'UserManagement' 
  | 'GroupManagement'
  | 'FirestoreRules'
  | 'Roadmap'
  | 'Backlog';

type Translations = { [key: string]: any };

const translationsCache: { [key in Locale]?: { [key in TranslationKeys]?: any } } = {};

async function loadComponentTranslations(locale: Locale, componentKey: TranslationKeys): Promise<any> {
    const componentKeyLower = componentKey.toLowerCase().replace(/\s+/g, '-');
    
    if (translationsCache[locale] && translationsCache[locale]![componentKey]) {
        return translationsCache[locale]![componentKey];
    }

    try {
        const module = await import(`@/messages/${locale}/${componentKeyLower}.json`);
        const translations = module.default[componentKey];
        
        if (!translationsCache[locale]) {
            translationsCache[locale] = {};
        }
        translationsCache[locale]![componentKey] = translations;
        
        return translations;
    } catch (error) {
        console.error(`Could not load translations for component: ${componentKey} in locale ${locale}`, error);
        return {};
    }
}

export function useTranslations(componentKey: TranslationKeys) {
  const [translations, setTranslations] = useState<any>(null);
  const [locale] = useState<Locale>('es'); 

  useEffect(() => {
    let isMounted = true;
    async function fetchTranslations() {
      const componentTranslations = await loadComponentTranslations(locale, componentKey);
      if (isMounted) {
        setTranslations(componentTranslations);
      }
    }
    fetchTranslations();
    return () => { isMounted = false; };
  }, [locale, componentKey]);

  const t = useCallback((key: string): string => {
    if (!translations) {
      return key;
    }
    
    // Nested key, e.g., t('col.name')
    const value = key.split('.').reduce((obj, k) => (obj && obj[k] !== undefined) ? obj[k] : undefined, translations);

    return value !== undefined ? String(value) : key;
  }, [translations]);

  return t;
}
