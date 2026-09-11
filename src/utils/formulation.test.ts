import { describe, it, expect } from 'vitest'
import { formuler, realiser } from './formulation'
import { makeMotPerso } from '../test/factories'
import { EntreeLexique, ProfileSettings } from '../types'

/** Compose une phrase à partir d'identifiants du lexique, comme la grille le ferait. */
function dire(
  ids: string,
  accord: ProfileSettings['accord'] = 'masculin',
  lexiquePerso: EntreeLexique[] = [],
): string {
  const mots = ids.split(' ').map((id) => ({ word: id, lexiqueId: id }))
  return formuler(mots, { accord, lexiquePerso })
}

/**
 * Exemples écrits en clair, de la suite de pictogrammes à la phrase entendue.
 * La liste se relit telle quelle avec une orthophoniste : chaque ligne est une
 * règle qu'elle peut valider ou contester.
 */
describe('formulation — phrases courantes', () => {
  it.each([
    ['moi vouloir manger', 'je veux manger'],
    ['moi vouloir pomme', 'je veux une pomme'],
    ['moi vouloir pain', 'je veux du pain'],
    ['moi vouloir eau', 'je veux de l’eau'],
    ['moi vouloir aide', 'je veux de l’aide'],
    ['moi dormir', 'je dors'],
    ['moi ecouter', 'j’écoute'],
    ['moi regarder tablette', 'je regarde la tablette'],
    ['moi donner biscuit', 'je donne un biscuit'],
    ['moi vouloir encore pomme', 'je veux encore une pomme'],
  ])('« %s » → « %s »', (ids, attendu) => {
    expect(dire(ids)).toBe(attendu.replace(/’/g, "'"))
  })
})

describe('formulation — être, avoir et les états', () => {
  it.each([
    ['moi content', 'je suis content'],
    ['moi fatigue', 'je suis fatigué'],
    // Participe employé seul : « j'ai fini », jamais « je suis fini ».
    ['moi fini', 'j’ai fini'],
    ['moi peur', 'j’ai peur'],
    ['moi colere', 'je suis en colère'],
  ])('« %s » → « %s »', (ids, attendu) => {
    expect(dire(ids)).toBe(attendu.replace(/’/g, "'"))
  })
})

describe('formulation — négation', () => {
  it.each([
    ['moi non vouloir manger', 'je ne veux pas manger'],
    // Où que l'enfant ait posé « non ».
    ['moi vouloir non manger', 'je ne veux pas manger'],
    ['moi non content', 'je ne suis pas content'],
    // Sous la négation, l'indéfini et le partitif se réduisent à « de ».
    ['moi non vouloir pain', 'je ne veux pas de pain'],
    ['moi non vouloir eau', 'je ne veux pas d’eau'],
    ['moi non aimer lait', 'je n’aime pas le lait'],
  ])('« %s » → « %s »', (ids, attendu) => {
    expect(dire(ids)).toBe(attendu.replace(/’/g, "'"))
  })

  it('laisse « non » tel quel quand il n’y a rien à nier', () => {
    expect(dire('non')).toBe('non')
    expect(dire('non manger')).toBe('non manger')
  })
})

describe('formulation — lieux et verbes d’appréciation', () => {
  it.each([
    ['moi aller parc', 'je vais au parc'],
    ['moi aller ecole', 'je vais à l’école'],
    ['moi vouloir aller toilettes', 'je veux aller aux toilettes'],
    ['moi aller maison', 'je vais à la maison'],
    // « aimer » prend le défini : « j'aime l'eau », pas « j'aime de l'eau ».
    ['moi aimer eau', 'j’aime l’eau'],
    // Les noms sans article gardent leur forme : « maman » comme un prénom.
    ['moi aimer maman', 'j’aime maman'],
  ])('« %s » → « %s »', (ids, attendu) => {
    expect(dire(ids)).toBe(attendu.replace(/’/g, "'"))
  })
})

describe('formulation — accord', () => {
  it('accorde l’adjectif au féminin quand le profil le demande', () => {
    expect(dire('moi content', 'feminin')).toBe('je suis contente')
    expect(dire('moi fatigue', 'feminin')).toBe('je suis fatiguée')
  })

  it('n’accorde pas après « avoir »', () => {
    expect(dire('moi fini', 'feminin')).toBe("j'ai fini")
  })

  it('accorde au genre d’un nom sujet, indépendamment du profil', () => {
    expect(dire('maman content')).toBe('maman est contente')
    expect(dire('papa content', 'feminin')).toBe('papa est content')
  })
})

describe('formulation — sujet autre que « moi »', () => {
  it.each([
    ['maman manger', 'maman mange'],
    ['maman manger pomme', 'maman mange une pomme'],
    ['professeur content', 'le professeur est content'],
    ['ami jouer', 'un ami joue'],
  ])('« %s » → « %s »', (ids, attendu) => {
    expect(dire(ids)).toBe(attendu)
  })
})

/**
 * La règle qui prime : ne rien inventer. Dans le doute, l'enfant entend ce
 * qu'il a composé, pas une phrase qu'on lui aurait prêtée.
 */
describe('formulation — dégradation', () => {
  it('ne donne pas de sujet à une phrase qui n’en a pas', () => {
    expect(dire('vouloir manger')).toBe('vouloir manger')
  })

  it('laisse un mot seul tel quel, sans article', () => {
    expect(dire('pomme')).toBe('pomme')
    expect(dire('moi')).toBe('moi')
    expect(dire('content')).toBe('content')
  })

  it('garde « moi » quand aucun verbe ne vient le conjuguer', () => {
    expect(dire('moi pomme')).toBe('moi pomme')
  })

  it('fait traverser tel quel un mot ajouté par le parent', () => {
    const doudou = makeMotPerso({ id: 'c1', mot: 'Doudou' })
    const mots = [
      { word: 'moi', lexiqueId: 'moi' },
      { word: 'vouloir', lexiqueId: 'vouloir' },
      { word: 'Doudou', lexiqueId: 'c1' },
    ]
    expect(formuler(mots, { accord: 'masculin', lexiquePerso: [doudou] })).toBe('je veux Doudou')
  })

  it('garde le libellé d’un mot inconnu du lexique', () => {
    expect(formuler([{ word: 'bonjour' }], { accord: 'masculin', lexiquePerso: [] })).toBe('bonjour')
  })
})

describe('realiser — élisions et contractions', () => {
  const r = (texte: string) => realiser(texte.split(' ').map((t) => ({ texte: t })))

  it.each([
    ['je ai', "j'ai"],
    ['je ne aime pas', "je n'aime pas"],
    ['de la eau', "de l'eau"],
    ['à le parc', 'au parc'],
    ['à les toilettes', 'aux toilettes'],
    ['de le pain', 'du pain'],
    // L'élision passe avant la contraction.
    ['à le avion', "à l'avion"],
  ])('« %s » → « %s »', (brut, attendu) => {
    expect(r(brut)).toBe(attendu)
  })
})
