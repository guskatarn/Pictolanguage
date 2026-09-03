import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePictograms } from './usePictograms'
import { FAVORITES_CATEGORY_ID } from '../data/defaultCategories'
import { makeProfile, makeCustomPictogram } from '../test/factories'

/** Pictogrammes réels de la catégorie « besoins » (src/data/defaultPictograms.ts). */
const MANGER = 6456
const BOIRE = 6061
const DORMIR = 6479

describe('usePictograms — onglet Favoris', () => {
  it('place les favoris en première position des onglets', () => {
    const { result } = renderHook(() => usePictograms(makeProfile()))
    expect(result.current.tabs[0].id).toBe(FAVORITES_CATEGORY_ID)
  })

  it('exclut les favoris des catégories de rangement', () => {
    // Distinction essentielle : « Favoris » est une vue. L'exposer comme
    // catégorie de rangement y faisait atterrir les pictogrammes ajoutés,
    // qui n'apparaissaient alors dans aucune grille.
    const { result } = renderHook(() => usePictograms(makeProfile()))
    expect(result.current.categories.map((c) => c.id)).not.toContain(FAVORITES_CATEGORY_ID)
    expect(result.current.categories[0].id).toBe('besoins')
  })

  it('garde les favoris en tête même quand le parent réordonne ses catégories', () => {
    const profile = makeProfile({ categoryOrder: ['emotions', 'besoins'] })
    const { result } = renderHook(() => usePictograms(profile))
    expect(result.current.tabs[0].id).toBe(FAVORITES_CATEGORY_ID)
    expect(result.current.tabs[1].id).toBe('emotions')
  })

  it('place en fin de liste une catégorie absente de l’ordre du profil', () => {
    // Cas d'une catégorie ajoutée par une mise à jour, postérieure à la
    // création du profil : elle ne doit pas passer devant l'ordre choisi.
    const profile = makeProfile({ categoryOrder: ['emotions', 'besoins'] })
    const { result } = renderHook(() => usePictograms(profile))
    const ids = result.current.categories.map((c) => c.id)
    expect(ids.slice(0, 2)).toEqual(['emotions', 'besoins'])
    expect(ids).toContain('aliments')
    expect(ids.indexOf('aliments')).toBeGreaterThan(ids.indexOf('besoins'))
  })

  it('est vide quand aucun favori n’a été choisi', () => {
    const { result } = renderHook(() => usePictograms(makeProfile()))
    expect(result.current.getFavoritePictograms()).toEqual([])
  })

  it('respecte l’ordre d’ajout des favoris', () => {
    const profile = makeProfile({ favorites: [DORMIR, MANGER, BOIRE] })
    const { result } = renderHook(() => usePictograms(profile))
    expect(result.current.getFavoritePictograms().map((p) => p.word)).toEqual([
      'dormir',
      'manger',
      'boire',
    ])
  })

  it('réunit favoris par défaut et favoris personnalisés', () => {
    const custom = makeCustomPictogram({ id: 'c1', word: 'Maman' })
    const profile = makeProfile({
      favorites: [MANGER],
      favoritesCustom: ['c1'],
      customPictograms: [custom],
    })
    const { result } = renderHook(() => usePictograms(profile))
    expect(result.current.getFavoritePictograms().map((p) => p.word)).toEqual(['manger', 'Maman'])
  })

  it('n’affiche pas dans les favoris un pictogramme masqué par ailleurs', () => {
    const profile = makeProfile({ favorites: [MANGER, BOIRE], hidden: [BOIRE] })
    const { result } = renderHook(() => usePictograms(profile))
    expect(result.current.getFavoritePictograms().map((p) => p.word)).toEqual(['manger'])
  })

  it('ignore un favori dont le pictogramme personnalisé n’existe plus', () => {
    const profile = makeProfile({ favoritesCustom: ['disparu'], customPictograms: [] })
    const { result } = renderHook(() => usePictograms(profile))
    expect(result.current.getFavoritePictograms()).toEqual([])
  })
})

describe('usePictograms — indicateur de favori dans la grille', () => {
  it('marque comme favori le pictogramme choisi, et lui seul', () => {
    const profile = makeProfile({ favorites: [MANGER] })
    const { result } = renderHook(() => usePictograms(profile))
    const items = result.current.getPictogramsForCategory('besoins')
    expect(items.find((i) => i.word === 'manger')?.isFavorite).toBe(true)
    expect(items.find((i) => i.word === 'boire')?.isFavorite).toBe(false)
  })

  it('marque aussi un pictogramme personnalisé mis en favori', () => {
    const custom = makeCustomPictogram({ id: 'c1', word: 'Maman', categoryId: 'besoins' })
    const profile = makeProfile({ favoritesCustom: ['c1'], customPictograms: [custom] })
    const { result } = renderHook(() => usePictograms(profile))
    const items = result.current.getPictogramsForCategory('besoins')
    expect(items.find((i) => i.word === 'Maman')?.isFavorite).toBe(true)
  })
})

describe('usePictograms — masquage', () => {
  it('retire de la grille un pictogramme par défaut masqué', () => {
    const profile = makeProfile({ hidden: [MANGER] })
    const { result } = renderHook(() => usePictograms(profile))
    const words = result.current.getPictogramsForCategory('besoins').map((i) => i.word)
    expect(words).not.toContain('manger')
    expect(words).toContain('boire')
  })

  it('retire de la grille un pictogramme personnalisé masqué', () => {
    const custom = makeCustomPictogram({ id: 'c1', word: 'Maman', categoryId: 'besoins' })
    const profile = makeProfile({ hiddenCustom: ['c1'], customPictograms: [custom] })
    const { result } = renderHook(() => usePictograms(profile))
    expect(
      result.current.getPictogramsForCategory('besoins').map((i) => i.word),
    ).not.toContain('Maman')
  })

  it('ne bouscule pas l’ordre des pictogrammes restants', () => {
    const complet = renderHook(() => usePictograms(makeProfile()))
    const avant = complet.result.current.getPictogramsForCategory('besoins').map((i) => i.word)

    const partiel = renderHook(() => usePictograms(makeProfile({ hidden: [BOIRE] })))
    const apres = partiel.result.current.getPictogramsForCategory('besoins').map((i) => i.word)

    // La planification motrice repose sur des positions stables : masquer un
    // pictogramme doit retirer une case, jamais réorganiser les autres.
    expect(apres).toEqual(avant.filter((w) => w !== 'boire'))
  })
})
