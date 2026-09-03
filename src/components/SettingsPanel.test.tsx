import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPanel from './SettingsPanel'
import { DEFAULT_CATEGORIES, FAVORITES_CATEGORY, FAVORITES_CATEGORY_ID } from '../data/defaultCategories'
import { makeProfile } from '../test/factories'
import { Category } from '../types'

// jsdom n'implémente pas le canvas 2D dont dépend le rapatriement d'image.
// Seule compte ici la catégorie transmise, pas l'encodage.
vi.mock('../utils/image', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/image')>()),
  remoteImageToStoredImage: vi.fn(async () => 'data:image/webp;base64,AAAA'),
}))

const RESULTAT = { arasaacId: 2462, word: 'chien', imageUrl: 'https://static.arasaac.org/pictograms/2462/2462_500.png' }

function setup(categories: Category[]) {
  // Les paramètres sont typés et utilisés : le vrai callback renvoie si
  // l'enregistrement a réussi, et le test inspecte la catégorie transmise.
  const onAddCustomPictogram = vi.fn(
    (word: string, imageUrl: string, categoryId: string) =>
      Boolean(word && imageUrl && categoryId),
  )
  render(
    <SettingsPanel
      profile={makeProfile()}
      categories={categories}
      onClose={() => {}}
      onUpdateSettings={() => {}}
      onReorderCategories={() => {}}
      onAddCustomPictogram={onAddCustomPictogram}
      onRemoveCustomPictogram={() => {}}
      onToggleHide={() => {}}
      onToggleHideCustom={() => {}}
      searchArasaac={async () => [RESULTAT]}
      usedBytes={0}
      onExportData={() => {}}
      onImportData={() => ({ ok: true, message: '' })}
    />,
  )
  return { onAddCustomPictogram, user: userEvent.setup() }
}

/** Reproduit le parcours réel : onglet Ajouter → recherche → choix d'un résultat. */
async function choisirUnResultatArasaac(user: ReturnType<typeof setup>['user']) {
  await user.click(screen.getByRole('button', { name: /Ajouter/i }))
  await user.type(screen.getByPlaceholderText(/Ex:/), 'chien')
  await user.click(screen.getByRole('button', { name: 'OK' }))
  await user.click(await screen.findByRole('button', { name: /chien/i }))
  return document.querySelector('select') as HTMLSelectElement
}

describe('SettingsPanel — catégorie de destination d’un pictogramme ajouté', () => {
  it('ne propose pas « Favoris » comme destination, même si on la lui passe', async () => {
    // Régression : « Favoris » est une vue, pas une catégorie de rangement. Un
    // pictogramme qui y atterrit n'apparaît dans aucune grille — ni dans les
    // catégories, ni dans les favoris, où il n'a pas été ajouté.
    const { user } = setup([FAVORITES_CATEGORY, ...DEFAULT_CATEGORIES])
    const select = await choisirUnResultatArasaac(user)

    const valeurs = [...select.options].map((o) => o.value)
    expect(valeurs).not.toContain(FAVORITES_CATEGORY_ID)
    expect(select.value).not.toBe(FAVORITES_CATEGORY_ID)
  })

  it('présélectionne une catégorie réelle', async () => {
    const { user } = setup(DEFAULT_CATEGORIES)
    const select = await choisirUnResultatArasaac(user)
    expect(select.value).toBe(DEFAULT_CATEGORIES[0].id)
  })

  it('enregistre le pictogramme dans une catégorie qui existe vraiment', async () => {
    const { onAddCustomPictogram, user } = setup([FAVORITES_CATEGORY, ...DEFAULT_CATEGORIES])
    await choisirUnResultatArasaac(user)
    await user.click(screen.getByRole('button', { name: /Ajouter ce pictogramme/i }))

    expect(onAddCustomPictogram).toHaveBeenCalled()
    const categorieUtilisee = onAddCustomPictogram.mock.calls[0][2]
    expect(DEFAULT_CATEGORIES.map((c) => c.id)).toContain(categorieUtilisee)
  })
})
