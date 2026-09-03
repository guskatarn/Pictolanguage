import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundary from './ErrorBoundary'
import { saveData } from '../utils/storage'
import { StoredData } from '../types'
import { makeProfile } from '../test/factories'

/** React journalise l'erreur rattrapée : on garde la sortie de test lisible. */
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

function Boom({ shouldThrow }: { shouldThrow: boolean }): React.ReactElement {
  if (shouldThrow) throw new Error('Rendu impossible : pictogramme introuvable')
  return <p>Contenu normal</p>
}

describe('ErrorBoundary', () => {
  it('laisse passer ses enfants quand tout va bien', () => {
    render(
      <ErrorBoundary>
        <Boom shouldThrow={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Contenu normal')).toBeInTheDocument()
  })

  it('remplace l’écran blanc par un message rassurant', () => {
    render(
      <ErrorBoundary>
        <Boom shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText(/rencontré un souci/i)).toBeInTheDocument()
    // Le message doit rassurer sur les données avant toute considération technique.
    expect(screen.getByText(/Rien n['’]est perdu/i)).toBeInTheDocument()
  })

  it('relègue le détail technique derrière un dépliant', () => {
    render(
      <ErrorBoundary>
        <Boom shouldThrow />
      </ErrorBoundary>,
    )
    const details = screen.getByText('Détail technique').closest('details')
    expect(details).not.toBeNull()
    expect(details!.open).toBe(false)
    expect(details!.textContent).toContain('pictogramme introuvable')
  })

  it('« Réessayer » retente le rendu', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <ErrorBoundary>
        <Boom shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText(/rencontré un souci/i)).toBeInTheDocument()

    // L'enfant cesse d'échouer (cause transitoire) avant que l'on réessaie.
    rerender(
      <ErrorBoundary>
        <Boom shouldThrow={false} />
      </ErrorBoundary>,
    )
    await user.click(screen.getByRole('button', { name: /Réessayer/i }))

    expect(screen.getByText('Contenu normal')).toBeInTheDocument()
  })

  it('permet de récupérer ses données alors que le reste de l’application est inaccessible', async () => {
    const stored: StoredData = { profiles: [makeProfile()], activeProfileId: 'p1' }
    saveData(stored)

    const parts: string[] = []
    class RecordingBlob {
      constructor(chunks: string[]) {
        parts.push(chunks.join(''))
      }
    }
    vi.stubGlobal('Blob', RecordingBlob)
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:fake', revokeObjectURL: () => {} })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const user = userEvent.setup()
    render(
      <ErrorBoundary>
        <Boom shouldThrow />
      </ErrorBoundary>,
    )
    await user.click(screen.getByRole('button', { name: /Enregistrer une sauvegarde/i }))

    expect(click).toHaveBeenCalledOnce()
    expect(JSON.parse(parts[0]).data.profiles[0].name).toBe('Lina')

    vi.unstubAllGlobals()
  })
})
