import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePictograms } from './usePictograms'
import { FAVORITES_CATEGORY_ID } from '../data/defaultCategories'
import { makePageFavoris, makeProfile, makeMotPerso } from '../test/factories'
import { CaseGrille, PictogramItem } from '../types'
import { PAGE_ACCUEIL, TABLEAU_TLA } from '../data/tableauTla'
import { nombreDeSlots } from '../utils/pages'

/** Mots de la page, case par case : `null` pour un trou comme pour une navigation. */
function pictos(cases: (CaseGrille | null)[]): (PictogramItem | null)[] {
  return cases.map((c) => (c?.type === 'mot' ? c.picto : null))
}

/** Mots effectivement posés, dans l'ordre des cases, trous exclus. */
function mots(cases: (CaseGrille | null)[]): string[] {
  return pictos(cases)
    .filter((c): c is PictogramItem => c !== null)
    .map((c) => c.word)
}

/** Case occupée par un mot donné, sur une page rendue. */
function caseDe(cases: (CaseGrille | null)[], mot: string): PictogramItem | undefined {
  return pictos(cases).find((c) => c?.word === mot) ?? undefined
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

describe('usePictograms — onglets', () => {
  it('place l’accueil puis les favoris en tête des onglets', () => {
    const { result } = renderHook(() => usePictograms(makeProfile()))
    expect(result.current.tabs.slice(0, 2).map((t) => t.id)).toEqual([
      PAGE_ACCUEIL,
      FAVORITES_CATEGORY_ID,
    ])
  })

  it('exclut les favoris des pages de rangement, mais pas l’accueil', () => {
    // Distinction essentielle : « Favoris » est une vue. L'exposer comme
    // page de rangement y faisait atterrir les pictogrammes ajoutés,
    // qui n'apparaissaient alors dans aucune grille. L'accueil, lui, est une
    // vraie page où un parent peut poser un mot.
    const { result } = renderHook(() => usePictograms(makeProfile()))
    expect(result.current.categories.map((c) => c.id)).not.toContain(FAVORITES_CATEGORY_ID)
    expect(result.current.categories[0].id).toBe(PAGE_ACCUEIL)
  })

  it('garde accueil et favoris en tête même quand le parent réordonne ses pages', () => {
    const profile = makeProfile({ ordrePages: ['emotions', 'besoins'] })
    const { result } = renderHook(() => usePictograms(profile))
    expect(result.current.tabs.slice(0, 3).map((t) => t.id)).toEqual([
      PAGE_ACCUEIL,
      FAVORITES_CATEGORY_ID,
      'emotions',
    ])
  })

  it('place en fin de liste une page absente de l’ordre du profil', () => {
    // Cas d'une page ajoutée par une mise à jour, postérieure à la création du
    // profil : elle ne doit pas passer devant l'ordre choisi.
    const profile = makeProfile({ ordrePages: ['emotions', 'besoins'] })
    const { result } = renderHook(() => usePictograms(profile))
    const ids = result.current.categories.map((c) => c.id)
    expect(ids.slice(1, 3)).toEqual(['emotions', 'besoins'])
    expect(ids).toContain('aliments')
    expect(ids.indexOf('aliments')).toBeGreaterThan(ids.indexOf('besoins'))
  })
})

describe('usePictograms — page d’accueil', () => {
  it('rend les cases de navigation à leur place, avec leur page cible', () => {
    const { result } = renderHook(() => usePictograms(makeProfile()))
    const cases = result.current.casesDeLaPage(PAGE_ACCUEIL)
    const navigations = cases.flatMap((c) => (c?.type === 'navigation' ? [c.pageCible] : []))
    expect(navigations).toContain('besoins')
    expect(navigations).toContain(FAVORITES_CATEGORY_ID)
  })

  it('donne à un mot de l’accueil la couleur de son thème, pas celle de la page', () => {
    // « manger » garde sa couleur des Besoins jusque sur l'accueil, qui n'a
    // pas de thème à lui prêter.
    const { result } = renderHook(() => usePictograms(makeProfile()))
    expect(caseDe(result.current.casesDeLaPage(PAGE_ACCUEIL), 'manger')?.categoryId).toBe('besoins')
  })
})

describe('usePictograms — recherche', () => {
  it('ne propose qu’une fois un mot posé sur plusieurs pages', () => {
    // « manger » est sur l'accueil et dans les Besoins.
    const { result } = renderHook(() => usePictograms(makeProfile()))
    expect(result.current.searchPictograms('manger').map((p) => p.word)).toEqual(['manger'])
  })

  it('propose encore un mot dont un seul des exemplaires est masqué', () => {
    // Masquer puis dédoublonner, pas l'inverse : sinon masquer « manger » sur
    // l'accueil le ferait disparaître de la recherche alors qu'il reste dans
    // les Besoins.
    const { result } = renderHook(() =>
      usePictograms(makeProfile({ slotsMasques: ['accueil#19'] })),
    )
    const trouves = result.current.searchPictograms('manger')
    expect(trouves.map((p) => p.refSlot)).toEqual([MANGER])
  })

  it('ne propose jamais une case de navigation', () => {
    const { result } = renderHook(() => usePictograms(makeProfile()))
    expect(result.current.searchPictograms('aliments')).toEqual([])
  })
})

describe('usePictograms — onglet Favoris', () => {

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
    const cases = pictos(result.current.casesFavorites())

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
    const avant = pictos(complet.result.current.casesDeLaPage('besoins')).map((c) => c?.word ?? null)

    const partiel = renderHook(() => usePictograms(makeProfile({ slotsMasques: [BOIRE] })))
    const apres = pictos(partiel.result.current.casesDeLaPage('besoins')).map((c) => c?.word ?? null)

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
   * « moi » occupe une case de la page Personnes et une autre sur l'accueil.
   * Masquer l'une ne doit pas emporter l'autre.
   */
  it('ne masque que la case visée, pas le mot partout où il figure', () => {
    const profile = makeProfile({ slotsMasques: ['personnes#4'] })
    const { result } = renderHook(() => usePictograms(profile))

    expect(caseDe(result.current.casesDeLaPage('personnes'), 'moi')?.isHidden).toBe(true)
    expect(caseDe(result.current.casesDeLaPage(PAGE_ACCUEIL), 'moi')?.isHidden).toBe(false)
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
    expect(pictos(result.current.casesFavorites())[0]?.categoryId).toBe('besoins')
  })

  it('expose la classe grammaticale, socle du codage couleur à venir', () => {
    const { result } = renderHook(() => usePictograms(makeProfile()))
    const cases = result.current.casesDeLaPage('besoins')
    expect(caseDe(cases, 'manger')?.classeGrammaticale).toBe('verbe')
    expect(caseDe(cases, 'aide')?.classeGrammaticale).toBe('nom')
  })
})
