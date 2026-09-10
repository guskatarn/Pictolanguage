import { describe, it, expect } from 'vitest'
import { GEOMETRIE, ORDRE_PAGES_PAR_DEFAUT, TABLEAU_TLA, trouverPage } from './tableauTla'
import { trouverMot } from './lexique'
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
   * part, ce qui est le cas du vocabulaire de la barre de mots rapides tant
   * qu'il n'a pas rejoint la page d'accueil.
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
        expect(trouverPage(slot.pageCible), slot.pageCible).toBeDefined()
      }
    }
  })

  it('désigne une page racine qui existe', () => {
    expect(trouverPage(TABLEAU_TLA.pageRacine)).toBeDefined()
  })

  it('laisse de la place libre sur chaque page pour les mots ajoutés par un parent', () => {
    for (const page of TABLEAU_TLA.pages) {
      const libres = page.slots.filter((s) => s === null).length
      expect(libres, page.id).toBeGreaterThan(0)
    }
  })

  it('énumère l’ordre par défaut des pages sans en oublier', () => {
    expect(ORDRE_PAGES_PAR_DEFAUT).toHaveLength(TABLEAU_TLA.pages.length)
    expect(new Set(ORDRE_PAGES_PAR_DEFAUT).size).toBe(TABLEAU_TLA.pages.length)
  })
})
