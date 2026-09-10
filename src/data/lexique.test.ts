import { describe, it, expect } from 'vitest'
import { AUXILIAIRES, LEXIQUE, trouverMot } from './lexique'
import { BUNDLED_PICTOGRAM_IDS } from './bundledPictograms'
import { Personne } from '../types'

const PERSONNES: Personne[] = ['je', 'tu', 'il', 'nous', 'vous', 'ils']

describe('intégrité du lexique', () => {
  it('n’attribue jamais deux fois le même identifiant', () => {
    const ids = LEXIQUE.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('emploie des identifiants en minuscules sans accent, stables dans une URL', () => {
    for (const entree of LEXIQUE) {
      expect(entree.id, entree.mot).toMatch(/^[a-z0-9-]+$/)
    }
  })

  /**
   * `morpho` porte son propre discriminant, indispensable au `switch` exhaustif
   * de la formulation. Rien dans le type n’empêche de le désaccorder de
   * `classeGrammaticale` — d’où cette vérification, seule garante de l’accord.
   */
  it('accorde le discriminant de `morpho` avec la classe grammaticale', () => {
    for (const { mot, classeGrammaticale, morpho } of LEXIQUE) {
      if (!morpho) continue
      expect(morpho.classe, mot).toBe(classeGrammaticale)
    }
  })

  it('donne aux verbes leurs six formes du présent, toutes renseignées', () => {
    const verbes = [...LEXIQUE.map((e) => e.morpho), ...Object.values(AUXILIAIRES)]
    for (const morpho of verbes) {
      if (morpho?.classe !== 'verbe') continue
      for (const personne of PERSONNES) {
        expect(morpho.present[personne], `${morpho.infinitif} / ${personne}`).toBeTruthy()
      }
    }
  })

  it('donne une morphologie à tout mot que la formulation doit fléchir', () => {
    const flechis = ['pronom', 'verbe', 'adjectif', 'nom']
    for (const entree of LEXIQUE) {
      if (!flechis.includes(entree.classeGrammaticale)) continue
      expect(entree.morpho, entree.mot).toBeDefined()
    }
  })

  /**
   * Un mot sans image ne s'afficherait pas : la carte tomberait sur le repli
   * 🖼️ et l'enfant verrait une case muette. Les deux sources sont exclusives —
   * banque ARASAAC pour le vocabulaire livré, image stockée pour un mot ajouté
   * par un parent — mais l'une des deux est obligatoire.
   */
  it('donne à chaque mot exactement une source d’image', () => {
    for (const { mot, arasaacId, imageUrl } of LEXIQUE) {
      expect(
        (arasaacId !== undefined) !== (imageUrl !== undefined),
        `${mot} : ni image ARASAAC ni image stockée, ou les deux`,
      ).toBe(true)
    }
  })

  it('retrouve un mot par son identifiant, et rien pour un identifiant inconnu', () => {
    expect(trouverMot('vouloir')?.mot).toBe('vouloir')
    expect(trouverMot('inexistant')).toBeUndefined()
  })
})

/**
 * Le lexique et les images embarquées doivent se recouvrir exactement. Un mot
 * sans image serait invisible hors ligne ; une image sans mot alourdirait le
 * paquet pour rien. `npm run pictograms` régénère `bundledPictograms.ts` à
 * partir des fichiers de données — ces deux tests détectent l’oubli de
 * l’exécuter.
 */
describe('lexique et images embarquées', () => {
  it('embarque l’image de chaque mot du lexique', () => {
    for (const { mot, arasaacId } of LEXIQUE) {
      if (arasaacId === undefined) continue
      expect(BUNDLED_PICTOGRAM_IDS.has(arasaacId), mot).toBe(true)
    }
  })

  it('n’embarque aucune image devenue orpheline', () => {
    const utilises = new Set(
      LEXIQUE.map((e) => e.arasaacId).filter((id): id is number => id !== undefined),
    )
    const orphelines = [...BUNDLED_PICTOGRAM_IDS].filter((id) => !utilises.has(id))
    expect(orphelines).toEqual([])
  })
})
