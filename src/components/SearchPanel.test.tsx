import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderHook } from '@testing-library/react'
import SearchPanel from './SearchPanel'
import { usePictograms } from '../hooks/usePictograms'
import { makeProfile, makeMotPerso } from '../test/factories'

/** Branche le panneau sur la vraie recherche, pour éprouver les deux ensemble. */
function monter(profil = makeProfile()) {
  const { result } = renderHook(() => usePictograms(profil))
  const onSelect = vi.fn()
  const onClose = vi.fn()
  render(
    <SearchPanel
      onSearch={result.current.searchPictograms}
      onSelect={onSelect}
      onClose={onClose}
      modeCouleur="grammatical"
    />,
  )
  return { onSelect, onClose, user: userEvent.setup() }
}

describe('SearchPanel', () => {
  it('ne propose rien tant que rien n’est tapé', () => {
    monter()
    expect(screen.getByText(/Tapez le début d'un mot/)).toBeInTheDocument()
  })

  it('retrouve un mot quelle que soit sa catégorie', async () => {
    const { user } = monter()
    await user.type(screen.getByLabelText('Mot à chercher'), 'mang')
    expect(screen.getByRole('button', { name: 'manger' })).toBeInTheDocument()
  })

  it('ignore les accents, qu’un adulte pressé ne tape pas', async () => {
    const { user } = monter()
    await user.type(screen.getByLabelText('Mot à chercher'), 'fatigue')
    expect(screen.getByRole('button', { name: 'fatigué' })).toBeInTheDocument()
  })

  it('trouve aussi les pictogrammes personnalisés', async () => {
    const { user } = monter(
      makeProfile({
        lexiquePerso: [makeMotPerso({ id: 'c1', mot: 'Mamie' })],
        placements: { 'personnes#5': 'c1' },
      }),
    )
    await user.type(screen.getByLabelText('Mot à chercher'), 'mami')
    expect(screen.getByRole('button', { name: 'Mamie' })).toBeInTheDocument()
  })

  it('n’exhume pas un pictogramme masqué par le parent', async () => {
    // Un mot écarté ne doit ressurgir par aucun chemin, la recherche comprise.
    const { user } = monter(makeProfile({ slotsMasques: ['besoins#0'] }))
    await user.type(screen.getByLabelText('Mot à chercher'), 'manger')
    expect(screen.queryByRole('button', { name: 'manger' })).not.toBeInTheDocument()
    expect(screen.getByText(/Aucun pictogramme/)).toBeInTheDocument()
  })

  it('envoie le mot choisi dans la phrase et referme', async () => {
    const { onSelect, onClose, user } = monter()
    await user.type(screen.getByLabelText('Mot à chercher'), 'boire')
    await user.click(screen.getByRole('button', { name: 'boire' }))

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ word: 'boire' }))
    expect(onClose).toHaveBeenCalled()
  })
})
