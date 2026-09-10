import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePictograms } from './usePictograms'
import { FAVORITES_CATEGORY_ID } from '../data/defaultCategories'
import { makePageFavoris, makeProfile, makeMotPerso } from '../test/factories'
import { PictogramItem } from '../types'
import { TABLEAU_TLA } from '../data/tableauTla'
import { nombreDeSlots } from '../utils/pages'

/** Mots effectivement posés, dans l'ordre des cases, trous exclus. */
function mots(cases: (PictogramItem | null)[]): string[] {
  return cases.filter((c): c is PictogramItem => c !== null).map((c) => c.word)
}

/** Case occupée par un mot donné, sur une page rendue. */
function caseDe(cases: (PictogramItem | null)[], mot: string): PictogramItem | undefined {
  return cases.find((c) => c?.word === mot) ?? undefined
}

/**
 * Adresses réelles de la page « besoins » (src/data/tableauTla.ts) :
 * 0 manger, 1 boire, 2 toilettes, 3 dormir, 4 aide.
 *
 * On les écrit en clair plutôt que de les calculer : un test qui recalcule la
 * position qu'il vérifie ne vérifie plus rien.
 */
const MANGER = 'besoins#0'
const BOIRE = 'besoins#1'
const DORMIR = 'besoins#3'
/** Première case libre de la page, où atterrit un mot ajouté par le parent. */
const LIBRE = 'besoins#5'

/** Profil portant un mot personnalisé posé sur une case libre de « besoins ». */
function profilAvecMotPerso(overrides = {}) {
  return makeProfile({
    lexiquePerso: [makeMotPerso({ id: 'c1', mot: 'Maman' })],
    placements: { [LIBRE]: 'c1' },
    ...overrides,
  })
}

describe('usePictograms — onglet Favoris', () => {
  it('place les favoris en première position des onglets', () => {
    const { result } = renderHook(() => usePictograms(makeProfile()))
    expect(result.current.tabs[0].id).toBe(FAVORITES_CATEGORY_ID)
  })

  it('exclut les favoris des pages de rangement', () => {
    // Distinction essentielle : « Favoris » est une vue. L'exposer comme
    // page de rangement y faisait atterrir les pictogrammes ajoutés,
    // qui n'apparaissaient alors dans aucune grille.
    const { result } = renderHook(() => usePictograms(makeProfile()))
    expect(result.current.categories.map((c) => c.id)).not.toContain(FAVORITES_CATEGORY_ID)
    expect(result.current.categories[0].id).toBe('besoins')
  })

  it('garde les favoris en tête même quand le parent réordonne ses pages', () => {
    const profile = makeProfile({ ordrePages: ['emotions', 'besoins'] })
    const { result } = renderHook(() => usePictograms(profile))
    expect(result.current.tabs[0].id).toBe(FAVORITES_CATEGORY_ID)
    expect(result.current.tabs[1].id).toBe('emotions')
  })

  it('place en fin de liste une page absente de l’ordre du profil', () => {
    // Cas d'une page ajoutée par une mise à jour, postérieure à la création du
    // profil : elle ne doit pas passer devant l'ordre choisi.
    const profile = makeProfile({ ordrePages: ['emotions', 'besoins'] })
    const { result } = renderHook(() => usePictograms(profile))
    const ids = result.current.categories.map((c) => c.id)
    expect(ids.slice(0, 2)).toEqual(['emotions', 'besoins'])
    expect(ids).toContain('aliments')
    expect(ids.indexOf('aliments')).toBeGreaterThan(ids.indexOf('besoins'))
  })

  it('est vide quand aucun favori n’a été choisi', () => {
    const { result } = renderHook(() => usePictograms(makeProfile()))
    expect(mots(result.current.casesFavorites())).toEqual([])
  })

  it('respecte l’ordre d’ajout des favoris', () => {
    const profile = makeProfile({ pageFavoris: makePageFavoris(DORMIR, MANGER, BOIRE) })
    const { result } = renderHook(() => usePictograms(profile))
    expect(mots(result.current.casesFavorites())).toEqual(['dormir', 'manger', 'boire'])
  })

  it('réunit mots livrés et mots ajoutés par le parent', () => {
    const profile = profilAvecMotPerso({ pageFavoris: makePageFavoris(MANGER, LIBRE) })
    const { result } = renderHook(() => usePictograms(profile))
    expect(mots(result.current.casesFavorites())).toEqual(['manger', 'Maman'])
  })

  /**
   * Le retrait d'un favori laisse un `null` à sa place. La vue enjambe le
   * trou, mais les favoris suivants gardent leur rang — sans quoi retirer le
   * premier favori déplacerait tous les autres d'un cran.
   */
  it('ne décale pas les favoris suivants quand l’un d’eux est retiré', () => {
    const profile = makeProfile({ pageFavoris: makePageFavoris(MANGER, BOIRE, DORMIR) })
    const pageFavoris = [...profile.pageFavoris]
    pageFavoris[1] = null

    const { result } = renderHook(() => usePictograms({ ...profile, pageFavoris }))
    const cases = result.current.casesFavorites()

    // Le trou reste à sa place : « dormir » n'avance pas d'un cran.
    expect(cases[0]?.word).toBe('manger')
    expect(cases[1]).toBeNull()
    expect(cases[2]?.word).toBe('dormir')
  })

  it('n’affiche pas dans les favoris une case masquée par ailleurs', () => {
    const profile = makeProfile({
      pageFavoris: makePageFavoris(MANGER, BOIRE),
      slotsMasques: [BOIRE],
    })
    const { result } = renderHook(() => usePictograms(profile))
    expect(mots(result.current.casesFavorites())).toEqual(['manger'])
  })

  it('ignore un favori dont le mot personnalisé n’existe plus', () => {
    const profile = makeProfile({ pageFavoris: makePageFavoris(LIBRE) })
    const { result } = renderHook(() => usePictograms(profile))
    expect(mots(result.current.casesFavorites())).toEqual([])
  })
})

describe('usePictograms — indicateur de favori dans la grille', () => {
  it('marque comme favori la case choisie, et elle seule', () => {
    const profile = makeProfile({ pageFavoris: makePageFavoris(MANGER) })
    const { result } = renderHook(() => usePictograms(profile))
    const cases = result.current.casesDeLaPage('besoins')
    expect(caseDe(cases, 'manger')?.isFavorite).toBe(true)
    expect(caseDe(cases, 'boire')?.isFavorite).toBe(false)
  })

  it('marque aussi un mot ajouté par le parent mis en favori', () => {
    const profile = profilAvecMotPerso({ pageFavoris: makePageFavoris(LIBRE) })
    const { result } = renderHook(() => usePictograms(profile))
    expect(caseDe(result.current.casesDeLaPage('besoins'), 'Maman')?.isFavorite).toBe(true)
  })
})

describe('usePictograms — masquage', () => {
  it('marque une case masquée au lieu de la retirer', () => {
    // La case doit rester : la retirer décalerait d'un cran tout ce qui suit,
    // et l'enfant devrait réapprendre où se trouvent ses mots.
    const profile = makeProfile({ slotsMasques: [MANGER] })
    const { result } = renderHook(() => usePictograms(profile))
    const cases = result.current.casesDeLaPage('besoins')

    expect(caseDe(cases, 'manger')?.isHidden).toBe(true)
    expect(caseDe(cases, 'boire')?.isHidden).toBe(false)
  })

  it('marque de même une case de mot personnalisé masquée', () => {
    const profile = profilAvecMotPerso({ slotsMasques: [LIBRE] })
    const { result } = renderHook(() => usePictograms(profile))
    expect(caseDe(result.current.casesDeLaPage('besoins'), 'Maman')?.isHidden).toBe(true)
  })

  it('ne déplace aucun pictogramme quand on en masque un', () => {
    const complet = renderHook(() => usePictograms(makeProfile()))
    const avant = complet.result.current.casesDeLaPage('besoins').map((c) => c?.word ?? null)

    const partiel = renderHook(() => usePictograms(makeProfile({ slotsMasques: [BOIRE] })))
    const apres = partiel.result.current.casesDeLaPage('besoins').map((c) => c?.word ?? null)

    // Le cœur de N4 : la liste est identique, position pour position. Seul
    // l'indicateur change, et la grille laisse la case vide.
    expect(apres).toEqual(avant)
  })

  it('rend toujours une page de la longueur exacte de la géométrie', () => {
    // C'est cette longueur constante qui interdit à la grille de se refermer :
    // une case vide occupe une position, elle ne la libère pas.
    const { result } = renderHook(() => usePictograms(makeProfile()))
    const attendu = nombreDeSlots(TABLEAU_TLA.geometrie)

    for (const page of TABLEAU_TLA.pages) {
      expect(result.current.casesDeLaPage(page.id), page.id).toHaveLength(attendu)
    }
    expect(result.current.casesFavorites()).toHaveLength(attendu)
  })

  /**
   * Ce que l'ancien masquage par identifiant ARASAAC ne savait pas faire :
   * « moi » occupe une case de la page Personnes, et le même mot est destiné à
   * en occuper d'autres ailleurs dans le tableau. Masquer l'une ne doit pas
   * emporter les autres.
   */
  it('ne masque que la case visée, pas le mot partout où il figure', () => {
    const profile = makeProfile({ slotsMasques: ['personnes#4'] })
    const { result } = renderHook(() => usePictograms(profile))

    const moi = caseDe(result.current.casesDeLaPage('personnes'), 'moi')
    expect(moi?.isHidden).toBe(true)
    expect(profile.slotsMasques).toEqual(['personnes#4'])
  })

  it('exclut en revanche les cases masquées des favoris', () => {
    // Les favoris sont une vue, pas une disposition apprise : y laisser un
    // trou n'aurait aucun sens, et un mot écarté par le parent ne doit
    // réapparaître nulle part.
    const profile = makeProfile({
      pageFavoris: makePageFavoris(MANGER, BOIRE),
      slotsMasques: [MANGER],
    })
    const { result } = renderHook(() => usePictograms(profile))

    expect(mots(result.current.casesFavorites())).toEqual(['boire'])
  })
})

describe('usePictograms — thème porté par le pictogramme', () => {
  it('conserve le thème d’origine d’un favori', () => {
    // C'est ce qui permet à la carte de garder sa couleur dans l'onglet
    // Favoris, au lieu de prendre le jaune de l'onglet.
    const profile = makeProfile({ pageFavoris: makePageFavoris(MANGER) })
    const { result } = renderHook(() => usePictograms(profile))
    expect(result.current.casesFavorites()[0]?.categoryId).toBe('besoins')
  })

  it('expose la classe grammaticale, socle du codage couleur à venir', () => {
    const { result } = renderHook(() => usePictograms(makeProfile()))
    const cases = result.current.casesDeLaPage('besoins')
    expect(caseDe(cases, 'manger')?.classeGrammaticale).toBe('verbe')
    expect(caseDe(cases, 'aide')?.classeGrammaticale).toBe('nom')
  })
})
