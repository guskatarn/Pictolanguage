import { describe, it, expect } from 'vitest'
import {
  LIBELLES_CLASSES,
  PALETTE_FITZGERALD,
  PALETTE_NAVIGATION,
  PALETTE_NEUTRE,
  Palette,
  getStyleCase,
  getStyleNavigation,
} from './classesGrammaticales'
import { ClasseGrammaticale } from '../types'

/** Luminance relative d'une couleur `#rrggbb`, au sens WCAG 2.1. */
function luminance(hex: string): number {
  const canaux = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, v, b] = canaux.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * v + 0.0722 * b
}

/** Rapport de contraste WCAG entre deux couleurs, de 1:1 à 21:1. */
function contraste(a: string, b: string): number {
  const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (clair + 0.05) / (sombre + 0.05)
}

const PALETTES: [string, Palette][] = [
  ...Object.entries(PALETTE_FITZGERALD),
  ['neutre', PALETTE_NEUTRE],
  ['navigation', PALETTE_NAVIGATION],
]

describe('mesure de contraste', () => {
  it('retrouve les rapports de référence', () => {
    // Garde-fou de l'outil de mesure lui-même : sans lui, une formule fausse
    // ferait passer toute la palette en silence.
    expect(contraste('#FFFFFF', '#000000')).toBeCloseTo(21, 1)
    expect(contraste('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5)
  })
})

describe('palette grammaticale', () => {
  /**
   * 4,5:1 est le minimum WCAG AA pour du texte. Le projet a déjà livré des
   * libellés entre 1,8 et 4,4:1 pour avoir écrit le texte dans la couleur de
   * bordure : cette mesure est là pour que la faute ne puisse pas revenir.
   */
  it.each(PALETTES)('écrit le libellé de %s lisiblement sur son fond', (_nom, palette) => {
    expect(contraste(palette.texte, palette.fond)).toBeGreaterThanOrEqual(4.5)
  })

  /** 3:1, minimum WCAG pour un élément d'interface non textuel. */
  it.each(PALETTES)('détache la bordure de %s de son fond', (_nom, palette) => {
    expect(contraste(palette.bordure, palette.fond)).toBeGreaterThanOrEqual(3)
  })

  it.each(PALETTES)('détache le fond de %s du fond de l’application', (_nom, palette) => {
    // La grille est posée sur #f9fafb : une case dont le fond s'y confondrait
    // ne se lirait plus comme une case.
    expect(contraste(palette.fond, '#f9fafb')).toBeGreaterThanOrEqual(1.03)
  })

  it('donne une couleur et un libellé à chaque classe, sans en oublier', () => {
    const classes = Object.keys(PALETTE_FITZGERALD) as ClasseGrammaticale[]
    expect(Object.keys(LIBELLES_CLASSES).sort()).toEqual([...classes].sort())
  })

  it('distingue les classes par leur fond, sans jamais réemployer le même', () => {
    const fonds = Object.values(PALETTE_FITZGERALD).map((p) => p.fond)
    expect(new Set(fonds).size).toBe(fonds.length)
  })
})

describe('getStyleCase', () => {
  it('applique la couleur grammaticale, indépendamment du thème', () => {
    const style = getStyleCase({ classeGrammaticale: 'verbe', categoryId: 'aliments' }, 'grammatical')
    expect(style.bgColor).toBe(PALETTE_FITZGERALD.verbe.fond)
  })

  it('applique la couleur thématique quand le parent a choisi ce mode', () => {
    const style = getStyleCase({ classeGrammaticale: 'verbe', categoryId: 'aliments' }, 'thematique')
    expect(style.bgColor).toBe('#DCFCE7')
    expect(style.borderColor).toBe('#22C55E')
  })

  /**
   * Un mot ajouté par un parent n'a pas de classe fiable. Le teinter au hasard
   * lui donnerait un sens grammatical faux, ce qui vaut moins que pas de
   * couleur du tout dans un codage dont l'enfant apprend la signification.
   */
  it('retombe sur le neutre pour un mot sans classe grammaticale', () => {
    const style = getStyleCase({ categoryId: 'besoins' }, 'grammatical')
    expect(style.bgColor).toBe(PALETTE_NEUTRE.fond)
  })
})

describe('getStyleNavigation', () => {
  it('ne prête jamais à une case de navigation la couleur d’une classe', () => {
    // La page Actions est orange : en mode grammatical, sa case se lirait
    // comme un nom.
    const fonds = new Set(Object.values(PALETTE_FITZGERALD).map((p) => p.fond))
    expect(fonds.has(getStyleNavigation('actions', 'grammatical').bgColor)).toBe(false)
    expect(getStyleNavigation('actions', 'grammatical').bgColor).not.toBe(PALETTE_NEUTRE.fond)
  })

  it('reprend la couleur de la page visée en mode thématique', () => {
    expect(getStyleNavigation('aliments', 'thematique').bgColor).toBe('#DCFCE7')
  })
})
