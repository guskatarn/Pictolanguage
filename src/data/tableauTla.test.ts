import { describe, it, expect } from 'vitest'
import {
  GEOMETRIE,
  ORDRE_PAGES_PAR_DEFAUT,
  PAGE_ACCUEIL,
  TABLEAU_TLA,
  trouverPage,
} from './tableauTla'
import { trouverMot } from './lexique'
import { FAVORITES_CATEGORY_ID } from './defaultCategories'
import { nombreDeSlots } from '../utils/pages'

describe('intégrité du tableau livré', () => {
  it('donne à chaque page exactement la géométrie déclarée', () => {
    for (const page of TABLEAU_TLA.pages) {
      expect(page.slots, page.id).toHaveLength(nombreDeSlots(GEOMETRIE))
    }
  })

  it('n’attribue jamais deux fois le même identifiant de page', () => {
    const ids = TABLEAU_TLA.pages.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  /**
   * La direction qui compte : une case peut pointer vers un mot qui n'existe
   * pas, et elle s'afficherait alors vide sans que rien ne le signale. La
   * réciproque est admise — un mot du lexique peut n'être encore posé nulle
   * part, le temps que l'orthophoniste lui trouve sa place.
   */
  it('ne référence aucun mot absent du lexique', () => {
    for (const page of TABLEAU_TLA.pages) {
      for (const [index, slot] of page.slots.entries()) {
        if (slot?.type !== 'vocabulaire') continue
        expect(trouverMot(slot.lexiqueId), `${page.id}#${index}`).toBeDefined()
      }
    }
  })

  it('ne mène aucune case de navigation vers une page inexistante', () => {
    for (const page of TABLEAU_TLA.pages) {
      for (const slot of page.slots) {
        if (slot?.type !== 'navigation') continue
        // Les favoris sont une vue et non une page du tableau, mais une case
        // peut y mener comme l'onglet du même nom.
        if (slot.pageCible === FAVORITES_CATEGORY_ID) continue
        expect(trouverPage(slot.pageCible), slot.pageCible).toBeDefined()
      }
    }
  })

  it('désigne une page racine qui existe', () => {
    expect(trouverPage(TABLEAU_TLA.pageRacine)).toBeDefined()
  })
})

describe('page d’accueil', () => {
  const accueil = trouverPage(PAGE_ACCUEIL)!
  const motsPoses = accueil.slots.flatMap((s) => (s?.type === 'vocabulaire' ? [s.lexiqueId] : []))

  it('est la racine du tableau', () => {
    expect(TABLEAU_TLA.pageRacine).toBe(PAGE_ACCUEIL)
  })

  /**
   * L'accueil a absorbé l'ancienne barre de mots rapides : aucun de ses mots
   * ne doit s'être perdu en route, ils servent dans presque toutes les phrases.
   */
  it('porte tout le vocabulaire de l’ancienne barre de mots rapides', () => {
    const barre = ['moi', 'vouloir', 'aide', 'encore', 'stop', 'oui', 'non', 'aimer', 'donner', 'fini']
    for (const id of barre) expect(motsPoses, id).toContain(id)
  })

  it('mène en une case à chaque page thématique', () => {
    // « Thèmes à une case de navigation » : aucune page ne doit n'être
    // atteignable que par les onglets.
    const cibles = accueil.slots.flatMap((s) => (s?.type === 'navigation' ? [s.pageCible] : []))
    for (const id of ORDRE_PAGES_PAR_DEFAUT) expect(cibles, id).toContain(id)
  })

  it('ne pose jamais deux fois le même mot', () => {
    expect(new Set(motsPoses).size).toBe(motsPoses.length)
  })
})

describe('pages et ordre', () => {
  it('laisse de la place libre sur chaque page pour les mots ajoutés par un parent', () => {
    for (const page of TABLEAU_TLA.pages) {
      const libres = page.slots.filter((s) => s === null).length
      expect(libres, page.id).toBeGreaterThan(0)
    }
  })

  it('énumère l’ordre par défaut de toutes les pages sauf l’accueil', () => {
    // L'accueil reste en tête, hors de l'ordre que le parent peut changer.
    expect(ORDRE_PAGES_PAR_DEFAUT).not.toContain(PAGE_ACCUEIL)
    expect(ORDRE_PAGES_PAR_DEFAUT).toHaveLength(TABLEAU_TLA.pages.length - 1)
    expect(new Set(ORDRE_PAGES_PAR_DEFAUT).size).toBe(TABLEAU_TLA.pages.length - 1)
  })
})
