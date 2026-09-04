import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryTabs from './CategoryTabs'
import { DEFAULT_CATEGORIES, FAVORITES_CATEGORY } from '../data/defaultCategories'

function setup() {
  const onSelect = vi.fn()
  const { container } = render(
    <CategoryTabs
      categories={[FAVORITES_CATEGORY, ...DEFAULT_CATEGORIES]}
      activeId={DEFAULT_CATEGORIES[0].id}
      onSelect={onSelect}
    />,
  )
  return { onSelect, container, user: userEvent.setup() }
}

describe('CategoryTabs', () => {
  it('signale la catégorie active et remonte la sélection', async () => {
    const { onSelect, user } = setup()
    const actif = screen.getByRole('button', { name: DEFAULT_CATEGORIES[0].name })
    expect(actif).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('button', { name: DEFAULT_CATEGORIES[1].name }))
    expect(onSelect).toHaveBeenCalledWith(DEFAULT_CATEGORIES[1].id)
  })

  it('porte la classe sur laquelle repose la bascule paysage', () => {
    // En paysage, index.css transforme cette rangée en colonne à gauche pour
    // rendre de la hauteur à la grille. La règle cible `.category-tabs` : sans
    // cette classe, la mise en page paysage redevient silencieusement un
    // empilement, sans qu'aucun test ne le remarque.
    const { container } = setup()
    expect(container.querySelector('.category-tabs')).not.toBeNull()
  })
})
