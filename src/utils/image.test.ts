import { describe, it, expect } from 'vitest'
import { isStoredLocally } from './image'

/**
 * Le redimensionnement lui-même n'est pas testé ici : il repose sur un canvas
 * 2D et sur l'encodeur WebP du navigateur, que jsdom n'implémente pas. Le
 * simuler ne vérifierait que le simulacre. Ce chemin est couvert par le
 * scénario navigateur (Chrome headless), qui mesure la taille réellement
 * obtenue à partir d'une image lourde.
 */
describe('isStoredLocally', () => {
  it('reconnaît une image embarquée dans les données', () => {
    expect(isStoredLocally('data:image/webp;base64,UklGRg==')).toBe(true)
  })

  it.each([
    'https://static.arasaac.org/pictograms/2462/2462_300.png',
    '/pictograms/2462.png',
    'blob:http://localhost/abcd',
  ])('considère %s comme dépendant encore d’une ressource externe', (url) => {
    expect(isStoredLocally(url)).toBe(false)
  })
})
