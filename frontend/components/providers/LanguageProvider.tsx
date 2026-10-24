'use client'

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type { Lang } from '@/components/landing/copy'

interface LanguageContextType {
  lang: Lang
  setLang: (lang: Lang) => void
}

const STORAGE_KEY = 'zaizub_lang'

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
})

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener('zaizub_lang_change', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('zaizub_lang_change', callback)
  }
}

export function LanguageProvider({
  children,
  initialLang = 'en',
}: {
  children: ReactNode
  initialLang?: Lang
}) {
  const getSnapshot = useCallback((): Lang => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'en' || saved === 'th') {
        return saved
      }
    } catch {
      // In case localStorage is disabled or restricted
    }
    return initialLang
  }, [initialLang])

  const getServerSnapshot = useCallback((): Lang => {
    return initialLang
  }, [initialLang])

  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Ensure cookie is synced with localStorage on mount to prevent any server-render flash on reload
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'en' || saved === 'th') {
        document.cookie = `${STORAGE_KEY}=${saved}; path=/; max-age=31536000; SameSite=Lax`
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  const setLang = useCallback((newLang: Lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, newLang)
      document.cookie = `${STORAGE_KEY}=${newLang}; path=/; max-age=31536000; SameSite=Lax`
      window.dispatchEvent(new Event('zaizub_lang_change'))
    } catch {
      // Fallback
    }
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
