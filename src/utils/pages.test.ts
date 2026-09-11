import { describe, it, expect } from 'vitest'
import {
  casesEnRangees,
  construirePage,
  indexDepuis,
  lireRefSlot,
  nombreDeSlots,
  positionDe,
  premierSlotLibre,
  refSlot,
} from './pages'
import { Case, Geometrie } from '../types'

const GEO: Geometrie = { colonnes: 4, lignes: 3 }
const mot = (lexiqueId: string): Case => ({ type: 'vocabulaire', lexiqueId })

describe('adressage des slots', () => {
  it('fait l’aller-retour entre une adresse et ses composantes', () => {
    const ref = refSlot('besoins', 7)
    expect(ref).toBe('besoins#7')
    expect(lireRefSlot(ref)).toEqual({ pageId: 'besoins', index: 7 })
  })

  it('refuse une adresse illisible plutôt que d’inventer une position', () => {
    expect(lireRefSlot('besoins')).toBeNull()
    expect(lireRefSlot('besoins#')).toBeNull()
    expect(lireRefSlot('besoins#abc')).toBeNull()
    expect(lireRefSlot('besoins#-1')).toBeNull()
    expect(lireRefSlot('#3')).toBeNull()
  })

  it('établit une bijection entre index et position dans la grille', () => {
    for (let index = 0; index < nombreDeSlots(GEO); index += 1) {
      const { ligne, colonne } = positionDe(GEO, index)
      expect(colonne).toBeLessThan(GEO.colonnes)
      expect(ligne).toBeLessThan(GEO.lignes)
      expect(indexDepuis(GEO, ligne, colonne)).toBe(index)
    }
  })
})

describe('construirePage', () => {
  it('produit toujours une grille de longueur `colonnes × lignes`', () => {
    const page = construirePage({ id: 'p', titre: 'P', geometrie: GEO, cases: {} })
    expect(page.slots).toHaveLength(12)
    expect(page.slots.every((s) => s === null)).toBe(true)
  })

  it('pose chaque case à l’index demandé et laisse le reste vide', () => {
    const page = construirePage({
      id: 'p',
      titre: 'P',
      geometrie: GEO,
      cases: { 0: mot('moi'), 5: mot('eau'), 11: mot('fini') },
    })
    expect(page.slots[0]).toEqual(mot('moi'))
    expect(page.slots[5]).toEqual(mot('eau'))
    expect(page.slots[11]).toEqual(mot('fini'))
    expect(page.slots.filter((s) => s !== null)).toHaveLength(3)
  })

  /**
   * Le cœur de la planification motrice : vider une case ne doit jamais
   * déplacer les suivantes. On l’éprouve sur les index, pas sur le rendu — le
   * DOM peut changer de forme, l’invariant, lui, ne doit pas bouger.
   */
  it('laisse un trou à sa place quand une case est retirée', () => {
    const cases: Record<number, Case> = { 0: mot('moi'), 1: mot('vouloir'), 2: mot('manger') }
    const complete = construirePage({ id: 'p', titre: 'P', geometrie: GEO, cases })

    const sansLeMilieu = { ...cases }
    delete sansLeMilieu[1]
    const trouee = construirePage({ id: 'p', titre: 'P', geometrie: GEO, cases: sansLeMilieu })

    expect(trouee.slots[1]).toBeNull()
    expect(trouee.slots[2]).toEqual(complete.slots[2])
    expect(trouee.slots).toHaveLength(complete.slots.length)
  })

  it('refuse une position hors de la grille', () => {
    expect(() =>
      construirePage({ id: 'p', titre: 'P', geometrie: GEO, cases: { 12: mot('moi') } }),
    ).toThrow(/hors de la grille/)
  })

  it('refuse un identifiant de page qui casserait l’adressage', () => {
    expect(() =>
      construirePage({ id: 'a#b', titre: 'P', geometrie: GEO, cases: {} }),
    ).toThrow(/Identifiant de page invalide/)
  })
})

describe('casesEnRangees', () => {
  it('pose chaque case à la ligne et à la colonne où elle est écrite', () => {
    const cases = casesEnRangees(GEO, [
      [mot('oui'), null, mot('non')],
      [],
      [null, mot('moi')],
    ])
    expect(cases).toEqual({ 0: mot('oui'), 2: mot('non'), 9: mot('moi') })
  })

  it('refuse une rangée plus longue que la grille', () => {
    // Elle déborderait sur la rangée suivante, et tout ce qui suit glisserait.
    expect(() =>
      casesEnRangees(GEO, [[mot('a'), mot('b'), mot('c'), mot('d'), mot('e')]]),
    ).toThrow(/5 cases pour 4 colonnes/)
  })
})

describe('premierSlotLibre', () => {
  const page = construirePage({
    id: 'objets',
    titre: 'Objets',
    geometrie: GEO,
    cases: { 0: mot('livre'), 1: mot('jouet') },
  })

  it('choisit la première case vide, dans l’ordre des index', () => {
    expect(premierSlotLibre(page)).toBe('objets#2')
  })

  it('enjambe les cases que le profil a déjà occupées', () => {
    expect(premierSlotLibre(page, ['objets#2', 'objets#3'])).toBe('objets#4')
  })

  it('renvoie `null` sur une page pleine plutôt que d’écraser une case', () => {
    const pleine = construirePage({
      id: 'x',
      titre: 'X',
      geometrie: { colonnes: 2, lignes: 1 },
      cases: { 0: mot('a'), 1: mot('b') },
    })
    expect(premierSlotLibre(pleine)).toBeNull()
  })
})
