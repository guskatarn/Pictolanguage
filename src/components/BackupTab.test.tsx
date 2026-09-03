import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BackupTab from './BackupTab'
import { STORAGE_BUDGET_BYTES } from '../utils/storage'
import { ImportOutcome } from '../hooks/useProfiles'

const ok: ImportOutcome = { ok: true, message: '1 profil ajouté.' }
const ko: ImportOutcome = { ok: false, message: "Ce fichier ne vient pas de PictoLanguage." }

function setup(usedBytes = 9 * 1024, outcome: ImportOutcome = ok) {
  const onExport = vi.fn()
  const onImport = vi.fn(() => outcome)
  render(<BackupTab usedBytes={usedBytes} onExport={onExport} onImport={onImport} />)
  return { onExport, onImport, user: userEvent.setup() }
}

const backupFile = () =>
  new File([JSON.stringify({ app: 'pictolanguage', version: 1, data: {} })], 'sauvegarde.json', {
    type: 'application/json',
  })

/** Le champ fichier est masqué : on l'atteint par son type, pas par un rôle. */
const fileInput = () =>
  document.querySelector<HTMLInputElement>('input[accept="application/json,.json"]')!

describe('BackupTab — jauge', () => {
  it('affiche l’espace utilisé', () => {
    setup(9 * 1024)
    expect(screen.getByText(/9 Ko/)).toBeInTheDocument()
  })

  it('alerte quand le stockage est presque plein', () => {
    setup(Math.round(STORAGE_BUDGET_BYTES * 0.9))
    expect(screen.getByText(/presque saturé/i)).toBeInTheDocument()
  })

  it('reste discret quand il y a de la place', () => {
    setup(9 * 1024)
    expect(screen.queryByText(/presque saturé/i)).not.toBeInTheDocument()
  })
})

describe('BackupTab — export', () => {
  it('déclenche l’export au clic', async () => {
    const { onExport, user } = setup()
    await user.click(screen.getByRole('button', { name: /Exporter mes données/i }))
    expect(onExport).toHaveBeenCalledOnce()
  })
})

describe('BackupTab — import', () => {
  it('ne propose les deux modes qu’après le choix d’un fichier', async () => {
    const { user } = setup()
    expect(screen.queryByRole('button', { name: /Ajouter les profils manquants/i })).not.toBeInTheDocument()

    await user.upload(fileInput(), backupFile())

    expect(await screen.findByRole('button', { name: /Ajouter les profils manquants/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Remplacer toutes mes données/i })).toBeInTheDocument()
    expect(screen.getByText('sauvegarde.json')).toBeInTheDocument()
  })

  it('importe en mode merge sans rien demander', async () => {
    const { onImport, user } = setup()
    await user.upload(fileInput(), backupFile())
    await user.click(await screen.findByRole('button', { name: /Ajouter les profils manquants/i }))

    expect(onImport).toHaveBeenCalledWith(expect.stringContaining('pictolanguage'), 'merge')
    expect(screen.getByRole('status')).toHaveTextContent('1 profil ajouté.')
  })

  it('demande confirmation avant un remplacement, et renonce si elle est refusée', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { onImport, user } = setup()
    await user.upload(fileInput(), backupFile())
    await user.click(await screen.findByRole('button', { name: /Remplacer toutes mes données/i }))

    expect(confirm).toHaveBeenCalledOnce()
    // Un remplacement est destructeur : refuser la confirmation doit tout annuler.
    expect(onImport).not.toHaveBeenCalled()
  })

  it('procède au remplacement une fois la confirmation donnée', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { onImport, user } = setup()
    await user.upload(fileInput(), backupFile())
    await user.click(await screen.findByRole('button', { name: /Remplacer toutes mes données/i }))

    expect(onImport).toHaveBeenCalledWith(expect.any(String), 'replace')
  })

  it('affiche l’erreur et conserve le fichier choisi quand l’import échoue', async () => {
    const { user } = setup(9 * 1024, ko)
    await user.upload(fileInput(), backupFile())
    await user.click(await screen.findByRole('button', { name: /Ajouter les profils manquants/i }))

    expect(screen.getByRole('status')).toHaveTextContent(/ne vient pas de PictoLanguage/)
    // Le fichier reste sélectionné : l'utilisateur peut tenter l'autre mode.
    expect(screen.getByRole('button', { name: /Remplacer toutes mes données/i })).toBeInTheDocument()
  })

  it('referme le choix de fichier après un import réussi', async () => {
    const { user } = setup()
    await user.upload(fileInput(), backupFile())
    await user.click(await screen.findByRole('button', { name: /Ajouter les profils manquants/i }))

    expect(screen.queryByRole('button', { name: /Ajouter les profils manquants/i })).not.toBeInTheDocument()
  })
})
