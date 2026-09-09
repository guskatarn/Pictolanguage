import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { makeProfile } from './test/factories'

/**
 * Amorce l'application avec un profil actif : sans cela, `App` n'affiche que le
 * sélecteur de profils et rien de la grille n'est atteignable.
 */
function seedProfile(parentPin: string | null = null) {
  const profile = makeProfile({ categoryOrder: ['besoins', 'emotions'] })
  localStorage.setItem(
    'pictoapp-data',
    JSON.stringify({ profiles: [profile], activeProfileId: profile.id, parentPin }),
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
  it("garde la couleur de la catégorie d'origine dans l'onglet Favoris", async () => {
    // La couleur venait de l'onglet affiché : l'onglet Favoris repeignait donc
    // toute la grille en jaune, et un même mot changeait de couleur selon
    // l'endroit où l'enfant le regardait.
    const profile = makeProfile({ favorites: [6456] })
    localStorage.setItem(
      'pictoapp-data',
      JSON.stringify({ profiles: [profile], activeProfileId: profile.id, parentPin: null }),
    )
    const user = userEvent.setup()
    render(<App />)

    const dansBesoins = screen.getByRole('button', { name: 'manger' })
    expect(dansBesoins).toHaveStyle({ backgroundColor: '#FEF3C7' })

    await user.click(screen.getByRole('button', { name: /Favoris/ }))
    const dansFavoris = screen.getByRole('button', { name: 'manger' })
    expect(dansFavoris).toHaveStyle({ backgroundColor: '#FEF3C7' })
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
