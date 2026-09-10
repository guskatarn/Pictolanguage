import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PictogramCard from './PictogramCard'
import { PictogramItem, ProfileSettings } from '../types'
import { PALETTE_FITZGERALD, PALETTE_NEUTRE } from '../data/classesGrammaticales'

const picto: PictogramItem = {
  key: 'besoins-6456',
  word: 'manger',
  arasaacId: 6456,
  imageUrl: '/pictograms/6456.png',
  isCustom: false,
  isFavorite: false,
  categoryId: 'besoins',
  classeGrammaticale: 'verbe',
}

function setup(
  overrides: Partial<PictogramItem> = {},
  modeCouleur: ProfileSettings['modeCouleur'] = 'grammatical',
) {
  const onClick = vi.fn()
  const onToggleFavorite = vi.fn()
  const { unmount } = render(
    <PictogramCard
      picto={{ ...picto, ...overrides }}
      size="M"
      modeCouleur={modeCouleur}
      onClick={onClick}
      onToggleFavorite={onToggleFavorite}
    />,
  )
  return { onClick, onToggleFavorite, unmount, user: userEvent.setup() }
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

describe('PictogramCard — couleurs', () => {
  it('colore selon la classe grammaticale en codage Fitzgerald', () => {
    setup()
    expect(screen.getByRole('button', { name: 'manger' })).toHaveStyle({
      backgroundColor: PALETTE_FITZGERALD.verbe.fond,
    })
  })

  it('colore selon le thème quand le parent a choisi ce mode', () => {
    setup({}, 'thematique')
    expect(screen.getByRole('button', { name: 'manger' })).toHaveStyle({
      backgroundColor: '#FEF3C7',
    })
  })

  /**
   * L'invariant, dans les deux modes : la couleur vient d'une propriété du
   * **pictogramme**, jamais de la page affichée. C'est ce qui manquait quand
   * l'onglet Favoris repeignait toute la grille en jaune, et un même mot
   * changeait de couleur selon l'endroit où l'enfant le regardait.
   */
  it('ne dépend d’aucune page : deux mots de classes différentes se distinguent', () => {
    const { unmount } = setup()
    const verbe = screen.getByRole('button', { name: 'manger' }).style.backgroundColor
    unmount()

    setup({ word: 'pomme', classeGrammaticale: 'nom' })
    const nom = screen.getByRole('button', { name: 'pomme' }).style.backgroundColor
    expect(nom).not.toBe(verbe)
  })

  it('écrit le mot dans le ton foncé de sa classe, pas dans sa couleur de bordure', () => {
    // La couleur de bordure sur le fond clair donnait de 1,8 à 4,4:1 de
    // contraste, sous le minimum de 4,5:1. Le ton foncé est le seul lisible ;
    // `classesGrammaticales.test.ts` mesure chaque paire de la palette.
    setup()
    expect(screen.getByText('manger')).toHaveStyle({ color: PALETTE_FITZGERALD.verbe.texte })
  })

  it('retombe sur le neutre pour un mot ajouté par un parent, sans classe', () => {
    setup({ classeGrammaticale: undefined, isCustom: true })
    expect(screen.getByRole('button', { name: 'manger' })).toHaveStyle({
      backgroundColor: PALETTE_NEUTRE.fond,
    })
  })
})
