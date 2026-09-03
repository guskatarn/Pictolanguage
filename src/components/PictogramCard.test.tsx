import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PictogramCard from './PictogramCard'
import { PictogramItem } from '../types'

const picto: PictogramItem = {
  key: 'besoins-6456',
  word: 'manger',
  arasaacId: 6456,
  imageUrl: '/pictograms/6456.png',
  isCustom: false,
  isFavorite: false,
}

function setup(overrides: Partial<PictogramItem> = {}) {
  const onClick = vi.fn()
  const onToggleFavorite = vi.fn()
  render(
    <PictogramCard
      picto={{ ...picto, ...overrides }}
      size="M"
      bgColor="#FEF3C7"
      borderColor="#F59E0B"
      onClick={onClick}
      onToggleFavorite={onToggleFavorite}
    />,
  )
  return { onClick, onToggleFavorite, user: userEvent.setup() }
}

describe('PictogramCard — étoile de favori', () => {
  it('propose d’ajouter aux favoris quand le pictogramme n’en est pas un', () => {
    setup()
    const star = screen.getByRole('button', { name: /Ajouter manger aux favoris/i })
    expect(star).toHaveAttribute('aria-pressed', 'false')
  })

  it('propose de retirer des favoris quand il en est un', () => {
    setup({ isFavorite: true })
    const star = screen.getByRole('button', { name: /Retirer manger des favoris/i })
    expect(star).toHaveAttribute('aria-pressed', 'true')
  })

  it('bascule le favori sans envoyer le mot dans la phrase', async () => {
    const { onClick, onToggleFavorite, user } = setup()
    await user.click(screen.getByRole('button', { name: /aux favoris/i }))

    expect(onToggleFavorite).toHaveBeenCalledWith(expect.objectContaining({ word: 'manger' }))
    // L'étoile ne doit pas déclencher aussi la sélection du pictogramme.
    expect(onClick).not.toHaveBeenCalled()
  })

  it('envoie le mot dans la phrase quand on touche la carte', async () => {
    const { onClick, onToggleFavorite, user } = setup()
    await user.click(screen.getByRole('button', { name: 'manger' }))

    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ word: 'manger' }))
    expect(onToggleFavorite).not.toHaveBeenCalled()
  })

  it('garde l’étoile hors du bouton principal', () => {
    setup()
    const card = screen.getByRole('button', { name: 'manger' })
    // Un bouton imbriqué dans un bouton est invalide et se comporte mal au
    // clavier : l'étoile doit rester un frère de la carte.
    expect(card.querySelector('button')).toBeNull()
  })
})
