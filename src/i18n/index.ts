import { useCallback } from 'react'
import { useApp } from '../core/store'
import type { Lang } from '../core/types'
import { ca } from './ca'
import { en } from './en'
import { es } from './es'

export type Dict = typeof ca
export type TKey = keyof Dict
export type T = (key: TKey, params?: Record<string, string | number>) => string

const DICTS: Record<Lang, Dict> = { ca, es, en }

export function translate(lang: Lang, key: TKey, params?: Record<string, string | number>): string {
  const text = DICTS[lang][key] ?? ca[key] ?? key
  return params ? text.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`)) : text
}

export function useT(): { t: T; lang: Lang } {
  const lang = useApp((s) => s.lang)
  const t = useCallback<T>((key, params) => translate(lang, key, params), [lang])
  return { t, lang }
}

export const LANG_NAMES: Record<Lang, string> = { ca: 'Català', es: 'Castellano', en: 'English' }
