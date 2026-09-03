import { useMemo } from 'react'
import { UserProfile, PictogramItem, Category } from '../types'
import { DEFAULT_PICTOGRAMS, getArasaacImageUrl } from '../data/defaultPictograms'
import { DEFAULT_CATEGORIES, FAVORITES_CATEGORY } from '../data/defaultCategories'

export function usePictograms(activeProfile: UserProfile | null) {
  const categories: Category[] = useMemo(() => {
    // Une catégorie absente de l'ordre du profil (ajoutée par une mise à jour
    // postérieure à la création du profil) est placée à la fin. Se fier au -1
    // d'`indexOf` la ferait au contraire surgir en première position, devant
    // l'ordre choisi par le parent, et décalerait tous les repères de l'enfant.
    const rank = (id: string) => {
      const index = activeProfile?.categoryOrder.indexOf(id) ?? -1
      return index === -1 ? Number.MAX_SAFE_INTEGER : index
    }
    const ordered = activeProfile
      ? [...DEFAULT_CATEGORIES].sort((a, b) => rank(a.id) - rank(b.id))
      : DEFAULT_CATEGORIES
    // Les favoris restent en tête et hors de l'ordre personnalisable : leur
    // position ne doit jamais bouger, y compris quand le parent réordonne.
    return [FAVORITES_CATEGORY, ...ordered]
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
          isFavorite: activeProfile?.favorites.includes(p.id) ?? false,
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
            isFavorite: activeProfile.favoritesCustom.includes(c.id),
          })) ?? []

      return [...defaultItems, ...customItems]
    }
  }, [activeProfile])

  /**
   * Contenu de l'onglet « Favoris ».
   *
   * L'ordre suit celui dans lequel les favoris ont été ajoutés, pour que la
   * position d'un pictogramme reste prévisible d'une session à l'autre. Les
   * pictogrammes masqués en sont exclus : un pictogramme écarté par le parent
   * ne doit réapparaître nulle part.
   *
   * Compromis assumé : les favoris personnalisés viennent après ceux du
   * vocabulaire par défaut, si bien qu'ajouter un favori par défaut décale les
   * premiers d'un cran. Le mémoriser dans une seule liste ordonnée éviterait ce
   * décalage, au prix d'un changement de format des données déjà stockées.
   */
  const getFavoritePictograms = useMemo(() => {
    return (): PictogramItem[] => {
      if (!activeProfile) return []

      const defaults: PictogramItem[] = activeProfile.favorites
        .filter((id) => !activeProfile.hidden.includes(id))
        .map((id) => DEFAULT_PICTOGRAMS.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => p !== undefined)
        .map((p) => ({
          key: `favori-${p.id}`,
          word: p.word,
          arasaacId: p.id,
          imageUrl: getArasaacImageUrl(p.id),
          isCustom: false,
          isFavorite: true,
        }))

      const customs: PictogramItem[] = activeProfile.favoritesCustom
        .filter((id) => !activeProfile.hiddenCustom.includes(id))
        .map((id) => activeProfile.customPictograms.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => c !== undefined)
        .map((c) => ({
          key: `favori-custom-${c.id}`,
          word: c.word,
          imageUrl: c.imageUrl,
          isCustom: true,
          customId: c.id,
          isFavorite: true,
        }))

      return [...defaults, ...customs]
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
          isFavorite: false,
        }))
    } catch {
      return []
    }
  }

  return { categories, getPictogramsForCategory, getFavoritePictograms, searchArasaac }
}
