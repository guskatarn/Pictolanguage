import {
  EntreeLexique,
  MorphoAdjectif,
  MorphoNom,
  MorphoPronom,
  MorphoVerbe,
  Personne,
} from '../types'

/**
 * Lexique du vocabulaire livré : le **mot**, pas sa position.
 *
 * Chaque entrée porte sa classe grammaticale (codage couleur de la clé de
 * Fitzgerald) et, quand elle est nécessaire, sa morphologie (formulation des
 * phrases : « moi · vouloir · manger » → « je veux manger »).
 *
 * Fichier volontairement seul de son espèce : classes et morphologie sont deux
 * annotations linguistiques des mêmes mots, à relire **en une seule passe** par
 * une orthophoniste. Les répartir sur plusieurs fichiers imposerait autant de
 * revues du même contenu.
 *
 * Les ids sont applicatifs et stables. Ne jamais s'appuyer sur `arasaacId` pour
 * identifier un mot : trois mots partageaient jusqu'ici leur id ARASAAC avec un
 * autre emplacement du vocabulaire, et les pictogrammes personnalisés n'en ont
 * pas du tout.
 */

/** Formes du présent, dans l'ordre je / tu / il / nous / vous / ils. */
function present(
  formes: [string, string, string, string, string, string],
): Record<Personne, string> {
  const [je, tu, il, nous, vous, ils] = formes
  return { je, tu, il, nous, vous, ils }
}

function verbe(
  infinitif: string,
  formes: [string, string, string, string, string, string],
  extra: Omit<MorphoVerbe, 'classe' | 'infinitif' | 'present'> = {},
): MorphoVerbe {
  return { classe: 'verbe', infinitif, present: present(formes), ...extra }
}

function nom(
  genre: MorphoNom['genre'],
  determinant: MorphoNom['determinant'],
  extra: Omit<MorphoNom, 'classe' | 'genre' | 'determinant'> = {},
): MorphoNom {
  return { classe: 'nom', genre, determinant, ...extra }
}

function adjectif(
  masculin: string,
  feminin: string,
  copule: MorphoAdjectif['copule'] = 'etre',
): MorphoAdjectif {
  return { classe: 'adjectif', masculin, feminin, copule }
}

function pronom(sujet: string, tonique: string, personne: Personne): MorphoPronom {
  return { classe: 'pronom', sujet, tonique, personne }
}

/**
 * Auxiliaires de la formulation. Hors du lexique affiché : ils n'ont pas de
 * pictogramme et ne peuvent pas être touchés par l'enfant, mais la copule les
 * insère (« moi · content » → « je suis content »). Ils vivent ici pour que
 * toute la conjugaison de l'application se relise au même endroit.
 */
export const AUXILIAIRES = {
  etre: verbe('être', ['suis', 'es', 'est', 'sommes', 'êtes', 'sont']),
  avoir: verbe('avoir', ['ai', 'as', 'a', 'avons', 'avez', 'ont']),
}

export const LEXIQUE: EntreeLexique[] = [
  // ---- Pronoms ----------------------------------------------------------
  { id: 'moi', mot: 'moi', arasaacId: 6632, classeGrammaticale: 'pronom', theme: 'personnes',
    morpho: pronom('je', 'moi', 'je') },

  // ---- Verbes -----------------------------------------------------------
  { id: 'vouloir', mot: 'vouloir', arasaacId: 5441, classeGrammaticale: 'verbe', theme: 'actions',
    morpho: verbe('vouloir', ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'], { semiAuxiliaire: true }) },
  { id: 'aller', mot: 'aller', arasaacId: 8142, classeGrammaticale: 'verbe', theme: 'actions',
    morpho: verbe('aller', ['vais', 'vas', 'va', 'allons', 'allez', 'vont'], { semiAuxiliaire: true, regime: 'a' }) },
  { id: 'manger', mot: 'manger', arasaacId: 6456, classeGrammaticale: 'verbe', theme: 'besoins',
    morpho: verbe('manger', ['mange', 'manges', 'mange', 'mangeons', 'mangez', 'mangent']) },
  { id: 'boire', mot: 'boire', arasaacId: 6061, classeGrammaticale: 'verbe', theme: 'besoins',
    morpho: verbe('boire', ['bois', 'bois', 'boit', 'buvons', 'buvez', 'boivent']) },
  { id: 'dormir', mot: 'dormir', arasaacId: 6479, classeGrammaticale: 'verbe', theme: 'besoins',
    morpho: verbe('dormir', ['dors', 'dors', 'dort', 'dormons', 'dormez', 'dorment']) },
  { id: 'jouer', mot: 'jouer', arasaacId: 23392, classeGrammaticale: 'verbe', theme: 'actions',
    morpho: verbe('jouer', ['joue', 'joues', 'joue', 'jouons', 'jouez', 'jouent']) },
  { id: 'regarder', mot: 'regarder', arasaacId: 6564, classeGrammaticale: 'verbe', theme: 'actions',
    morpho: verbe('regarder', ['regarde', 'regardes', 'regarde', 'regardons', 'regardez', 'regardent']) },
  { id: 'ecouter', mot: 'écouter', arasaacId: 6572, classeGrammaticale: 'verbe', theme: 'actions',
    morpho: verbe('écouter', ['écoute', 'écoutes', 'écoute', 'écoutons', 'écoutez', 'écoutent']) },
  { id: 'aimer', mot: 'aimer', arasaacId: 11538, classeGrammaticale: 'verbe',
    morpho: verbe('aimer', ['aime', 'aimes', 'aime', 'aimons', 'aimez', 'aiment']) },
  { id: 'donner', mot: 'donner', arasaacId: 28431, classeGrammaticale: 'verbe',
    morpho: verbe('donner', ['donne', 'donnes', 'donne', 'donnons', 'donnez', 'donnent']) },

  // ---- Adjectifs --------------------------------------------------------
  { id: 'content', mot: 'content', arasaacId: 35547, classeGrammaticale: 'adjectif', theme: 'emotions',
    morpho: adjectif('content', 'contente') },
  { id: 'triste', mot: 'triste', arasaacId: 35545, classeGrammaticale: 'adjectif', theme: 'emotions',
    morpho: adjectif('triste', 'triste') },
  { id: 'fatigue', mot: 'fatigué', arasaacId: 35537, classeGrammaticale: 'adjectif', theme: 'emotions',
    morpho: adjectif('fatigué', 'fatiguée') },
  // Participe passé employé seul : « fini » se dit « j'ai fini », jamais « je suis fini ».
  { id: 'fini', mot: 'fini', arasaacId: 28429, classeGrammaticale: 'adjectif',
    morpho: adjectif('fini', 'finie', 'avoir') },

  // ---- Noms : besoins et états -----------------------------------------
  { id: 'aide', mot: 'aide', arasaacId: 19524, classeGrammaticale: 'nom', theme: 'besoins',
    morpho: nom('f', 'partitif') },
  // Locutions non dérivables : « j'ai peur », « je suis en colère ».
  { id: 'peur', mot: 'peur', arasaacId: 10261, classeGrammaticale: 'nom', theme: 'emotions',
    morpho: nom('f', 'aucun', { etat: { verbe: 'avoir' } }) },
  { id: 'colere', mot: 'colère', arasaacId: 35567, classeGrammaticale: 'nom', theme: 'emotions',
    morpho: nom('f', 'aucun', { etat: { verbe: 'etre', prefixe: 'en' } }) },

  // ---- Noms : aliments --------------------------------------------------
  { id: 'pain', mot: 'pain', arasaacId: 2494, classeGrammaticale: 'nom', theme: 'aliments',
    morpho: nom('m', 'partitif') },
  { id: 'eau', mot: 'eau', arasaacId: 32464, classeGrammaticale: 'nom', theme: 'aliments',
    morpho: nom('f', 'partitif') },
  { id: 'lait', mot: 'lait', arasaacId: 2445, classeGrammaticale: 'nom', theme: 'aliments',
    morpho: nom('m', 'partitif') },
  { id: 'pomme', mot: 'pomme', arasaacId: 2462, classeGrammaticale: 'nom', theme: 'aliments',
    morpho: nom('f', 'indefini') },
  { id: 'biscuit', mot: 'biscuit', arasaacId: 8312, classeGrammaticale: 'nom', theme: 'aliments',
    morpho: nom('m', 'indefini') },

  // ---- Noms : lieux -----------------------------------------------------
  { id: 'toilettes', mot: 'toilettes', arasaacId: 5921, classeGrammaticale: 'nom', theme: 'besoins',
    morpho: nom('f', 'defini', { pluriel: true, lieu: true }) },
  { id: 'ecole', mot: 'école', arasaacId: 3082, classeGrammaticale: 'nom', theme: 'lieux',
    morpho: nom('f', 'defini', { lieu: true }) },
  { id: 'maison', mot: 'maison', arasaacId: 6964, classeGrammaticale: 'nom', theme: 'lieux',
    morpho: nom('f', 'defini', { lieu: true }) },
  { id: 'parc', mot: 'parc', arasaacId: 2859, classeGrammaticale: 'nom', theme: 'lieux',
    morpho: nom('m', 'defini', { lieu: true }) },
  { id: 'salle-de-bain', mot: 'salle de bain', arasaacId: 33954, classeGrammaticale: 'nom', theme: 'lieux',
    morpho: nom('f', 'defini', { lieu: true }) },
  { id: 'cuisine', mot: 'cuisine', arasaacId: 10752, classeGrammaticale: 'nom', theme: 'lieux',
    morpho: nom('f', 'defini', { lieu: true }) },

  // ---- Noms : personnes -------------------------------------------------
  // « maman » et « papa » s'emploient sans article, comme un prénom.
  { id: 'maman', mot: 'maman', arasaacId: 2458, classeGrammaticale: 'nom', theme: 'personnes',
    morpho: nom('f', 'aucun') },
  { id: 'papa', mot: 'papa', arasaacId: 31146, classeGrammaticale: 'nom', theme: 'personnes',
    morpho: nom('m', 'aucun') },
  { id: 'ami', mot: 'ami', arasaacId: 25790, classeGrammaticale: 'nom', theme: 'personnes',
    morpho: nom('m', 'indefini') },
  { id: 'professeur', mot: 'professeur', arasaacId: 6556, classeGrammaticale: 'nom', theme: 'personnes',
    morpho: nom('m', 'defini') },

  // ---- Noms : objets ----------------------------------------------------
  { id: 'livre', mot: 'livre', arasaacId: 25191, classeGrammaticale: 'nom', theme: 'objets',
    morpho: nom('m', 'indefini') },
  { id: 'jouet', mot: 'jouet', arasaacId: 9813, classeGrammaticale: 'nom', theme: 'objets',
    morpho: nom('m', 'indefini') },
  { id: 'telephone', mot: 'téléphone', arasaacId: 26479, classeGrammaticale: 'nom', theme: 'objets',
    morpho: nom('m', 'defini') },
  { id: 'tablette', mot: 'tablette', arasaacId: 28099, classeGrammaticale: 'nom', theme: 'objets',
    morpho: nom('f', 'defini') },
  { id: 'voiture', mot: 'voiture', arasaacId: 2339, classeGrammaticale: 'nom', theme: 'objets',
    morpho: nom('f', 'defini') },

  // ---- Mots de service --------------------------------------------------
  // Sans morphologie : ils traversent la formulation tels quels. « non » est
  // en revanche lu par l'étape de négation, qui le repère à sa classe.
  { id: 'encore', mot: 'encore', arasaacId: 37163, classeGrammaticale: 'adverbe' },
  { id: 'oui', mot: 'oui', arasaacId: 5584, classeGrammaticale: 'social' },
  { id: 'non', mot: 'non', arasaacId: 5526, classeGrammaticale: 'negation' },
  { id: 'stop', mot: 'stop', arasaacId: 8289, classeGrammaticale: 'social' },
]

const PAR_ID = new Map(LEXIQUE.map((e) => [e.id, e]))

/** `undefined` pour un id inconnu : un tableau peut référencer un mot retiré. */
export function trouverMot(id: string): EntreeLexique | undefined {
  return PAR_ID.get(id)
}
