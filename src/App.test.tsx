import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { makeProfile } from './test/factories'

/**
 * Amorce l'application avec un profil actif : sans cela, `App` n'affiche que le
 * sélecteur de profils et rien de la grille n'est atteignable.
 */
function seedProfile() {
  const profile = makeProfile({ categoryOrder: ['besoins', 'emotions'] })
  localStorage.setItem(
    'pictoapp-data',
    JSON.stringify({ profiles: [profile], activeProfileId: profile.id }),
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
      JSON.stringify({ profiles: [profile], activeProfileId: profile.id }),
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
