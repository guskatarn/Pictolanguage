import { useMemo } from 'react'
import { UserProfile, PictogramItem, Category } from '../types'
import { DEFAULT_PICTOGRAMS, getArasaacImageUrl } from '../data/defaultPictograms'
import { DEFAULT_CATEGORIES } from '../data/defaultCategories'

export function usePictograms(activeProfile: UserProfile | null) {
  const categories: Category[] = useMemo(() => {
    if (!activeProfile) return DEFAULT_CATEGORIES
    const order = activeProfile.categoryOrder
    return [...DEFAULT_CATEGORIES].sort(
      (a, b) => order.indexOf(a.id) - order.indexOf(b.id),
    )
  }, [activeProfile])

  const getPictogramsForCategory = useMemo(() => {
    return (categoryId: string): PictogramItem[] => {
      const category = DEFAULT_CATEGORIES.find((c) => c.id === categoryId)
      if (!category) return []

      const defaultItems: PictogramItem[] = DEFAULT_PICTOGRAMS.filter(
        (p) => p.categoryId === categoryId,
      )
        .filter((p) => !activeProfile?.hidden.includes(p.id))
        .map((p) => ({
          key: `${categoryId}-${p.id}`,
          word: p.word,
          arasaacId: p.id,
          imageUrl: getArasaacImageUrl(p.id),
          isCustom: false,
        }))

      const customItems: PictogramItem[] =
        activeProfile?.customPictograms
          .filter(
            (c) =>
              c.categoryId === categoryId &&
              !activeProfile.hiddenCustom.includes(c.id),
          )
          .map((c) => ({
            key: `custom-${c.id}`,
            word: c.word,
            imageUrl: c.imageUrl,
            isCustom: true,
            customId: c.id,
          })) ?? []

      return [...defaultItems, ...customItems]
    }
  }, [activeProfile])

  const searchArasaac = async (keyword: string): Promise<PictogramItem[]> => {
    try {
      const res = await fetch(
        `https://api.arasaac.org/v1/pictograms/fr/search/${encodeURIComponent(keyword)}`,
      )
      if (!res.ok) return []
      const results = await res.json()
      return (results as { _id: number; keywords: { keyword: string }[] }[])
        .slice(0, 20)
        .map((r) => ({
          key: `search-${r._id}`,
          word: r.keywords?.[0]?.keyword ?? String(r._id),
          arasaacId: r._id,
          imageUrl: getArasaacImageUrl(r._id),
          isCustom: false,
        }))
    } catch {
      return []
    }
  }

  return { categories, getPictogramsForCategory, searchArasaac }
}
