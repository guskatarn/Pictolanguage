import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { makePageFavoris, makeProfile } from './test/factories'
import { TABLEAU_TLA } from './data/tableauTla'
import { nombreDeSlots } from './utils/pages'
import { PALETTE_FITZGERALD } from './data/classesGrammaticales'

/**
 * Amorce l'application avec un profil actif : sans cela, `App` n'affiche que le
 * sélecteur de profils et rien de la grille n'est atteignable.
 */
function seedProfile(parentPin: string | null = null) {
  const profile = makeProfile({ ordrePages: ['besoins', 'emotions'] })
  localStorage.setItem(
    'pictoapp-data',
    JSON.stringify({ schemaVersion: 2, profiles: [profile], activeProfileId: profile.id, parentPin }),
  )
  return profile
}

/**
 * `speechSynthesis` n'existe pas sous jsdom : `useSpeech` le détecte et ne fait
 * rien. C'est exactement ce qu'il faut ici — ces tests portent sur ce que
 * devient la phrase affichée, pas sur la lecture elle-même.
 */
describe('App — la phrase composée', () => {
  it('reste affichée après avoir été prononcée', async () => {
    // Régression visée : la phrase était vidée dès la lecture, si bien qu'un
    // enfant à qui l'on demande de répéter devait la reconstruire entièrement.
    seedProfile()
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'manger' }))
    expect(screen.getByRole('button', { name: 'Retirer manger' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Parler' }))
    expect(screen.getByRole('button', { name: 'Retirer manger' })).toBeInTheDocument()
  })

  it("s'efface sur « Tout effacer », et seulement là", async () => {
    seedProfile()
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'manger' }))
    await user.click(screen.getByRole('button', { name: 'Parler' }))
    await user.click(screen.getByRole('button', { name: 'Tout effacer' }))

    expect(screen.queryByRole('button', { name: 'Retirer manger' })).not.toBeInTheDocument()
  })
})

describe('App — couleur des pictogrammes', () => {
  /**
   * La couleur venait autrefois de l'onglet affiché : l'onglet Favoris
   * repeignait toute la grille en jaune, et un même mot changeait de couleur
   * selon l'endroit où l'enfant le regardait. Elle suit désormais le mot, dans
   * les deux modes de codage.
   */
  it.each([
    ['grammatical', PALETTE_FITZGERALD.verbe.fond],
    ['thematique', '#FEF3C7'],
  ] as const)('garde en mode %s la couleur du mot dans l’onglet Favoris', async (mode, fond) => {
    const base = makeProfile()
    const profile = makeProfile({
      pageFavoris: makePageFavoris('besoins#0'),
      settings: { ...base.settings, modeCouleur: mode },
    })
    localStorage.setItem(
      'pictoapp-data',
      JSON.stringify({ schemaVersion: 2, profiles: [profile], activeProfileId: profile.id, parentPin: null }),
    )
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('button', { name: 'manger' })).toHaveStyle({ backgroundColor: fond })

    await user.click(screen.getByRole('button', { name: /Favoris/ }))
    expect(screen.getByRole('button', { name: 'manger' })).toHaveStyle({ backgroundColor: fond })
  })
})

describe('App — verrou parental', () => {
  it('laisse tout ouvert tant qu’aucun code n’est installé', async () => {
    seedProfile()
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getAllByRole('button', { name: /aux favoris/i }).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Paramètres' }))
    expect(screen.getByRole('heading', { name: /Paramètres/ })).toBeInTheDocument()
  })

  it('retire les étoiles et demande le code une fois le verrou posé', async () => {
    // C'était la réserve ouverte depuis le lot favoris : l'enfant qui vise son
    // mot touche l'étoile d'à côté, et son pictogramme n'arrive pas dans la
    // phrase.
    seedProfile('4321')
    const user = userEvent.setup()
    render(<App />)

    expect(screen.queryAllByRole('button', { name: /aux favoris/i })).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Paramètres' }))
    expect(screen.queryByRole('heading', { name: /⚙️ Paramètres/ })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Code parent/ })).toBeInTheDocument()

    for (const chiffre of '4321') {
      await user.click(screen.getByRole('button', { name: chiffre }))
    }
    expect(screen.getByRole('heading', { name: /⚙️ Paramètres/ })).toBeInTheDocument()
  })

  it('protège aussi le changement de profil, où un profil peut être supprimé', async () => {
    seedProfile('4321')
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Changer de profil' }))
    expect(screen.getByRole('heading', { name: /Code parent/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'disavecmoi' })).not.toBeInTheDocument()
  })
})

describe('App — positions stables', () => {
  function monterAvec(profil: ReturnType<typeof makeProfile>) {
    localStorage.setItem(
      'pictoapp-data',
      JSON.stringify({
        schemaVersion: 2,
        profiles: [profil],
        activeProfileId: profil.id,
        parentPin: null,
      }),
    )
    return render(<App />)
  }

  /** Position de chaque case de la grille, un libellé ou `null` pour un trou. */
  function dispositionDe(container: HTMLElement): (string | null)[] {
    const grille = container.querySelector('.picto-grid')!
    return [...grille.children].map((c) => c.getAttribute('aria-label'))
  }

  it('rend la grille à la géométrie déclarée par le tableau', () => {
    // La grille ne se reforme plus selon la place disponible : son nombre de
    // cases vient des données, et c'est ce qui rend les positions comparables
    // d'un appareil à l'autre.
    const { container } = monterAvec(makeProfile())
    expect(container.querySelector('.picto-grid')!.children).toHaveLength(
      nombreDeSlots(TABLEAU_TLA.geometrie),
    )
  })

  it('laisse une case vide à la place d’un pictogramme masqué, sans rien décaler', () => {
    // Sans cela, masquer « manger » remontait « boire » à sa place, et tout le
    // reste d'un cran : l'enfant perdait les repères moteurs qu'il avait
    // construits.
    const { container, unmount } = monterAvec(makeProfile())
    const avant = dispositionDe(container)
    unmount()

    const { container: apres } = monterAvec(makeProfile({ slotsMasques: ['besoins#0'] }))
    const dispo = dispositionDe(apres)

    expect(screen.queryByRole('button', { name: 'manger' })).not.toBeInTheDocument()
    // La case de « manger » est vide ; toutes les autres sont inchangées.
    expect(dispo[0]).toBeNull()
    expect(dispo.slice(1)).toEqual(avant.slice(1))
  })

  it('garde le même nombre de colonnes quel que soit le réglage de taille', () => {
    // Le réglage commande désormais la taille d'une case, plus le nombre de
    // colonnes : changer de taille ne doit plus réorganiser la grille.
    const { container, unmount } = monterAvec(makeProfile())
    const petit = dispositionDe(container)
    unmount()

    const { container: grand } = monterAvec(
      makeProfile({ settings: { ...makeProfile().settings, tailleCase: 'L' } }),
    )
    expect(dispositionDe(grand)).toEqual(petit)
  })
})
