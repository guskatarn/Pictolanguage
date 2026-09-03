import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryManager from './CategoryManager'
import { DEFAULT_CATEGORIES } from '../data/defaultCategories'
import { makeProfile, makeCustomPictogram } from '../test/factories'
import { UserProfile } from '../types'

const MANGER = 6456

function setup(profile: UserProfile = makeProfile({ categoryOrder: ['besoins', 'emotions'] })) {
  const onReorderCategories = vi.fn()
  const onToggleHide = vi.fn()
  const onToggleHideCustom = vi.fn()
  render(
    <CategoryManager
      profile={profile}
      categories={DEFAULT_CATEGORIES}
      onReorderCategories={onReorderCategories}
      onToggleHide={onToggleHide}
      onToggleHideCustom={onToggleHideCustom}
    />,
  )
  return { onReorderCategories, onToggleHide, onToggleHideCustom, user: userEvent.setup() }
}

describe('CategoryManager — ordre des catégories', () => {
  it('interdit de monter la première catégorie', () => {
    setup()
    expect(screen.getByRole('button', { name: /Monter Besoins/i })).toBeDisabled()
  })

  it('échange deux catégories', async () => {
    const { onReorderCategories, user } = setup()
    await user.click(screen.getByRole('button', { name: /Descendre Besoins/i }))
    expect(onReorderCategories).toHaveBeenCalledWith(['emotions', 'besoins'])
  })
})

describe('CategoryManager — pictogrammes affichés', () => {
  it('ne déplie la liste qu’à la demande', async () => {
    const { user } = setup()
    expect(screen.queryByLabelText('manger')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Gérer les pictogrammes de Besoins/i }))
    expect(screen.getByLabelText('manger')).toBeInTheDocument()
  })

  it('coche les pictogrammes visibles et décoche les masqués', async () => {
    const { user } = setup(
      makeProfile({ categoryOrder: ['besoins', 'emotions'], hidden: [MANGER] }),
    )
    await user.click(screen.getByRole('button', { name: /Gérer les pictogrammes de Besoins/i }))

    expect(screen.getByLabelText('manger')).not.toBeChecked()
    expect(screen.getByLabelText('boire')).toBeChecked()
  })

  it('signale le nombre de pictogrammes masqués sans déplier', () => {
    setup(makeProfile({ categoryOrder: ['besoins', 'emotions'], hidden: [MANGER] }))
    expect(screen.getByText('1 masqué')).toBeInTheDocument()
  })

  it('bascule la visibilité d’un pictogramme par défaut', async () => {
    const { onToggleHide, user } = setup()
    await user.click(screen.getByRole('button', { name: /Gérer les pictogrammes de Besoins/i }))
    await user.click(screen.getByLabelText('manger'))
    expect(onToggleHide).toHaveBeenCalledWith(MANGER)
  })

  it('bascule la visibilité d’un pictogramme personnalisé', async () => {
    const custom = makeCustomPictogram({ id: 'c1', word: 'Maman', categoryId: 'besoins' })
    const { onToggleHideCustom, user } = setup(
      makeProfile({ categoryOrder: ['besoins', 'emotions'], customPictograms: [custom] }),
    )
    await user.click(screen.getByRole('button', { name: /Gérer les pictogrammes de Besoins/i }))
    await user.click(screen.getByLabelText(/Maman/))
    expect(onToggleHideCustom).toHaveBeenCalledWith('c1')
  })

  it('ne déplie qu’une catégorie à la fois', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /Gérer les pictogrammes de Besoins/i }))
    await user.click(screen.getByRole('button', { name: /Gérer les pictogrammes de Émotions/i }))

    expect(screen.queryByLabelText('manger')).not.toBeInTheDocument()
    expect(screen.getByLabelText('content')).toBeInTheDocument()
  })
})
