import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { webcrypto } from 'node:crypto'

// jsdom n'expose pas `crypto.randomUUID`, dont dépend la création de profils.
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
}

// jsdom n'implémente pas `Blob.text()`, dont dépend la lecture d'un fichier de
// sauvegarde choisi par l'utilisateur. On le reconstruit sur FileReader.
if (typeof Blob !== 'undefined' && !Blob.prototype.text) {
  Blob.prototype.text = function (this: Blob) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsText(this)
    })
  }
}

// jsdom n'implémente pas `Element.scrollTo` : la grille est remontée en haut à
// chaque changement de catégorie, ce qui faisait échouer tout test cliquant sur
// un onglet. Une fonction vide suffit — il n'y a rien à faire défiler ici.
if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {}
}

beforeEach(() => {
  // Chaque test part d'un stockage vide : les modules lisent `localStorage` au
  // montage, une fuite d'état entre tests les rendrait dépendants de l'ordre.
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})
