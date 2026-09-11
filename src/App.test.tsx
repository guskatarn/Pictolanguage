import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

/**
 * La synthèse est remplacée par un espion : jsdom n'a pas de voix, et le mode
 * modélisation se vérifie justement à ce qu'il **dit** sans rien composer.
 */
const { parle } = vi.hoisted(() => ({ parle: vi.fn() }))
vi.mock('./hooks/useSpeech', () => ({
  useSpeech: () => ({ speak: parle, cancel: vi.fn(), isSpeaking: false, isSupported: true }),
}))

beforeEach(() => parle.mockClear())
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

describe('App — formulation', () => {
  function monterAvec(settings: Partial<ReturnType<typeof makeProfile>['settings']>) {
    const base = makeProfile()
    const profile = makeProfile({ settings: { ...base.settings, ...settings } })
    localStorage.setItem(
      'pictoapp-data',
      JSON.stringify({ schemaVersion: 2, profiles: [profile], activeProfileId: profile.id, parentPin: null }),
    )
    render(<App />)
    return userEvent.setup()
  }

  async function composer(user: ReturnType<typeof userEvent.setup>, ...mots: string[]) {
    for (const mot of mots) await user.click(screen.getByRole('button', { name: mot }))
    await user.click(screen.getByRole('button', { name: 'Parler' }))
  }

  it('prononce une phrase construite, accordée au profil', async () => {
    const user = monterAvec({ formulation: 'naturelle', accord: 'feminin' })
    await composer(user, 'moi', 'content')
    expect(parle).toHaveBeenCalledWith('je suis contente', expect.anything())
  })

  it('prononce mot à mot quand le parent l’a choisi', async () => {
    const user = monterAvec({ formulation: 'brute' })
    await composer(user, 'moi', 'vouloir', 'manger')
    expect(parle).toHaveBeenCalledWith('moi, vouloir, manger', expect.anything())
  })

  it('garde dans l’historique les mots touchés et la phrase dite, et la rejoue telle quelle', async () => {
    const user = monterAvec({ formulation: 'naturelle' })
    await composer(user, 'moi', 'vouloir', 'manger')

    await user.click(screen.getByRole('button', { name: 'Historique' }))
    expect(screen.getByText('moi · vouloir · manger')).toBeInTheDocument()
    expect(screen.getByText('« je veux manger »')).toBeInTheDocument()

    parle.mockClear()
    await user.click(screen.getByRole('button', { name: 'Rejouer' }))
    expect(parle).toHaveBeenCalledWith('je veux manger', expect.anything())
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

    await user.click(screen.getByRole('button', { name: '⭐ Favoris' }))
    expect(screen.getByRole('button', { name: 'manger' })).toHaveStyle({ backgroundColor: fond })
  })
})

describe('App — page d’accueil', () => {
  it('s’ouvre sur l’accueil, qui porte les mots de l’ancienne barre rapide', () => {
    seedProfile()
    render(<App />)
    expect(screen.getByRole('button', { name: '🏠 Accueil' })).toHaveAttribute('aria-selected', 'true')
    for (const mot of ['oui', 'non', 'stop', 'encore', 'moi', 'vouloir']) {
      expect(screen.getByRole('button', { name: mot })).toBeInTheDocument()
    }
  })

  it('ouvre une page par sa case de navigation, sans rien ajouter à la phrase', async () => {
    seedProfile()
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Ouvrir la page Lieux' }))

    expect(screen.getByRole('button', { name: 'Lieux' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: 'école' })).toBeInTheDocument()
    expect(screen.getByText('Sélectionne des pictogrammes...')).toBeInTheDocument()
  })

  it('ouvre aussi les favoris, qui ne sont pas une page du tableau', async () => {
    seedProfile()
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Ouvrir la page Favoris' }))
    expect(screen.getByText('Aucun favori pour le moment')).toBeInTheDocument()
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

describe('App — mode modélisation', () => {
  const modelisation = () => screen.getByRole('button', { name: 'Mode modélisation' })

  it('dit le mot touché sans l’ajouter à la phrase de l’enfant', async () => {
    seedProfile()
    const user = userEvent.setup()
    render(<App />)

    await user.click(modelisation())
    expect(modelisation()).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'manger' }))
    expect(parle).toHaveBeenCalledWith('manger', expect.anything())
    expect(screen.queryByRole('button', { name: 'Retirer manger' })).not.toBeInTheDocument()
  })

  it('laisse intacte la phrase que l’enfant avait commencée', async () => {
    seedProfile()
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'manger' }))
    await user.click(modelisation())
    await user.click(screen.getByRole('button', { name: 'boire' }))

    expect(screen.getByRole('button', { name: 'Retirer manger' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retirer boire' })).not.toBeInTheDocument()
  })

  it('rend à l’enfant une grille qui compose, une fois le mode quitté', async () => {
    seedProfile()
    const user = userEvent.setup()
    render(<App />)

    await user.click(modelisation())
    await user.click(modelisation())
    await user.click(screen.getByRole('button', { name: 'manger' }))

    expect(screen.getByRole('button', { name: 'Retirer manger' })).toBeInTheDocument()
  })

  it('laisse les cases de navigation montrer le chemin', async () => {
    // L'adulte montre aussi où se trouve un mot : ouvrir la page en fait partie.
    seedProfile()
    const user = userEvent.setup()
    render(<App />)

    await user.click(modelisation())
    await user.click(screen.getByRole('button', { name: 'Ouvrir la page Lieux' }))
    expect(screen.getByRole('button', { name: 'école' })).toBeInTheDocument()
  })

  it('demande le code pour entrer, pas pour sortir', async () => {
    // Entrer par mégarde priverait l'enfant de sa phrase ; sortir par mégarde
    // ne fait que lui rendre sa grille.
    seedProfile('4321')
    const user = userEvent.setup()
    render(<App />)

    await user.click(modelisation())
    expect(screen.getByRole('heading', { name: /Code parent/ })).toBeInTheDocument()
    expect(modelisation()).toHaveAttribute('aria-pressed', 'false')

    for (const chiffre of '4321') {
      await user.click(screen.getByRole('button', { name: chiffre }))
    }
    expect(modelisation()).toHaveAttribute('aria-pressed', 'true')

    await user.click(modelisation())
    expect(modelisation()).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('heading', { name: /Code parent/ })).not.toBeInTheDocument()
  })

  it('s’arrête quand l’adulte reverrouille la tablette', async () => {
    seedProfile('4321')
    const user = userEvent.setup()
    render(<App />)

    await user.click(modelisation())
    for (const chiffre of '4321') {
      await user.click(screen.getByRole('button', { name: chiffre }))
    }
    await user.click(screen.getByRole('button', { name: 'Paramètres' }))
    await user.click(screen.getByRole('button', { name: /Parent$/ }))
    await user.click(screen.getByRole('button', { name: 'Verrouiller maintenant' }))

    expect(modelisation()).toHaveAttribute('aria-pressed', 'false')
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

  /**
   * Position de chaque case de la grille, un libellé ou `null` pour un trou.
   *
   * Le libellé est lu sur le **premier bouton** de la case : une carte de mot
   * enveloppe son bouton dans un conteneur (l'étoile en est le frère), si bien
   * que lire l'attribut sur l'enfant direct de la grille renvoyait `null`
   * partout — et le test comparait deux listes de trous.
   */
  function dispositionDe(container: HTMLElement): (string | null)[] {
    const grille = container.querySelector('.picto-grid')!
    return [...grille.children].map((c) => {
      const bouton = c.matches('button') ? c : c.querySelector('button')
      return bouton?.getAttribute('aria-label') ?? null
    })
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
    // Sans cela, masquer « oui » remontait « non » à sa place, et tout le
    // reste d'un cran : l'enfant perdait les repères moteurs qu'il avait
    // construits. Adresse écrite en clair : première case de l'accueil.
    const { container, unmount } = monterAvec(makeProfile())
    const avant = dispositionDe(container)
    unmount()

    const { container: apres } = monterAvec(makeProfile({ slotsMasques: ['accueil#0'] }))
    const dispo = dispositionDe(apres)

    expect(avant[0]).toBe('oui')
    expect(screen.queryByRole('button', { name: 'oui' })).not.toBeInTheDocument()
    // La case de « oui » est vide ; toutes les autres sont inchangées.
    expect(dispo[0]).toBeNull()
    expect(dispo.slice(1)).toEqual(avant.slice(1))
    expect(dispo[1]).toBe('non')
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
