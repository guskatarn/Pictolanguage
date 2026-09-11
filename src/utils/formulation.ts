import { EntreeLexique, MorphoNom, MorphoVerbe, Personne, ProfileSettings } from '../types'
import { AUXILIAIRES, trouverMot } from '../data/lexique'

/**
 * Formulation des phrases : « moi · vouloir · manger » → « je veux manger ».
 *
 * Une chaîne de huit fonctions pures, chacune prenant une phrase et en rendant
 * une nouvelle. Découpée ainsi pour qu'une orthophoniste puisse discuter une
 * règle à la fois (« la négation », « les articles ») et qu'un test désigne
 * l'étape fautive plutôt qu'un résultat faux au bout de la chaîne.
 *
 * **Règle de dégradation, qui prime sur toutes les autres : ne rien inventer.**
 * Un mot sans morphologie — ajouté par un parent, par exemple — traverse la
 * chaîne tel quel : « je veux Doudou » plutôt qu'une forme fabriquée. Une
 * phrase sans sujet n'en reçoit pas : « vouloir manger » reste « vouloir
 * manger », car supposer que l'enfant parle de lui serait lui prêter des mots.
 * Et une règle qui ne trouve pas ce qu'il lui faut s'abstient.
 *
 * Présent de l'indicatif seulement. Règles **à valider par une orthophoniste**,
 * comme le lexique qu'elles lisent.
 */

/** Ce que la barre de phrase transmet : le libellé touché et le mot qu'il porte. */
export interface MotAFormuler {
  word: string
  lexiqueId?: string
}

interface Jeton {
  texte: string
  /** Absent pour un mot inséré par la formulation (article, « ne », « en »…). */
  entree?: EntreeLexique
  /** Auxiliaire inséré par la copule : il se conjugue comme un verbe du lexique. */
  verbe?: MorphoVerbe
  /** Verbe fléchi : celui qui porte la personne et la négation. */
  conjugue?: boolean
}

/** Toujours le premier mot de la phrase quand il existe. */
interface Sujet {
  personne: Personne
  genre: 'm' | 'f'
}

interface Phrase {
  jetons: Jeton[]
  sujet?: Sujet
  negation: boolean
  accord: ProfileSettings['accord']
}

const morphoVerbe = (j: Jeton): MorphoVerbe | undefined =>
  j.verbe ?? (j.entree?.morpho?.classe === 'verbe' ? j.entree.morpho : undefined)

const estNegation = (j: Jeton) => j.entree?.classeGrammaticale === 'negation'

/** Premier mot après `depuis` qui n'est pas « non ». */
function suivant(jetons: Jeton[], depuis: number): number {
  let i = depuis + 1
  while (i < jetons.length && estNegation(jetons[i])) i += 1
  return i
}

/** Ce qui suit un sujet et le fera conjuguer : un verbe, un adjectif, un état. */
function estPredicat(j: Jeton | undefined): boolean {
  const m = j?.entree?.morpho
  return m?.classe === 'verbe' || m?.classe === 'adjectif' || (m?.classe === 'nom' && !!m.etat)
}

// ---- 1. Lire -------------------------------------------------------------

/** Retrouve derrière chaque case le mot du lexique, livré ou ajouté par le parent. */
function lire(mots: MotAFormuler[], lexiquePerso: EntreeLexique[]): Jeton[] {
  return mots.map(({ word, lexiqueId }) => {
    const entree = lexiqueId
      ? (trouverMot(lexiqueId) ?? lexiquePerso.find((e) => e.id === lexiqueId))
      : undefined
    return { texte: entree?.mot ?? word, entree }
  })
}

// ---- 2. Sujet ------------------------------------------------------------

/**
 * Un pronom en tête (« moi »), ou un nom en tête suivi de ce qu'il fait ou de
 * ce qu'il est (« maman · manger »). Ailleurs dans la phrase, un pronom reste
 * à sa forme tonique : l'enfant qui touche « donner · moi » ne dit pas « je ».
 */
function trouverSujet(phrase: Phrase): Phrase {
  const [premier] = phrase.jetons
  const m = premier?.entree?.morpho
  if (!m || phrase.jetons.length < 2) return phrase

  if (m.classe === 'pronom') {
    // L'accord du profil ne vaut que pour l'enfant lui-même.
    const genre = m.personne === 'je' && phrase.accord === 'feminin' ? 'f' : 'm'
    return { ...phrase, sujet: { personne: m.personne, genre } }
  }
  if (m.classe === 'nom' && estPredicat(phrase.jetons[suivant(phrase.jetons, 0)])) {
    return { ...phrase, sujet: { personne: m.pluriel ? 'ils' : 'il', genre: m.genre } }
  }
  return phrase
}

// ---- 3. Copule -----------------------------------------------------------

/**
 * Insère le verbe qui manque entre un sujet et ce qu'il est : « moi ·
 * content » → « je suis content », « moi · fini » → « j'ai fini », « moi ·
 * colère » → « je suis en colère ». Les locutions d'état sont lues dans le
 * lexique, jamais déduites.
 */
function insererCopule(phrase: Phrase): Phrase {
  if (!phrase.sujet) return phrase
  const i = suivant(phrase.jetons, 0)
  const m = phrase.jetons[i]?.entree?.morpho

  let insertion: Jeton[] = []
  if (m?.classe === 'adjectif') {
    const aux = AUXILIAIRES[m.copule ?? 'etre']
    insertion = [{ texte: aux.infinitif, verbe: aux }]
  } else if (m?.classe === 'nom' && m.etat) {
    const aux = AUXILIAIRES[m.etat.verbe]
    insertion = [{ texte: aux.infinitif, verbe: aux }]
    if (m.etat.prefixe) insertion.push({ texte: m.etat.prefixe })
  }
  if (insertion.length === 0) return phrase

  const jetons = [...phrase.jetons]
  jetons.splice(i, 0, ...insertion)
  return { ...phrase, jetons }
}

// ---- 4. Négation ---------------------------------------------------------

/**
 * « non » devient « ne … pas » autour du verbe fléchi, où que l'enfant l'ait
 * placé. Sans sujet ou sans verbe, il n'y a rien à nier : « non » reste
 * « non », qui est aussi une phrase complète.
 */
function extraireNegation(phrase: Phrase): Phrase {
  if (!phrase.sujet || !phrase.jetons.some(estNegation)) return phrase
  if (!phrase.jetons.some((j, k) => k > 0 && morphoVerbe(j))) return phrase
  return { ...phrase, jetons: phrase.jetons.filter((j) => !estNegation(j)), negation: true }
}

// ---- 5. Conjugaison ------------------------------------------------------

/**
 * Le premier verbe prend la personne du sujet ; ceux qui suivent restent à
 * l'infinitif (« je veux manger »). C'est aussi seulement maintenant que
 * « moi » devient « je » : sans verbe à conjuguer, « moi · pomme » reste
 * « moi pomme », et non « je pomme ».
 */
function conjuguer(phrase: Phrase): Phrase {
  const { sujet } = phrase
  if (!sujet) return phrase
  const i = phrase.jetons.findIndex((j, k) => k > 0 && morphoVerbe(j))
  if (i === -1) return phrase

  const jetons = [...phrase.jetons]
  const pronom = jetons[0].entree?.morpho
  if (pronom?.classe === 'pronom') jetons[0] = { ...jetons[0], texte: pronom.sujet }
  jetons[i] = { ...jetons[i], texte: morphoVerbe(jetons[i])!.present[sujet.personne], conjugue: true }
  if (phrase.negation) jetons.splice(i, 1, { texte: 'ne' }, jetons[i], { texte: 'pas' })
  return { ...phrase, jetons }
}

// ---- 6. Déterminants -----------------------------------------------------

function articleDefini({ genre, pluriel }: MorphoNom): string {
  return pluriel ? 'les' : genre === 'f' ? 'la' : 'le'
}

function articleIndefini({ genre, pluriel }: MorphoNom): string {
  return pluriel ? 'des' : genre === 'f' ? 'une' : 'un'
}

/**
 * Article d'un nom arrivé nu. Écrit sous forme **non contractée** (« à le »,
 * « de la ») : c'est `realiser` qui en fait « au », « du », « de l' ».
 */
function article(nom: MorphoNom, contexte: {
  sujet: boolean
  gouverneur?: MorphoVerbe
  nie: boolean
}): string[] {
  if (nom.determinant === 'aucun') return []
  // Un nom sujet est déterminé : « le professeur », jamais « du professeur ».
  if (contexte.sujet) {
    return [nom.determinant === 'indefini' ? articleIndefini(nom) : articleDefini(nom)]
  }
  if (nom.lieu && contexte.gouverneur?.regime) {
    return [contexte.gouverneur.regime === 'a' ? 'à' : 'de', articleDefini(nom)]
  }
  if (contexte.gouverneur?.complementDefini) return [articleDefini(nom)]
  // « je ne veux pas de pain » : sous la négation, l'indéfini et le partitif
  // se réduisent à « de ». Le défini, lui, se garde.
  if (contexte.nie && nom.determinant !== 'defini') return ['de']
  if (nom.determinant === 'defini') return [articleDefini(nom)]
  if (nom.determinant === 'indefini') return [articleIndefini(nom)]
  return nom.pluriel ? ['des'] : ['de', articleDefini(nom)]
}

/**
 * Seuls reçoivent un article le nom sujet et les compléments d'un verbe. Un
 * nom touché seul reste nu : l'enfant qui dit « pomme » ne dit pas « une
 * pomme », et le lui faire dire changerait ce qu'il a voulu désigner.
 */
function determiner(phrase: Phrase): Phrase {
  const jetons: Jeton[] = []
  let gouverneur: MorphoVerbe | undefined
  let fleche = false

  phrase.jetons.forEach((j, k) => {
    const m = j.entree?.morpho
    const sujet = k === 0 && !!phrase.sujet
    if (m?.classe === 'nom' && (sujet || gouverneur)) {
      const mots = article(m, { sujet, gouverneur, nie: phrase.negation && fleche })
      jetons.push(...mots.map((texte) => ({ texte })))
    }
    jetons.push(j)
    const v = morphoVerbe(j)
    if (v) gouverneur = v
    if (j.conjugue) fleche = true
  })
  return { ...phrase, jetons }
}

// ---- 7. Accord -----------------------------------------------------------

/**
 * L'adjectif attribut prend le genre du sujet : « je suis contente ». Pas
 * après « avoir » : « j'ai fini », quel que soit l'enfant.
 */
function accorder(phrase: Phrase): Phrase {
  if (phrase.sujet?.genre !== 'f') return phrase
  const jetons = phrase.jetons.map((j) => {
    const m = j.entree?.morpho
    if (m?.classe !== 'adjectif' || m.copule === 'avoir') return j
    return { ...j, texte: m.feminin }
  })
  return { ...phrase, jetons }
}

// ---- 8. Réalisation ------------------------------------------------------

const ELIDABLES = new Set(['je', 'ne', 'le', 'la', 'de', 'me', 'te', 'se', 'que'])
const CONTRACTIONS: Record<string, Record<string, string>> = {
  à: { le: 'au', les: 'aux' },
  de: { le: 'du', les: 'des' },
}

/** Le « h » est laissé de côté : muet ou aspiré, il ne se devine pas. */
const commenceParVoyelle = (mot: string) => /^[aeiouyàâäéèêëîïôöùûüœæ]/i.test(mot)

/**
 * Élisions et contractions, puis assemblage : « je ai » → « j'ai », « de la
 * eau » → « de l'eau », « à le parc » → « au parc ». L'élision passe d'abord :
 * « à le » ne se contracte pas devant une voyelle (« à l'hôpital »).
 */
export function realiser(jetons: { texte: string }[]): string {
  const mots = jetons.flatMap((j) => j.texte.split(' ')).filter(Boolean)
  const sortie: string[] = []

  for (let k = 0; k < mots.length; k += 1) {
    const mot = mots[k]
    const apres = mots[k + 1]
    if (apres !== undefined && ELIDABLES.has(mot.toLowerCase()) && commenceParVoyelle(apres)) {
      mots[k + 1] = `${mot.slice(0, -1)}'${apres}`
      continue
    }
    const contraction = apres !== undefined ? CONTRACTIONS[mot]?.[apres] : undefined
    const eliderait = apres === 'le' && commenceParVoyelle(mots[k + 2] ?? '')
    if (contraction && !eliderait) {
      mots[k + 1] = contraction
      continue
    }
    sortie.push(mot)
  }
  return sortie.join(' ')
}

// ---- Chaîne --------------------------------------------------------------

const ETAPES: ((phrase: Phrase) => Phrase)[] = [
  trouverSujet,
  insererCopule,
  extraireNegation,
  conjuguer,
  determiner,
  accorder,
]

/** Phrase à prononcer pour les mots composés par l'enfant. */
export function formuler(
  mots: MotAFormuler[],
  { accord, lexiquePerso }: { accord: ProfileSettings['accord']; lexiquePerso: EntreeLexique[] },
): string {
  let phrase: Phrase = { jetons: lire(mots, lexiquePerso), negation: false, accord }
  for (const etape of ETAPES) phrase = etape(phrase)
  return realiser(phrase.jetons)
}
