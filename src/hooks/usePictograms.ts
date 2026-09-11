import { useMemo } from 'react'
import { UserProfile, PictogramItem, Category, Page, CaseGrille } from '../types'
import { getArasaacImageUrl } from '../utils/arasaac'
import { TABLEAU_TLA, trouverPage } from '../data/tableauTla'
import {
  ACCUEIL_CATEGORY,
  DEFAULT_CATEGORIES,
  FAVORITES_CATEGORY,
} from '../data/defaultCategories'
import { lireRefSlot, refSlot } from '../utils/pages'
import { motDeLaCase, MotPose } from '../utils/vocabulaire'

/**
 * Pour comparer « fatigue » et « fatigué », ou « Ecole » et « école » : un
 * adulte qui cherche vite ne met pas les accents, et une recherche qui n'y
 * répond pas donne l'impression que le mot n'existe pas.
 */
function sansAccents(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

function versItem(
  page: Page,
  index: number,
  { entree, isCustom }: MotPose,
  profile: UserProfile | null,
  cle: string,
): PictogramItem {
  const ref = refSlot(page.id, index)
  return {
    key: cle,
    word: entree.mot,
    lexiqueId: entree.id,
    arasaacId: entree.arasaacId,
    // Image stockée pour un mot ajouté par le parent, banque ARASAAC sinon.
    // Un mot sans l'une ni l'autre n'existe pas : `EntreeLexique` en porte
    // toujours au moins une, et le test d'intégrité du lexique le garantit.
    imageUrl:
      entree.imageUrl ??
      (entree.arasaacId !== undefined ? getArasaacImageUrl(entree.arasaacId) : ''),
    isCustom,
    customId: isCustom ? entree.id : undefined,
    isFavorite: profile?.pageFavoris.includes(ref) ?? false,
    // Le thème du mot, pas celui de la page : « manger » garde sa couleur des
    // Besoins jusque sur l'accueil. La page ne sert qu'aux mots du parent, qui
    // n'ont pas de thème à eux.
    categoryId: entree.theme ?? page.theme,
    classeGrammaticale: entree.classeGrammaticale,
    refSlot: ref,
    isHidden: profile?.slotsMasques.includes(ref) ?? false,
  }
}

export function usePictograms(activeProfile: UserProfile | null) {
  /** Pages thématiques, dans l'ordre choisi par le parent. */
  const themes: Category[] = useMemo(() => {
    // Une page absente de l'ordre du profil (ajoutée par une mise à jour
    // postérieure à la création du profil) est placée à la fin. Se fier au -1
    // d'`indexOf` la ferait au contraire surgir en première position, devant
    // l'ordre choisi par le parent, et décalerait tous les repères de l'enfant.
    const rank = (id: string) => {
      const index = activeProfile?.ordrePages.indexOf(id) ?? -1
      return index === -1 ? Number.MAX_SAFE_INTEGER : index
    }
    return activeProfile
      ? [...DEFAULT_CATEGORIES].sort((a, b) => rank(a.id) - rank(b.id))
      : DEFAULT_CATEGORIES
  }, [activeProfile])

  /** Pages de rangement : destinations possibles d'un mot ajouté par le parent. */
  const categories: Category[] = useMemo(() => [ACCUEIL_CATEGORY, ...themes], [themes])

  /**
   * Onglets affichés au-dessus de la grille.
   *
   * Distinct de `categories` à dessein : « Favoris » est une **vue**, pas une
   * page de rangement. Les confondre revenait à proposer « Favoris » comme
   * destination lors de l'ajout d'un pictogramme, qui atterrissait alors dans
   * une page inexistante et n'apparaissait plus nulle part.
   *
   * Accueil puis favoris restent en tête et hors de l'ordre personnalisable :
   * leur position ne doit jamais bouger, y compris quand le parent réordonne.
   */
  const tabs: Category[] = useMemo(
    () => [ACCUEIL_CATEGORY, FAVORITES_CATEGORY, ...themes],
    [themes],
  )

  /**
   * Contenu d'une page, **case par case** : le tableau renvoyé a exactement la
   * longueur de la géométrie, et `null` marque une case vide.
   *
   * C'est la forme dont la grille a besoin pour tenir sa promesse : une case
   * vide occupe la place, elle ne la libère pas. Filtrer les vides ici — ou
   * les omettre, comme le faisait l'adaptateur — laisserait la grille refermer
   * le trou et déplacerait tout ce qui suit.
   */
  const casesDeLaPage = useMemo(() => {
    return (pageId: string): (CaseGrille | null)[] => {
      const page = trouverPage(pageId)
      if (!page) return []

      return page.slots.map((slot, index): CaseGrille | null => {
        switch (slot?.type) {
          case 'navigation':
            return { ...slot, key: `${page.id}-${index}` }
          // Aucune case de commande n'est encore posée dans le tableau ; leur
          // rendu arrivera avec elles. D'ici là, la place reste vide.
          case 'commande':
            return null
          default: {
            // Case de vocabulaire, ou case libre qui porte peut-être un mot
            // ajouté par le parent.
            const mot = motDeLaCase(page, index, activeProfile)
            return mot
              ? { type: 'mot', picto: versItem(page, index, mot, activeProfile, `${page.id}-${index}`) }
              : null
          }
        }
      })
    }
  }, [activeProfile])

  /**
   * Contenu de l'onglet « Favoris », lui aussi case par case.
   *
   * Les favoris forment une page comme les autres : creuse, de longueur fixe,
   * où retirer un favori laisse un trou. C'est un changement par rapport à
   * l'ancienne vue compacte, et il est voulu — un favori qu'on retire ne doit
   * pas faire glisser d'un cran tous ceux que l'enfant avait appris à trouver
   * après lui.
   *
   * Les cases masquées en sont exclues : un mot écarté par le parent ne doit
   * réapparaître nulle part.
   */
  const casesFavorites = useMemo(() => {
    return (): (CaseGrille | null)[] => {
      if (!activeProfile) return []

      return activeProfile.pageFavoris.map((ref): CaseGrille | null => {
        if (!ref || activeProfile.slotsMasques.includes(ref)) return null
        const adresse = lireRefSlot(ref)
        const page = adresse ? trouverPage(adresse.pageId) : undefined
        if (!page || !adresse) return null
        const mot = motDeLaCase(page, adresse.index, activeProfile)
        if (!mot) return null
        // La couleur suit le pictogramme jusque dans les favoris : sans cela,
        // l'onglet repeignait toute la grille en jaune.
        return { type: 'mot', picto: versItem(page, adresse.index, mot, activeProfile, `favori-${ref}`) }
      })
    }
  }, [activeProfile])

  /**
   * Recherche dans le vocabulaire **déjà présent** sur l'appareil, pages et
   * mots personnalisés confondus.
   *
   * Distincte de `searchArasaac`, qui interroge la banque en ligne pour en
   * ajouter de nouveaux : ici on retrouve un mot que l'enfant possède déjà mais
   * dont l'adulte ne sait plus sur quelle page il est rangé — le cas courant en
   * pleine composition de phrase, quand chercher au bon endroit prend plus de
   * temps que l'enfant n'en accorde.
   *
   * Les cases masquées en sont exclues : un mot écarté par le parent ne doit
   * ressurgir par aucun chemin.
   *
   * Un mot posé sur plusieurs pages (« manger » sur l'accueil et dans les
   * Besoins) n'est proposé qu'une fois : l'adulte cherche un mot, pas une case.
   * Le masquage est appliqué avant le dédoublonnage, sans quoi masquer
   * l'exemplaire de l'accueil ferait disparaître aussi celui des Besoins.
   */
  const searchPictograms = useMemo(() => {
    return (requete: string): PictogramItem[] => {
      const terme = sansAccents(requete)
      if (terme.length === 0) return []
      const vus = new Set<string>()
      return TABLEAU_TLA.pages
        .flatMap((page) => casesDeLaPage(page.id))
        .flatMap((c) => (c?.type === 'mot' ? [c.picto] : []))
        .filter((p) => !p.isHidden && sansAccents(p.word).includes(terme))
        .filter((p) => {
          const id = p.lexiqueId ?? p.key
          if (vus.has(id)) return false
          vus.add(id)
          return true
        })
    }
  }, [casesDeLaPage])

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

  return {
    categories,
    tabs,
    casesDeLaPage,
    casesFavorites,
    searchPictograms,
    searchArasaac,
  }
}
