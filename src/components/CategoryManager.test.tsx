import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryManager from './CategoryManager'
import { DEFAULT_CATEGORIES } from '../data/defaultCategories'
import { makeProfile, makeMotPerso } from '../test/factories'
import { UserProfile } from '../types'

/** Première case de la page « besoins » : « manger ». */
const MANGER = 'besoins#0'
/** Première case libre de la page, où atterrit un mot ajouté par le parent. */
const LIBRE = 'besoins#5'

function setup(profile: UserProfile = makeProfile({ ordrePages: ['besoins', 'emotions'] })) {
  const onReorderCategories = vi.fn()
  const onToggleHide = vi.fn()
  render(
    <CategoryManager
      profile={profile}
      categories={DEFAULT_CATEGORIES}
      onReorderCategories={onReorderCategories}
      onToggleHide={onToggleHide}
    />,
  )
  return { onReorderCategories, onToggleHide, user: userEvent.setup() }
}

describe('CategoryManager — ordre des pages', () => {
  it('interdit de monter la première page', () => {
    setup()
    expect(screen.getByRole('button', { name: /Monter Besoins/i })).toBeDisabled()
  })

  it('échange deux pages', async () => {
    const { onReorderCategories, user } = setup()
    await user.click(screen.getByRole('button', { name: /Descendre Besoins/i }))
    expect(onReorderCategories).toHaveBeenCalledWith(['emotions', 'besoins'])
  })

  it('liste l’accueil en tête, sans flèches pour le déplacer', () => {
    // Il reste le premier onglet quoi qu'il arrive, mais ses cases doivent
    // pouvoir être masquées comme les autres.
    setup()
    expect(screen.getByRole('button', { name: /Gérer les pictogrammes de Accueil/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Monter Accueil/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Descendre Accueil/i })).not.toBeInTheDocument()
  })
})

describe('CategoryManager — pictogrammes affichés', () => {
  it('ne déplie la liste qu’à la demande', async () => {
    const { user } = setup()
    expect(screen.queryByLabelText('manger')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Gérer les pictogrammes de Besoins/i }))
    expect(screen.getByLabelText('manger')).toBeInTheDocument()
  })

  it('coche les cases visibles et décoche les masquées', async () => {
    const { user } = setup(
      makeProfile({ ordrePages: ['besoins', 'emotions'], slotsMasques: [MANGER] }),
    )
    await user.click(screen.getByRole('button', { name: /Gérer les pictogrammes de Besoins/i }))

    expect(screen.getByLabelText('manger')).not.toBeChecked()
    expect(screen.getByLabelText('boire')).toBeChecked()
  })

  it('signale le nombre de cases masquées sans déplier', () => {
    setup(makeProfile({ ordrePages: ['besoins', 'emotions'], slotsMasques: [MANGER] }))
    expect(screen.getByText('1 masqué')).toBeInTheDocument()
  })

  /**
   * Le rappel remonte une **adresse de case**, pas un identifiant de mot.
   * C'est ce qui permet de vider une case précise sans faire disparaître le
   * même mot partout où il figure dans le tableau.
   */
  it('bascule la visibilité d’une case en remontant son adresse', async () => {
    const { onToggleHide, user } = setup()
    await user.click(screen.getByRole('button', { name: /Gérer les pictogrammes de Besoins/i }))
    await user.click(screen.getByLabelText('manger'))
    expect(onToggleHide).toHaveBeenCalledWith(MANGER)
  })

  it('bascule de même la visibilité d’un mot ajouté par le parent', async () => {
    const { onToggleHide, user } = setup(
      makeProfile({
        ordrePages: ['besoins', 'emotions'],
        lexiquePerso: [makeMotPerso({ id: 'c1', mot: 'Maman' })],
        placements: { [LIBRE]: 'c1' },
      }),
    )
    await user.click(screen.getByRole('button', { name: /Gérer les pictogrammes de Besoins/i }))
    await user.click(screen.getByLabelText(/Maman/))
    expect(onToggleHide).toHaveBeenCalledWith(LIBRE)
  })

  it('liste les cases dans l’ordre où elles sont posées sur la page', async () => {
    const { user } = setup(
      makeProfile({
        ordrePages: ['besoins'],
        lexiquePerso: [makeMotPerso({ id: 'c1', mot: 'Maman' })],
        placements: { [LIBRE]: 'c1' },
      }),
    )
    await user.click(screen.getByRole('button', { name: /Gérer les pictogrammes de Besoins/i }))

    const libelles = screen
      .getAllByRole('checkbox')
      .map((c) => c.closest('label')!.textContent!.replace('perso', '').trim())
    expect(libelles).toEqual(['manger', 'boire', 'toilettes', 'dormir', 'aide', 'Maman'])
  })

  it('ne déplie qu’une page à la fois', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /Gérer les pictogrammes de Besoins/i }))
    await user.click(screen.getByRole('button', { name: /Gérer les pictogrammes de Émotions/i }))

    expect(screen.queryByLabelText('manger')).not.toBeInTheDocument()
    expect(screen.getByLabelText('content')).toBeInTheDocument()
  })
})
