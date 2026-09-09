import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ParentGate from './ParentGate'

async function taper(user: ReturnType<typeof userEvent.setup>, code: string) {
  for (const chiffre of code) {
    await user.click(screen.getByRole('button', { name: chiffre }))
  }
}

describe('ParentGate — vérification du code', () => {
  it('laisse passer le bon code', async () => {
    const onSuccess = vi.fn()
    const user = userEvent.setup()
    render(
      <ParentGate mode="verification" codeAttendu="1234" onSuccess={onSuccess} onCancel={vi.fn()} />,
    )

    await taper(user, '1234')
    expect(onSuccess).toHaveBeenCalled()
  })

  it('refuse un code faux et repart de zéro', async () => {
    const onSuccess = vi.fn()
    const user = userEvent.setup()
    render(
      <ParentGate mode="verification" codeAttendu="1234" onSuccess={onSuccess} onCancel={vi.fn()} />,
    )

    await taper(user, '1235')
    expect(onSuccess).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/incorrect/i)

    // La saisie doit être vidée : sinon les chiffres suivants s'ajouteraient
    // aux précédents et plus aucun code ne pourrait être composé.
    await taper(user, '1234')
    expect(onSuccess).toHaveBeenCalled()
  })
})

describe('ParentGate — code oublié', () => {
  it('remplace le code après une question de calcul, sans toucher aux données', async () => {
    // Sans cette issue, un parent qui oublie son code se retrouverait enfermé
    // hors de ses propres données : l'export vit lui aussi derrière le verrou.
    const onPinChange = vi.fn()
    const onSuccess = vi.fn()
    const user = userEvent.setup()
    render(
      <ParentGate
        mode="verification"
        codeAttendu="1234"
        onSuccess={onSuccess}
        onCancel={vi.fn()}
        onPinChange={onPinChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Code oublié/i }))
    const question = screen.getByText(/×/).textContent ?? ''
    const [a, b] = question.match(/\d+/g)!.map(Number)

    await user.type(screen.getByLabelText('Résultat'), String(a * b))
    await user.click(screen.getByRole('button', { name: 'Valider' }))

    await taper(user, '9876')
    await taper(user, '9876')
    expect(onPinChange).toHaveBeenCalledWith('9876')
    expect(onSuccess).toHaveBeenCalled()
  })

  it('ne laisse pas passer une mauvaise réponse', async () => {
    const user = userEvent.setup()
    render(
      <ParentGate mode="verification" codeAttendu="1234" onSuccess={vi.fn()} onCancel={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: /Code oublié/i }))
    await user.type(screen.getByLabelText('Résultat'), '2')
    await user.click(screen.getByRole('button', { name: 'Valider' }))

    expect(screen.getByRole('alert')).toHaveTextContent(/bon résultat/i)
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument()
  })
})

describe('ParentGate — création', () => {
  it('exige deux saisies identiques', async () => {
    // Un chiffre à côté sur une saisie unique enfermerait le parent dehors dès
    // le lancement suivant.
    const onPinChange = vi.fn()
    const user = userEvent.setup()
    render(
      <ParentGate
        mode="creation"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        onPinChange={onPinChange}
      />,
    )

    await taper(user, '1111')
    await taper(user, '2222')
    expect(onPinChange).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/ne correspondent pas/i)

    await taper(user, '3333')
    await taper(user, '3333')
    expect(onPinChange).toHaveBeenCalledWith('3333')
  })
})
